import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { JwtPayload } from '../auth/types/jwtPayload.type';
import { FineType } from '@prisma/client';

@Injectable()
export class CirculationService {
  constructor(private prisma: PrismaService) { }

  checkOut(createLoanDto: CreateLoanDto) {
    const { userId, bookId } = createLoanDto;

    return this.prisma.$transaction(async (tx) => {
      // 1. Get Book and User
      const book = await tx.book.findUniqueOrThrow({ where: { id: bookId } });
      const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });

      if (book.copies < 1) {
        throw new BadRequestException('Book not available');
      }

      // 2. Check Funds
      const rentalPrice = Number(book.rentalPrice);
      if (rentalPrice > 0) {
        if (Number(user.walletBalance) < rentalPrice) {
          throw new BadRequestException('Insufficient funds in wallet');
        }

        // 3. Deduct Funds & Create Transaction
        await tx.user.update({
          where: { id: userId },
          data: { walletBalance: { decrement: rentalPrice } }
        });

        await tx.transaction.create({
          data: {
            userId,
            amount: -rentalPrice,
            type: 'RENTAL',
            status: 'COMPLETED'
          }
        });
      }

      // 4. Create Loan
      return tx.loan.create({
        data: {
          userId,
          bookId,
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        },
      });
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
      // Use snapshot rules from the loan
      const endDate = new Date();
      const diffTime = endDate.getTime() - new Date(loan.dueDate).getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Use Snapshot values from Loan, default to 0 if missing (though they shouldn't be)
      const gracePeriod = loan['ruleGracePeriod'] ?? 0;
      const dailyRate = Number(loan['ruleDailyRate'] ?? 0);
      const maxFine = loan['ruleMaxFine'] ? Number(loan['ruleMaxFine']) : null;

      if (diffDays > gracePeriod) {
        const chargeableDays = diffDays - gracePeriod;
        let amount = chargeableDays * dailyRate;

        if (maxFine && amount > maxFine) {
          amount = maxFine;
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
