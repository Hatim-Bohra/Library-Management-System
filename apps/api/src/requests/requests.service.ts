import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { RejectRequestDto } from './dto/reject-request.dto';
import {
  ItemStatus,
  BookRequestStatus,
  Role,
  BookRequestType,
} from '@repo/database';
import { FinesService } from '../fines/fines.service';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@Injectable()
export class RequestsService {
  constructor(
    private prisma: PrismaService,
    private finesService: FinesService,
  ) {}

  async create(userId: string, createRequestDto: CreateRequestDto) {
    const { bookId, type, address } = createRequestDto;

    // Check if book exists
    const book = await this.prisma.book.findUnique({
      where: { id: bookId },
    });
    if (!book) {
      throw new NotFoundException('Book not found');
    }

    // Check availability
    const availableCopies = await this.prisma.inventoryItem.count({
      where: {
        bookId,
        status: ItemStatus.AVAILABLE,
      },
    });

    if (availableCopies === 0) {
      throw new BadRequestException('No copies available for request');
    }

    // Check if user already has a pending request for this book
    const existingRequest = await this.prisma.bookRequest.findFirst({
      where: {
        userId,
        bookId,
        status: BookRequestStatus.PENDING,
      },
    });

    if (existingRequest) {
      throw new BadRequestException(
        'You already have a pending request for this book',
      );
    }

    return this.prisma.bookRequest.create({
      data: {
        userId,
        bookId,
        type,
        address,
        status: BookRequestStatus.PENDING,
      },
    });
  }

