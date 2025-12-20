import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';

@ApiTags('books')
@Controller('books')
export class BooksController {
    constructor(private readonly booksService: BooksService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new book' })
    create(@Body() createBookDto: CreateBookDto) {
        return this.booksService.create(createBookDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all books' })
    findAll() {
        return this.booksService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a book by ID' })
    findOne(@Param('id') id: string) {
        return this.booksService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a book' })
    update(@Param('id') id: string, @Body() updateBookDto: UpdateBookDto) {
        return this.booksService.update(id, updateBookDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a book' })
    remove(@Param('id') id: string) {
        return this.booksService.remove(id);
    }
}
