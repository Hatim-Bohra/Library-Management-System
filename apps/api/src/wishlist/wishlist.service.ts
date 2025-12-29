import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class WishlistService {
    constructor(private readonly prisma: PrismaService) { }

    async getWishlist(userId: string) {
        return this.prisma.wishlist.findMany({
            where: { userId },
            include: {
                book: {
                    select: {
                        id: true,
                        title: true,
                        author: { select: { name: true } },
                        coverUrl: true,
                        isAvailable: true,
                        rentalPrice: true,
                        isbn: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async checkStatus(userId: string, bookId: string) {
        const item = await this.prisma.wishlist.findUnique({
            where: {
                userId_bookId: { userId, bookId }
            }
        });
        return { isWishlisted: !!item };
    }

    async addToWishlist(userId: string, bookId: string) {
        // Check if book exists
        const book = await this.prisma.book.findUnique({ where: { id: bookId } });
        if (!book) throw new NotFoundException('Book not found');

        // Create or ignore if exists (idempotent)
        return this.prisma.wishlist.upsert({
            where: {
                userId_bookId: { userId, bookId }
            },
            update: {},
            create: {
                userId,
                bookId
            }
        });
    }

    async removeFromWishlist(userId: string, bookId: string) {
        return this.prisma.wishlist.delete({
            where: {
                userId_bookId: { userId, bookId }
            }
        }).catch(() => {
            // Ignore if error (not found)
            return { count: 0 };
        });
    }
}
