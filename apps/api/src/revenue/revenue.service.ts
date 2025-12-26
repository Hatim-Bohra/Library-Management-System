import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { FineType } from '@prisma/client';

@Injectable()
export class RevenueService {
    constructor(private prisma: PrismaService) { }

    async getRevenueStats(period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly', startDate?: Date, endDate?: Date) {
        // Default timeframe if not provided based on period
        let start = startDate;
        const end = endDate || new Date();

        if (!start) {
            const now = new Date();
            start = new Date();
            if (period === 'daily') start.setDate(now.getDate() - 30); // Last 30 days
            if (period === 'weekly') start.setDate(now.getDate() - 90); // Last 12 weeks
            if (period === 'monthly') start.setMonth(now.getMonth() - 12); // Last 12 months
            if (period === 'yearly') start.setFullYear(now.getFullYear() - 5); // Last 5 years
        }

        // Fetch transactions (RENTAL, FINE_PAYMENT)
        // DEPOSIT is not revenue, it's liability (user funds). Revenue is realized when they spend it.
        const transactions = await this.prisma.transaction.findMany({
            where: {
                type: { in: ['RENTAL', 'FINE_PAYMENT'] },
                status: 'COMPLETED',
                createdAt: {
                    gte: start,
                    lte: end
                }
            },
            select: { amount: true, createdAt: true, type: true }
        });

        const breakdown = {
            RENTAL: 0,
            FINE_PAYMENT: 0
        };

        let totalRevenue = 0;
        const timeSeries: Record<string, number> = {};

        transactions.forEach(tx => {
            // Transactions are stored as negative values (User Spend). Revenue is positive.
            const amount = Math.abs(Number(tx.amount));
            totalRevenue += amount;

            if (tx.type === 'RENTAL') breakdown.RENTAL += amount;
            // FINE_PAYMENT is generic in Transaction. We will refine this with Fine table query below.
            if (tx.type === 'FINE_PAYMENT') breakdown['FINE_PAYMENT'] += amount;

            const date = new Date(tx.createdAt); // createdAt is reliable
            let key = '';

            if (period === 'daily') {
                key = date.toISOString().split('T')[0]; // YYYY-MM-DD
            } else if (period === 'weekly') {
                // Get start of week
                const d = new Date(date);
                const day = d.getDay(), diff = d.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
                const monday = new Date(d.setDate(diff));
                key = monday.toISOString().split('T')[0];
            } else if (period === 'monthly') {
                key = date.toISOString().slice(0, 7); // YYYY-MM
            } else {
                key = date.toISOString().slice(0, 4); // YYYY
            }

            timeSeries[key] = (timeSeries[key] || 0) + amount;
        });

        // 4. Refine Breakdown: Split FINE_PAYMENT into OVERDUE and LOST
        // We fetch Paid Fines in this period to get the ratio or exact amounts
        const paidFines = await this.prisma.fine.findMany({
            where: {
                paid: true,
                paidAt: {
                    gte: start,
                    lte: end
                }
            }
        });

        const fineBreakdown = {
            OVERDUE: 0,
            LOST: 0,
            DAMAGE: 0,
            MANUAL: 0
        };

        paidFines.forEach(f => {
            const amt = Number(f.amount);
            if (fineBreakdown[f.type] !== undefined) {
                fineBreakdown[f.type] += amt;
            }
        });

        // Merge into main breakdown
        const finalBreakdown = {
            ...breakdown,
            ...fineBreakdown
        };

        // Format chart data sorted by date
        const chartData = Object.entries(timeSeries)
            .map(([date, value]) => ({ date, value }))
            .sort((a, b) => a.date.localeCompare(b.date));

        return {
            totalRevenue,
            breakdown: finalBreakdown,
            chartData
        };
    }
}
