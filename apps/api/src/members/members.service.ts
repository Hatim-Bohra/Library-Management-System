import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class MembersService {
  constructor(private prisma: PrismaService) { }

  findAll() {
    return this.prisma.user.findMany();
  }

  findOne(id: string) {
    return this.prisma.user.findUniqueOrThrow({ where: { id } });
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
