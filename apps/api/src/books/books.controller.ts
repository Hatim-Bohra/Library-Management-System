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
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
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
  create(@Body() createBookDto: CreateBookDto, @GetCurrentUserId() userId: string) {
    return this.booksService.create(createBookDto, userId);
  }

  @Roles(Role.ADMIN, Role.LIBRARIAN)
  @ApiBearerAuth()
  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Import books from CSV' })
  importBooks(@UploadedFile() file: Express.Multer.File, @GetCurrentUserId() userId: string) {
    return this.booksService.importBooks(file, userId);
  }

  @Public()
  @Get()
  @UseInterceptors(CacheInterceptor) // Applied CacheInterceptor
  @CacheTTL(60000) // Applied CacheTTL
  @ApiOperation({ summary: 'List all books' })
  findAll(@Query() query: GetBooksQueryDto) {
    return this.booksService.findAll(query); // Updated service call
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get a book by ID' })
  findOne(@Param('id') id: string) {
    return this.booksService.findOne(id);
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
