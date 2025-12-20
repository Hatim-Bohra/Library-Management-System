import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';

@Injectable()
export class BooksService {
    constructor(private prisma: PrismaService) { }

    async create(createBookDto: CreateBookDto) {
        return this.prisma.book.create({
            data: createBookDto,
        });
    }

    async findAll() {
        return this.prisma.book.findMany({
            include: { author: true, category: true },
        });
    }

    async findOne(id: string) {
        return this.prisma.book.findUniqueOrThrow({
            where: { id },
            include: { author: true, category: true },
        });
    }

    async update(id: string, updateBookDto: UpdateBookDto) {
        return this.prisma.book.update({
            where: { id },
            data: updateBookDto,
        });
    }

    async remove(id: string) {
        return this.prisma.book.delete({
            where: { id },
        });
    }
}
