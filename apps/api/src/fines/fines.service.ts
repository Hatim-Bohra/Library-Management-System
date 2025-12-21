import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Loan, FineRule, Role, Book } from '@repo/database';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class FinesService {
    constructor(private prisma: PrismaService) { }

    async getApplicableRule(role: Role): Promise<FineRule | null> {
        return this.prisma.fineRule.findUnique({
            where: { role },
        });
    }

    calculateOverdueFine(loan: Loan): number {
        if (!loan.dueDate) return 0;

        // Use snapshot values if available, else default to 0 (or fetch current rule? Snapshot should be preferred)
        // If snapshot is missing (legacy loans), we might need fallback logic, but for new system assume zero or current.
        // Let's stick to snapshot as per requirement.
        const dailyRate = loan.ruleDailyRate ? Number(loan.ruleDailyRate) : 0;
        const gracePeriod = loan.ruleGracePeriod ?? 0;
        const maxFine = loan.ruleMaxFine ? Number(loan.ruleMaxFine) : Infinity;

        const now = new Date();
        // Reset times to compare dates only
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const due = new Date(loan.dueDate.getFullYear(), loan.dueDate.getMonth(), loan.dueDate.getDate());

        if (today <= due) return 0;

        const diffTime = Math.abs(today.getTime() - due.getTime());
        const overdueDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const chargeableDays = Math.max(0, overdueDays - gracePeriod);
        const fine = chargeableDays * dailyRate;

        return Math.min(fine, maxFine);
    }

    calculateLostFee(bookPrice: number, processingFee: number): number {
        return bookPrice + processingFee;
    }
}
