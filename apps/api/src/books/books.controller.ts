import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors, // Added UseInterceptors
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager'; // Added CacheInterceptor, CacheTTL
import { BooksService } from './books.service';
import { CreateBookDto, UpdateBookDto } from './dto';
import { GetCurrentUserId, Public, Roles } from '../auth/decorators';
import { Role } from '@prisma/client';
import { RolesGuard } from '../auth/guards'; // Ensure this is exported or imported correctly
import { ApiBearerAuth, ApiTags, ApiOperation, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto'; // Added PaginationQueryDto
import { GetBooksQueryDto } from './dto/get-books-query.dto';

@ApiTags('Books')
@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) { }

  @Roles(Role.ADMIN, Role.LIBRARIAN)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Create a new book (Admin/Librarian)' })
  @ApiCreatedResponse({ description: 'The book has been successfully created.' })
  create(@Body() createBookDto: CreateBookDto, @GetCurrentUserId() userId: string) {
    return this.booksService.create(createBookDto, userId);
  }

  @Roles(Role.ADMIN, Role.LIBRARIAN)
  @ApiBearerAuth()
  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Import books from CSV' })
  @ApiCreatedResponse({ description: 'Books imported successfully.' })
  importBooks(@UploadedFile() file: Express.Multer.File, @GetCurrentUserId() userId: string) {
    return this.booksService.importBooks(file, userId);
  }

  @Public()
  @Get()
  @UseInterceptors(CacheInterceptor) // Applied CacheInterceptor
  @CacheTTL(60000) // Applied CacheTTL
  @ApiOperation({ summary: 'List all books' })
  @ApiOkResponse({ description: 'List of books retrieved successfully.' })
  findAll(@Query() query: GetBooksQueryDto) {
    return this.booksService.findAll(query); // Updated service call
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get a book by ID' })
  findOne(@Param('id') id: string) {
    return this.booksService.findOne(id);
  }

  @Public()
  @Get(':id/resolve-cover')
  @ApiOperation({ summary: 'Resolve book cover URL from external sources' })
  async resolveCover(@Param('id') id: string) {
    try {
      const url = await this.booksService.resolveCoverUrl(id);
      return { url };
    } catch (error) {
      console.error(`Status 500 avoided: Failed to resolve cover for ${id}`, error);
      // Return null or empty string to indicate failure gracefully to frontend
      return { url: '' };
    }
  }

  @Roles(Role.ADMIN, Role.LIBRARIAN)
  @ApiBearerAuth()
  @Patch(':id')
  @ApiOperation({ summary: 'Update a book (Admin/Librarian)' })
  update(
    @Param('id') id: string,
    @Body() updateBookDto: UpdateBookDto,
    @GetCurrentUserId() userId: string,
  ) {
    return this.booksService.update(id, updateBookDto, userId);
  }

  @Roles(Role.ADMIN, Role.LIBRARIAN)
  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a book (Admin/Librarian)' })
  remove(@Param('id') id: string) {
    return this.booksService.remove(id);
  }
}
