import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
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
      // 0. Validate Category
      const category = await this.prisma.category.findUnique({ where: { id: dto.categoryId } });
      if (!category) {
        throw new NotFoundException(`Category with ID ${dto.categoryId} not found`);
      }

      // 1. Check if ISBN exists
      const existingBook = await this.prisma.book.findUnique({
        where: { isbn: dto.isbn },
      });
      if (existingBook) {
        throw new ConflictException('Book with this ISBN already exists');
      }

      // 2. Resolve Author
      let author = await this.prisma.author.findFirst({
        where: { name: { equals: authorName, mode: 'insensitive' } },
      });

      if (!author) {
        author = await this.prisma.author.create({
          data: { name: authorName },
        });
      }

      // 3. Create Book
      const createData = {
        title: bookData.title,
        isbn: bookData.isbn,
        publishedYear: bookData.publishedYear,
        description: bookData.description,
        coverUrl: bookData.coverUrl,
        categoryId: dto.categoryId,
        authorId: author.id,
        copies: 0, // Will be updated by inventory
      };

      const book = await this.prisma.book.create({
        data: createData,
      });

      // 4. Create Inventory Items
      // Using a loop for clean barcode generation logic
      const copiesToCreate = copies || 1;
      for (let i = 0; i < copiesToCreate; i++) {
        const barcode = `${book.isbn}-${i + 1}`;
        // Check if barcode exists (paranoid check for orphans)
        const existingItem = await this.prisma.inventoryItem.findUnique({ where: { barcode } });
        if (existingItem) {
          // Edge case: Barcode taken. Append random suffix or handle error?
          // For now, logging and skipping or throwing better error.
          console.warn(`Barcode ${barcode} collision. Skipping.`);
          continue;
          // Alternatively: throw new ConflictException(`Barcode ${barcode} already exists`);
        }

        await this.inventoryService.addCopy(book.id, {
          barcode: barcode,
          location: 'Main Stacks',
        }, userId);
      }

      // 5. Update Availability
      await this.checkAvailability(book.id);

      return this.findOne(book.id);
    } catch (error: any) {
      if (error.code === 'P2002') {
        const fields = error.meta?.target ? ` (${error.meta.target})` : '';
        throw new ConflictException(`Unique constraint violation${fields}. Possibly ISBN or Barcode.`);
      }
      if (error.code === 'P2003') {
        throw new NotFoundException(`Foreign key constraint failed${error.meta?.field_name ? ` (${error.meta.field_name})` : ''}. Likely invalid Category or Author.`);
      }
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

    const { authorName, copies, ...bookData } = dto;
    let authorId = oldBook.authorId;

    // Handle Author Update if provided
    if (authorName) {
      let author = await this.prisma.author.findFirst({
        where: { name: { equals: authorName, mode: 'insensitive' } },
      });
      if (!author) {
        author = await this.prisma.author.create({ data: { name: authorName } });
      }
      authorId = author.id;
    }

    // Checking Category if provided
    if (bookData.categoryId) {
      const category = await this.prisma.category.findUnique({ where: { id: bookData.categoryId } });
      if (!category) throw new NotFoundException(`Category not found`);
    }

    const updatedBook = await this.prisma.book.update({
      where: { id },
      data: {
        ...bookData,
        authorId,
        // copies: we don't update copies directly usually, but logic could be added if needed.
        // For now, ignoring copies in update to avoid complex inventory logic override.
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
