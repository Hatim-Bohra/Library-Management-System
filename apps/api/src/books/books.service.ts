import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateBookDto, UpdateBookDto } from './dto';
import { Book } from '@prisma/client';
import { GetBooksQueryDto } from './dto/get-books-query.dto';

@Injectable()
export class BooksService {
  constructor(private prisma: PrismaService) { }

  async create(dto: CreateBookDto): Promise<Book> {
    const book = await this.prisma.book.create({
      data: {
        ...dto,
      },
    });
    await this.checkAvailability(book.id);
    return book;
  }

  findAll(query: { q?: string; page?: number; limit?: number }) {
    const { q, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    return this.prisma.book.findMany({
      skip,
      take: limit,
      where: q
        ? {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { author: { name: { contains: q, mode: 'insensitive' } } },
            { isbn: { contains: q, mode: 'insensitive' } },
          ],
        }
        : undefined,
      include: {
        author: true,
        inventoryItems: true,
      },
    });
  }

  async findOne(id: string): Promise<Book> {
    const book = await this.prisma.book.findUnique({
      where: { id },
      include: {
        author: true,
        category: true,
      },
    });
    if (!book) throw new NotFoundException(`Book with ID ${id} not found`);
    return book;
  }

  async update(id: string, dto: UpdateBookDto, userId: string): Promise<Book> {
    const oldBook = await this.findOne(id);

    const updatedBook = await this.prisma.book.update({
      where: { id },
      data: {
        ...dto,
      },
    });

    // Auto-disable logic check
    await this.checkAvailability(id);

    // Audit Log for Manual Override of Availability
    if (
      dto.isAvailable !== undefined &&
      dto.isAvailable !== oldBook.isAvailable
    ) {
      await this.prisma.auditLog.create({
        data: {
          action: 'BOOK_OVERRIDE',
          entityId: id,
          entityType: 'Book',
          performedBy: userId,
          details: {
            field: 'isAvailable',
            oldValue: oldBook.isAvailable,
            newValue: dto.isAvailable,
            reason: 'Manual Override',
          },
        },
      });
    }

    return updatedBook;
  }

  async remove(id: string): Promise<void> {
    await this.prisma.book.delete({
      where: { id },
    });
  }

  async checkAvailability(bookId: string) {
    const book = await this.prisma.book.findUnique({ where: { id: bookId } });
    if (!book) return;

    if (book.copies === 0 && book.isAvailable) {
      await this.prisma.book.update({
        where: { id: bookId },
        data: { isAvailable: false },
      });
    }
  }
}
