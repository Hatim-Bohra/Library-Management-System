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
  Prisma,
  LoanStatus,
  BookRequest,
} from '@repo/database';
import { FinesService } from '../fines/fines.service';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { BooksService } from '../books/books.service';

@Injectable()
export class RequestsService {
  constructor(
    private prisma: PrismaService,
    private finesService: FinesService,
    private booksService: BooksService,
  ) { }

  async create(userId: string, createRequestDto: CreateRequestDto) {
    const { bookId, type, address } = createRequestDto;

    // Validate Request Type specific logic
    if (type === BookRequestType.RETURN) {
      const activeLoan = await this.prisma.loan.findFirst({
        where: {
          userId,
          bookId,
          status: LoanStatus.ACTIVE
        }
      });
      if (!activeLoan) {
        throw new BadRequestException('No active loan found for this book');
      }
    } else {
      // Check availability for PICKUP/DELIVERY
      const availableCopies = await this.prisma.inventoryItem.count({
        where: {
          bookId,
          status: ItemStatus.AVAILABLE,
        },
      });

      if (availableCopies === 0) {
        throw new BadRequestException('No copies available for request');
      }
    }

    // Check if book exists
    const book = await this.prisma.book.findUnique({
      where: { id: bookId },
    });
    if (!book) {
      throw new NotFoundException('Book not found');
    }

    // Validate Return Date if present
    if (createRequestDto.returnDate) {
      const returnDate = new Date(createRequestDto.returnDate);
      const today = new Date();
      const maxDate = new Date();
      maxDate.setDate(today.getDate() + 14);

      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      if (returnDate < tomorrow) {
        throw new BadRequestException('Return date must be in the future');
      }

      // Reset time for comparison or use strict comparison
      if (returnDate > maxDate) {
        throw new BadRequestException('Cannot request for more than 14 days');
      }
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
        returnDate: createRequestDto.returnDate ? new Date(createRequestDto.returnDate) : undefined,
      },
    });
  }

  findAll(role: Role, userId: string, query?: any) {
    const { page = 1, limit = 10, status } = query || {};
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
      const statuses = status.split(',').map((s: string) => s.trim());
      if (statuses.length > 0) {
        where.status = { in: statuses };
      }
    }

    if (role === Role.LIBRARIAN || role === Role.ADMIN) {
      return this.prisma.bookRequest.findMany({
        skip,
        take: Number(limit),
        where,
        include: {
          book: true,
          user: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    // For regular users, force userId check
    return this.prisma.bookRequest.findMany({
      skip,
      take: Number(limit),
      where: {
        userId,
        ...where
      },
      include: {
        book: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPendingCount() {
    const count = await this.prisma.bookRequest.count({
      where: {
        status: BookRequestStatus.PENDING,
      },
    });
    return { count };
  }

  async approve(id: string) {

    const request = (await this.prisma.bookRequest.findUnique({
      where: { id },
    }));

    if (!request) throw new NotFoundException('Request not found');
    if (request.status !== BookRequestStatus.PENDING) {
      throw new BadRequestException('Request is not pending');
    }

    // Transaction: Find available copy, reserve it, approve request
    const result = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {

      if (request.type === BookRequestType.RETURN) {
        // 1. Find Active Loan
        const loan = await tx.loan.findFirst({
          where: {
            userId: request.userId,
            bookId: request.bookId,
            status: LoanStatus.ACTIVE
          }
        });

        if (!loan) throw new BadRequestException('No active loan to return');

        // 2. Mark Loan as Returned
        await tx.loan.update({
          where: { id: loan.id },
          data: {
            status: LoanStatus.RETURNED,
            returnedAt: new Date()
          }
        });

        // 3. Update Inventory (Find an ISSUED item and make it AVAILABLE)
        // Ideally we know exactly which item, but for now we pick one.
        const issuedItem = await tx.inventoryItem.findFirst({
          where: {
            bookId: request.bookId,
            status: ItemStatus.ISSUED
          }
        });

        if (issuedItem) {
          await tx.inventoryItem.update({
            where: { id: issuedItem.id },
            data: { status: ItemStatus.AVAILABLE }
          });
        }

        // 4. Fulfillment
        return tx.bookRequest.update({
          where: { id },
          data: { status: BookRequestStatus.FULFILLED }
        });
      }

      // Normal Borrow Flow
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

    // Update availability
    await this.booksService.checkAvailability(request.bookId);

    return result;
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

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Fetch Applicable Rule
      // Ideally we get the user's role. For now assuming MEMBER or fetching user role if needed.
      // But wait, request.user isn't included. We need to fetch it or rely on userId.
      // Let's fetch user role or just assume default rule behavior if role is strictly tied to user.
      const user = await tx.user.findUnique({ where: { id: request.userId } });
      const rule = user
        ? await this.finesService.getApplicableRule(user.role)
        : null;

      // Create Loan
      // Calculate due date based on requested duration
      let dueDate = new Date();
      if (request.returnDate) {
        // Calculate duration requested in milliseconds
        const requestedDuration = new Date(request.returnDate).getTime() - new Date(request.createdAt).getTime();
        // New due date is NOW + requested duration
        dueDate = new Date(Date.now() + requestedDuration);
      } else {
        // Default 14 days
        dueDate.setDate(dueDate.getDate() + 14);
      }

      await tx.loan.create({
        data: {
          userId: request.userId,
          bookId: request.bookId,
          dueDate,
          status: LoanStatus.ACTIVE,
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
        data: { status: ItemStatus.ISSUED },
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

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Fetch Applicable Rule
      const user = await tx.user.findUnique({ where: { id: request.userId } });
      const rule = user
        ? await this.finesService.getApplicableRule(user.role)
        : null;

      // Create Loan (Timer starts NOW)
      let dueDate = new Date();
      if (request.returnDate) {
        // Calculate duration requested
        const requestedDuration = new Date(request.returnDate).getTime() - new Date(request.createdAt).getTime();
        dueDate = new Date(Date.now() + requestedDuration);
      } else {
        dueDate.setDate(dueDate.getDate() + 14);
      }

      await tx.loan.create({
        data: {
          userId: request.userId,
          bookId: request.bookId,
          dueDate,
          status: LoanStatus.ACTIVE,
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
        data: { status: ItemStatus.ISSUED },
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
