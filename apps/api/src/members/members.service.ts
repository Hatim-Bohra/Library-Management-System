import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class MembersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany();
  }

  async findOne(id: string) {
    return this.prisma.user.findUniqueOrThrow({ where: { id } });
  }

  async remove(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }
}
