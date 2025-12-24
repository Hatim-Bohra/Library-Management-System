import { Injectable, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateMemberDto } from './dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class MembersService {
  constructor(private prisma: PrismaService) { }

  async create(dto: CreateMemberDto, currentUser?: any) {
    // New Requirement: LIBRARIAN can only create MEMBER
    if (
      currentUser &&
      currentUser.role === 'LIBRARIAN' &&
      dto.role !== 'MEMBER'
    ) {
      throw new ForbiddenException('Librarians can only create Members');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hash = await bcrypt.hash(dto.password, 10);

    const newUser = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    return newUser;
  }

  findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });
  }

  findOne(id: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      }
    });
  }

  async remove(id: string, currentUser?: any) {
    const targetUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      throw new ForbiddenException('User not found');
    }

    // New Requirement: LIBRARIAN cannot delete ADMIN
    if (
      currentUser &&
      currentUser.role === 'LIBRARIAN' &&
      targetUser.role === 'ADMIN'
    ) {
      throw new ForbiddenException('Librarians cannot delete Administrators');
    }

    return this.prisma.user.delete({ where: { id } });
  }
}