  async findAll(role: Role, userId: string, query?: PaginationQueryDto) {
    const { page = 1, limit = 10 } = query || {};
    const skip = (page - 1) * limit;

    if (role === Role.LIBRARIAN || role === Role.ADMIN) {
      return this.prisma.bookRequest.findMany({
        skip,
        take: limit,
        include: {
          book: true,
          user: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return this.prisma.bookRequest.findMany({
      skip,
      take: limit,
      where: { userId },
      include: {
        book: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approve(id: string) {
    const request = await this.prisma.bookRequest.findUnique({
      where: { id },
    });

    if (!request) throw new NotFoundException('Request not found');
    if (request.status !== BookRequestStatus.PENDING) {
      throw new BadRequestException('Request is not pending');
    }

    // Transaction: Find available copy, reserve it, approve request
    return this.prisma.$transaction(async (tx) => {
      const availableCopy = await tx.inventoryItem.findFirst({
        where: {
          bookId: request.bookId,
          status: ItemStatus.AVAILABLE,
        },
      });

      if (!availableCopy) {
        throw new BadRequestException(
          'No copies available to fulfill this request',
        );
      }

      // Reserve the copy - Optimistic Locking
      // We ensure it is STILL available at the moment of update.
      // If another transaction reserved it in the meantime, this will throw P2025 (Record Not Found)
      // preventing double booking.
      await tx.inventoryItem.update({
        where: {
          id: availableCopy.id,
          status: ItemStatus.AVAILABLE,
        },
        data: { status: ItemStatus.RESERVED },
      });

      // Approve request and link copy
      return tx.bookRequest.update({
        where: { id },
        data: {
          status: BookRequestStatus.APPROVED,
          inventoryItemId: availableCopy.id,
        },
      });
    });
  }

  async reject(id: string, rejectRequestDto: RejectRequestDto) {
    const request = await this.prisma.bookRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Request not found');
    if (request.status !== BookRequestStatus.PENDING) {
      throw new BadRequestException('Request is not pending');
    }

    return this.prisma.bookRequest.update({
      where: { id },
      data: {
        status: BookRequestStatus.REJECTED,
        rejectionReason: rejectRequestDto.reason,
      },
    });
  }

  async collect(id: string) {
    const request = await this.prisma.bookRequest.findUnique({
      where: { id },
      include: { inventoryItem: true },
    });

    if (!request) throw new NotFoundException('Request not found');
    if (request.status !== BookRequestStatus.APPROVED) {
      throw new BadRequestException(
        'Request must be approved before collection',
      );
    }
    if (request.type !== BookRequestType.PICKUP) {
      throw new BadRequestException(
        'Only pickup requests can be collected. Use dispatch/deliver for delivery requests.',
      );
    }
    if (!request.inventoryItemId) {
      throw new BadRequestException(
        'No inventory item allocated to this request',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // Fetch Applicable Rule
      // Ideally we get the user's role. For now assuming MEMBER or fetching user role if needed.
      // But wait, request.user isn't included. We need to fetch it or rely on userId.
      // Let's fetch user role or just assume default rule behavior if role is strictly tied to user.
      const user = await tx.user.findUnique({ where: { id: request.userId } });
      const rule = user
        ? await this.finesService.getApplicableRule(user.role)
        : null;

      // Create Loan
      // Calculate due date (e.g., 14 days from now)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);

      await tx.loan.create({
        data: {
          userId: request.userId,
          bookId: request.bookId,
          dueDate,
          status: 'ACTIVE',
          // Snapshot Rule
          ruleGracePeriod: rule?.gracePeriod ?? 0,
          ruleDailyRate: rule?.dailyRate ?? 0,
          ruleMaxFine: rule?.maxFine ?? null,
          ruleLostFee: rule?.lostBookProcessingFee ?? 0,
        },
      });

      // Update Inventory Status to ISSUED
      await tx.inventoryItem.update({
        where: { id: request.inventoryItemId! },
        data: { status: 'ISSUED' /*, location? remove from shelf? */ },
      });

      // Mark request as FULFILLED
      return tx.bookRequest.update({
        where: { id },
        data: { status: BookRequestStatus.FULFILLED },
      });
    });
  }
  async dispatch(id: string) {
    const request = await this.prisma.bookRequest.findUnique({
      where: { id },
    });

    if (!request) throw new NotFoundException('Request not found');
    if (request.status !== BookRequestStatus.APPROVED) {
      throw new BadRequestException('Request must be approved before dispatch');
    }
    if (request.type !== BookRequestType.DELIVERY) {
      throw new BadRequestException('Only delivery requests can be dispatched');
    }

    return this.prisma.bookRequest.update({
      where: { id },
      data: { status: BookRequestStatus.OUT_FOR_DELIVERY },
    });
  }

  async confirmDelivery(id: string) {
    const request = await this.prisma.bookRequest.findUnique({
      where: { id },
      include: { inventoryItem: true },
    });

    if (!request) throw new NotFoundException('Request not found');
    if (request.status !== BookRequestStatus.OUT_FOR_DELIVERY) {
      throw new BadRequestException(
        'Request must be out for delivery before confirmation',
      );
    }
    if (!request.inventoryItemId) {
      throw new BadRequestException('No inventory item allocated');
    }

    return this.prisma.$transaction(async (tx) => {
      // Fetch Applicable Rule
      const user = await tx.user.findUnique({ where: { id: request.userId } });
      const rule = user
        ? await this.finesService.getApplicableRule(user.role)
        : null;

      // Create Loan (Timer starts NOW)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);

      await tx.loan.create({
        data: {
          userId: request.userId,
          bookId: request.bookId,
          dueDate,
          status: 'ACTIVE',
          // Snapshot Rule
          ruleGracePeriod: rule?.gracePeriod ?? 0,
          ruleDailyRate: rule?.dailyRate ?? 0,
          ruleMaxFine: rule?.maxFine ?? null,
          ruleLostFee: rule?.lostBookProcessingFee ?? 0,
        },
      });

      // Update Inventory
      await tx.inventoryItem.update({
        where: { id: request.inventoryItemId! },
        data: { status: 'ISSUED' },
      });

      // Fulfill Request
      return tx.bookRequest.update({
        where: { id },
        data: { status: BookRequestStatus.FULFILLED },
      });
    });
  }

  async failDelivery(id: string, reason: string) {
    const request = await this.prisma.bookRequest.findUnique({
      where: { id },
    });

    if (!request) throw new NotFoundException('Request not found');
    if (request.status !== BookRequestStatus.OUT_FOR_DELIVERY) {
      throw new BadRequestException('Request must be out for delivery to fail');
    }

    return this.prisma.bookRequest.update({
      where: { id },
      data: {
        status: BookRequestStatus.DELIVERY_FAILED,
        rejectionReason: reason,
      },
    });
  }
}
