import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { JwtPayload } from '../auth/types/jwtPayload.type';

@Injectable()
export class CirculationService {
  constructor(private prisma: PrismaService) { }

  async checkOut(createLoanDto: CreateLoanDto) {
    const { userId, bookId } = createLoanDto;

    // Check copies available
    const book = await this.prisma.book.findUniqueOrThrow({
      where: { id: bookId },
    });
    if (book.copies < 1) {
      throw new BadRequestException('Book not available');
    }

    // Create loan
    // In real app: use transaction to decrement copies
    return this.prisma.loan.create({
      data: {
        userId,
        bookId,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
      },
    });
  }

  checkIn(loanId: string) {
    return this.prisma.loan.update({
      where: { id: loanId },
      data: {
        status: 'RETURNED',
        returnedAt: new Date(),
      },
    });
  }

  findAll(user: JwtPayload) {
    if (user.role === 'ADMIN' || user.role === 'LIBRARIAN') {
      return this.prisma.loan.findMany({
        include: {
          book: true,
          user: true,
        },
        orderBy: { borrowedAt: 'desc' },
      });
    }

    return this.prisma.loan.findMany({
      where: { userId: user.sub },
      include: {
        book: true,
      },
      orderBy: { borrowedAt: 'desc' },
    });
  }
}
