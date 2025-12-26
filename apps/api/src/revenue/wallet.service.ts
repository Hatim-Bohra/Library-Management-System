import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { TransactionType, TransactionStatus } from '@prisma/client';

@Injectable()
export class WalletService {
    constructor(private prisma: PrismaService) { }

    async getBalance(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { walletBalance: true }
        });
        return { balance: Number(user?.walletBalance || 0) };
    }

    async addFunds(userId: string, amount: number) {
        if (amount <= 0) throw new BadRequestException('Amount must be positive');

        // Verify user exists first
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new BadRequestException('User not found');

        // Transactional update
        return this.prisma.$transaction(async (tx) => {
            // Create Transaction Record
            const transaction = await tx.transaction.create({
                data: {
                    userId,
                    amount,
                    type: TransactionType.DEPOSIT,
                    status: TransactionStatus.COMPLETED
                }
            });

            // Update User Balance
            const updatedUser = await tx.user.update({
                where: { id: userId },
                data: {
                    walletBalance: { increment: amount }
                }
            });

            return {
                newBalance: Number(updatedUser.walletBalance),
                transactionId: transaction.id
            };
        });
    }

    async getTransactions(userId: string) {
        return this.prisma.transaction.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
    }
}
