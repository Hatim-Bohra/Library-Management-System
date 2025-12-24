import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateBookDto, UpdateBookDto } from './dto';
import { Book } from '@prisma/client';
import { GetBooksQueryDto } from './dto/get-books-query.dto';

import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class BooksService {
  constructor(
    private prisma: PrismaService,
    private inventoryService: InventoryService,
  ) { }

  async create(dto: CreateBookDto, userId: string): Promise<Book> {
    const { authorName, copies, ...bookData } = dto;

    try {
      let author = await this.prisma.author.findFirst({
        where: { name: { equals: authorName, mode: 'insensitive' } },
      });

      if (!author) {
        author = await this.prisma.author.create({
          data: { name: authorName },
        });
      }

      // Initialize with 0 copies
      const createData = {
        ...bookData,
        authorId: author.id,
        copies: 0,
      };

      const book = await this.prisma.book.create({
        data: createData,
      });

      // Create Inventory Items
      const copiesToCreate = copies || 1;
      for (let i = 0; i < copiesToCreate; i++) {
        await this.inventoryService.addCopy(book.id, {
          barcode: `${book.isbn}-${i + 1}`,
          location: 'Main Stacks',
        }, userId);
      }

      await this.checkAvailability(book.id);

      return this.findOne(book.id);
    } catch (error) {
      // Log the error for debugging but rethrow
      // In production, use a Logger service
      console.error('Error creating book:', error);
      throw error;
    }
  }

  findAll(query: GetBooksQueryDto) {
    const { q, categoryId, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { author: { name: { contains: q, mode: 'insensitive' } } },
        { isbn: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    return this.prisma.book.findMany({
      skip,
      take: Number(limit),
      where,
      include: {
        author: true,
        category: true,
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
    const availableCount = await this.prisma.inventoryItem.count({
      where: {
        bookId,
        status: 'AVAILABLE',
      },
    });

    await this.prisma.book.update({
      where: { id: bookId },
      data: { isAvailable: availableCount > 0 },
    });
  }
}
