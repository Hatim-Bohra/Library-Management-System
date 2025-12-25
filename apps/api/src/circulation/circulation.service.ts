import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { JwtPayload } from '../auth/types/jwtPayload.type';
import { FineType } from '@prisma/client';

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

  async checkIn(loanId: string) {
    const loan = await this.prisma.loan.findUnique({
      where: { id: loanId },
      include: { user: true }
    });

    if (!loan) throw new BadRequestException('Loan not found');
    if (loan.status === 'RETURNED') throw new BadRequestException('Loan already returned');

    return this.prisma.$transaction(async (tx) => {
      // 1. Mark as Returned
      const updatedLoan = await tx.loan.update({
        where: { id: loanId },
        data: {
          status: 'RETURNED',
          returnedAt: new Date(),
        },
      });

      // 2. Calculate Fine
      // Need rules. Assuming FinesService can be injected or we fetch rules here.
      // Ideally injecting FinesService, but for simplicity/dependency loop avoidance fetching rule here.
      const rule = await tx.fineRule.findUnique({ where: { role: loan.user.role } });

      if (rule) {
        const endDate = new Date();
        const diffTime = endDate.getTime() - new Date(loan.dueDate).getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > rule.gracePeriod) {
          const chargeableDays = diffDays - rule.gracePeriod;
          let amount = chargeableDays * Number(rule.dailyRate);
          if (rule.maxFine && amount > Number(rule.maxFine)) {
            amount = Number(rule.maxFine);
          }

          if (amount > 0) {
            await tx.fine.create({
              data: {
                loanId: loan.id,
                amount,
                type: FineType.OVERDUE,
              }
            });
          }
        }
      }

      return updatedLoan;
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
