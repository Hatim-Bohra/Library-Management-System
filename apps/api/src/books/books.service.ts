import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateBookDto, UpdateBookDto } from './dto';
import { Book } from '@prisma/client';
import { GetBooksQueryDto } from './dto/get-books-query.dto';

import { InventoryService } from '../inventory/inventory.service';
import { parse } from 'csv-parse/sync';
import axios from 'axios';
import { load } from 'cheerio';

@Injectable()
export class BooksService {
  constructor(
    private prisma: PrismaService,
    private inventoryService: InventoryService,
  ) { }

  async importBooks(file: Express.Multer.File, userId: string) {
    if (!file) throw new BadRequestException('No file uploaded');

    const csvData = file.buffer.toString('utf-8');
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
    });

    const results = {
      success: 0,
      errors: [] as string[],
    };

    // Parallel processing could be faster, but sequential is safer for duplicates/relations creation race conditions
    for (const [index, row] of records.entries()) {
      const line = index + 2; // +1 for header, +1 for 0-index
      const msgRow = row as Record<string, any>;
      try {
        // Normalize keys to support variations (Title vs Book, Genre vs Genres)
        // Helper to find value case-insensitively or by alias
        const getField = (keys: string[]) => {
          const rowKeys = Object.keys(msgRow);
          for (const k of keys) {
            // Exact match
            if (msgRow[k] !== undefined) return msgRow[k];
            // Case insensitive match
            const foundKey = rowKeys.find(rk => rk.toLowerCase() === k.toLowerCase());
            if (foundKey && msgRow[foundKey] !== undefined) return msgRow[foundKey];
          }
          return undefined;
        };

        const Title = getField(['Title', 'Book', 'Name']);
        const Author = getField(['Author', 'Authors', 'Writer']);
        const ISBN = getField(['ISBN', 'isbn13', 'isbn10']); // If missing, we might auto-generate? No, usually required for unique ID.
        const Genre = getField(['Genre', 'Genres', 'Category']);
        const Description = getField(['Description', 'Summary', 'Plot']);
        const CoverUrl = getField(['CoverUrl', 'Cover', 'Image', 'Url']);
        const RentalPrice = getField(['RentalPrice', 'Price', 'Cost']);
        const Copies = getField(['Copies', 'Stock', 'Quantity']);

        // Validation - flexible
        if (!Title || !Author) {
          // Skip if absolutely critical info missing. 
          // If ISBN missing, we can maybe generate a fake one if strictly needed? 
          // Let's enforce Title/Author at least.
          throw new Error('Missing required fields (Title or Author)');
        }

        // If ISBN missing, generate one for "custom" books
        const finalISBN = ISBN || `AUTO-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // Check if ISBN exists
        const existingBook = await this.prisma.book.findUnique({ where: { isbn: finalISBN } });
        if (existingBook) {
          throw new Error(`ISBN ${finalISBN} already exists`);
        }

        // Handle Category (Genre)
        const genreName = Genre || 'General';
        let category = await this.prisma.category.findUnique({ where: { name: genreName } });
        if (!category) {
          category = await this.prisma.category.create({ data: { name: genreName } });
        }

        // Handle Author
        let author = await this.prisma.author.findFirst({ where: { name: { equals: Author, mode: 'insensitive' } } });
        if (!author) {
          author = await this.prisma.author.create({ data: { name: Author } });
        }

        // Create Book
        const book = await this.prisma.book.create({
          data: {
            title: Title,
            isbn: finalISBN,
            authorId: author.id,
            categoryId: category.id,
            description: Description || 'No description available.',
            coverUrl: CoverUrl || '',
            rentalPrice: Number(RentalPrice) || 1.99, // Default price
            publishedYear: new Date().getFullYear(),
            copies: 0,
          }
        });

        // Add Inventory
        const copiesCount = Number(Copies) || 1;
        for (let i = 0; i < copiesCount; i++) {
          await this.inventoryService.addCopy(book.id, {
            barcode: `${book.isbn}-${i + 1}`,
            location: 'Main Stacks'
          }, userId);
        }

        // Update availability
        await this.checkAvailability(book.id);

        results.success++;
      } catch (error: any) {
        results.errors.push(`Line ${line}: ${error.message}`);
      }
    }

    return results;
  }

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
        coverImageSize: bookData.coverImageSize,
        coverImageMime: bookData.coverImageMime,
        categoryId: dto.categoryId,
        authorId: author.id,
        price: bookData.price || 0,
        rentalPrice: bookData.rentalPrice || 0,
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

  async resolveCoverUrl(id: string): Promise<string> {
    const book = await this.prisma.book.findUnique({ where: { id } });
    if (!book) throw new NotFoundException('Book not found');

    // If it's already an image URL (simple check) or not from the "bad" domain pattern, return it.
    // However, if the user explicitly requests resolution, we might want to check anyway. 
    // But to save resources, if it doesn't look like a Goodreads PAGE, we skip.
    if (!book.coverUrl || !book.coverUrl.includes('goodreads.com/book/show/')) {
      return book.coverUrl || '';
    }

    try {
      // Scrape the Goodreads page
      const { data } = await axios.get(book.coverUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        },
        timeout: 5000,
      });

      const $ = load(data);
      // Try og:image first
      let imageUrl = $('meta[property="og:image"]').attr('content');

      // Fallback to finding the image by id strictly
      if (!imageUrl) {
        imageUrl = $('#coverImage').attr('src');
      }

      if (imageUrl) {
        // Update the database
        await this.prisma.book.update({
          where: { id },
          data: { coverUrl: imageUrl },
        });
        return imageUrl;
      }
    } catch (error) {
      console.warn(`Failed to resolve cover for book ${id} (${book.title}):`, error instanceof Error ? error.message : error);
      // Do NOT rethrow, just return the original URL so the frontend doesn't crash
      return book.coverUrl || '';
    }

    return book.coverUrl || '';
  }
}
