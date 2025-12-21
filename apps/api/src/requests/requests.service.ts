import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { RejectRequestDto } from './dto/reject-request.dto';
import { ItemStatus, BookRequestStatus, Role, BookRequestType } from '@repo/database';

@Injectable()
export class RequestsService {
    constructor(private prisma: PrismaService) { }

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
            }
        });

        if (existingRequest) {
            throw new BadRequestException('You already have a pending request for this book');
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

    async findAll(role: Role, userId: string) {
        if (role === Role.LIBRARIAN || role === Role.ADMIN) {
            return this.prisma.bookRequest.findMany({
                include: {
                    book: true,
                    user: true,
                },
                orderBy: { createdAt: 'desc' },
            });
        }

        return this.prisma.bookRequest.findMany({
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
                throw new BadRequestException('No copies available to fulfill this request');
            }

            // Reserve the copy
            await tx.inventoryItem.update({
                where: { id: availableCopy.id },
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
            include: { inventoryItem: true }
        });

        if (!request) throw new NotFoundException('Request not found');
        if (request.status !== BookRequestStatus.APPROVED) {
            throw new BadRequestException('Request must be approved before collection');
        }
        if (!request.inventoryItemId) {
            throw new BadRequestException('No inventory item allocated to this request');
        }

        return this.prisma.$transaction(async (tx) => {
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
                }
            });

            // Update Inventory Status to ISSUED
            await tx.inventoryItem.update({
                where: { id: request.inventoryItemId! },
                data: { status: 'ISSUED' /*, location? remove from shelf? */ }
            });

            // Mark request as FULFILLED
            return tx.bookRequest.update({
                where: { id },
                data: { status: BookRequestStatus.FULFILLED }
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
            data: { status: BookRequestStatus.OUT_FOR_DELIVERY }
        });
    }

    async confirmDelivery(id: string) {
        const request = await this.prisma.bookRequest.findUnique({
            where: { id },
            include: { inventoryItem: true }
        });

        if (!request) throw new NotFoundException('Request not found');
        if (request.status !== BookRequestStatus.OUT_FOR_DELIVERY) {
            throw new BadRequestException('Request must be out for delivery before confirmation');
        }
        if (!request.inventoryItemId) {
            throw new BadRequestException('No inventory item allocated');
        }

        return this.prisma.$transaction(async (tx) => {
            // Create Loan (Timer starts NOW)
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 14);

            await tx.loan.create({
                data: {
                    userId: request.userId,
                    bookId: request.bookId,
                    dueDate,
                    status: 'ACTIVE',
                }
            });

            // Update Inventory
            await tx.inventoryItem.update({
                where: { id: request.inventoryItemId! },
                data: { status: 'ISSUED' }
            });

            // Fulfill Request
            return tx.bookRequest.update({
                where: { id },
                data: { status: BookRequestStatus.FULFILLED }
            });
        });
    }

    async failDelivery(id: string, reason: string) {
        const request = await this.prisma.bookRequest.findUnique({
            where: { id }
        });

        if (!request) throw new NotFoundException('Request not found');
        if (request.status !== BookRequestStatus.OUT_FOR_DELIVERY) {
            throw new BadRequestException('Request must be out for delivery to fail');
        }

        return this.prisma.bookRequest.update({
            where: { id },
            data: {
                status: BookRequestStatus.DELIVERY_FAILED,
                rejectionReason: reason
            }
        });
    }
}
