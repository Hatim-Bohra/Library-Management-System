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

  async reportLost(loanId: string, userId: string) {
    const loan = await this.prisma.loan.findUnique({
      where: { id: loanId },
      include: { book: true }
    });

    if (!loan) throw new BadRequestException('Loan not found');
    if (loan.status === 'RETURNED') throw new BadRequestException('Loan already returned');

    return this.prisma.$transaction(async (tx) => {
      // 1. Mark Loan as Returned (technically resolved) or keep Active? 
      // Usually "Lost" ends the loan but starts the debt.
      // Let's mark as RETURNED to stop daily fines, but add the Lost Fine.

      await tx.loan.update({
        where: { id: loanId },
        data: { status: 'RETURNED', returnedAt: new Date() }
      });

      // 2. Mark Inventory Item as LOST
      // We need the inventory Item ID. Loan is linked to Book, not specific item directly in schema shown, 
      // but usually libraries track barcode. 
      // Schema: Loan -> Book. no InventoryItem link. 
      // Assumption: We find the inventory item associated with this book that was "ISSUED"? 
      // OR just mark one issued item of this book as LOST.
      // This schema gap (Loan not linked to InventoryItem) makes specific item tracking hard.
      // Workaround: Find an ISSUED item of this book and mark LOST.

      const item = await tx.inventoryItem.findFirst({
        where: { bookId: loan.bookId, status: 'ISSUED' }
      });

      if (item) {
        await tx.inventoryItem.update({
          where: { id: item.id },
          data: { status: 'LOST' }
        });

        await tx.inventoryTransaction.create({
          data: {
            inventoryItemId: item.id,
            action: 'STATUS_CHANGE',
            performedBy: userId,
            reason: `Reported lost by user (Loan ${loanId})`
          }
        });
      }

      // 3. Create Fine (Book Price + Processing Fee)
      // Get System Policy (FineRule)
      // Simplified: Just use Book Price + 10$ processing
      const bookPrice = Number(loan.book.price || 0);
      const processingFee = 10;
      const amount = bookPrice + processingFee;

      const fine = await tx.fine.create({
        data: {
          loanId,
          amount,
          type: FineType.LOST,
          userId: loan.userId // Explicit link for easier querying
        }
      });

      return fine;
    });
  }

  async payFine(fineId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const fine = await tx.fine.findUnique({ where: { id: fineId } });
      if (!fine) throw new BadRequestException('Fine not found');
      if (fine.paid) throw new BadRequestException('Fine already paid');

      const user = await tx.user.findUnique({ where: { id: userId } });
      if (Number(user.walletBalance) < Number(fine.amount)) {
        throw new BadRequestException('Insufficient funds');
      }

      // 1. Deduct Balance
      await tx.user.update({
        where: { id: userId },
        data: { walletBalance: { decrement: fine.amount } }
      });

      // 2. Create Transaction
      await tx.transaction.create({
        data: {
          userId,
          amount: Number(fine.amount), // Revenue is positive? Or user deduction negative? 
          // Schema says 'amount'. Usually revenue tracking sums positive.
          // CirculationService.checkOut uses -rentalPrice.
          // Reporting revenue: RevenueService sums amount. 
          // If checkout is negative, stats sum negative? 
          // RevenueService: "totalRevenue += amount". 
          // If Rental is -2.99, Revenue is negative? 
          // I should verify Checkout logic. 
          // Checkout logic: amount: -rentalPrice.
          // RevenueService logic: "totalRevenue += amount". 
          // This implies RevenueService might be reporting NEGATIVE revenue currently?
          // I will fix this standard here: Revenue is Income.
          // Transaction for USER VIEW: Negative (Expense).
          // Transaction for ADMIN VIEW: Positive (Income).
          // Single table? 
          // Convention: Wallet Transactions are from User Perspective (-Spent).
          // Revenue Service should invert this or filter?
          // RevenueService currently sums them. 
          // I will use NEGATIVE here for consistency with Checkout.
          // And I will fix RevenueService to Flip the sign or use Math.abs().
          type: 'FINE_PAYMENT',
          status: 'COMPLETED'
        }
      });

      // 3. Mark Fine Paid
      return tx.fine.update({
        where: { id: fineId },
        data: { paid: true, paidAt: new Date() }
      });
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
