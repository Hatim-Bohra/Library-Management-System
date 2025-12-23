import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateAuthorDto, UpdateAuthorDto } from './dto';

@Injectable()
export class AuthorsService {
    constructor(private prisma: PrismaService) { }

    create(createAuthorDto: CreateAuthorDto) {
        return this.prisma.author.create({
            data: createAuthorDto,
        });
    }

    findAll() {
        return this.prisma.author.findMany({
            orderBy: { name: 'asc' },
        });
    }

    async findOne(id: string) {
        const author = await this.prisma.author.findUnique({
            where: { id },
            include: { books: true },
        });

        if (!author) {
            throw new NotFoundException(`Author with ID ${id} not found`);
        }

        return author;
    }

    async update(id: string, updateAuthorDto: UpdateAuthorDto) {
        await this.findOne(id); // Ensure exists
        return this.prisma.author.update({
            where: { id },
            data: updateAuthorDto,
        });
    }

    async remove(id: string) {
        await this.findOne(id); // Ensure exists
        return this.prisma.author.delete({
            where: { id },
        });
    }
}
