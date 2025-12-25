import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { FineType } from '@prisma/client';

@Injectable()
export class RevenueService {
    constructor(private prisma: PrismaService) { }

    async getRevenueStats(period: 'daily' | 'monthly' | 'yearly' = 'monthly') {
        // Aggregation logic using raw query for date truncation or JS processing
        // Prisma .groupBy on Date fields is limited for truncation without raw SQL in some versions.
        // Given Postgres, using $queryRaw is best for date_trunc, but let's try JS processing for database agnostic safety if stats are small,
        // Or prefer $queryRaw for "production-grade".
        // "Production-grade" implies efficient SQL.

        // Let's use Prisma to fetch paid fines and aggregate in memory for simplicity/safety unless data volume is huge,
        // OR use raw query. Let's start with all paid fines for now (assuming not millions yet). 
        // Actually, let's use groupBy on `type` for strict breakdown, but for timeline we need date.

        const fines = await this.prisma.fine.findMany({
            where: { paid: true },
            select: { amount: true, paidAt: true, type: true }
        });

        const breakdown = {
            OVERDUE: 0,
            LOST: 0,
            DAMAGE: 0,
            MANUAL: 0
        };

        let totalRevenue = 0;
        const timeSeries: Record<string, number> = {};

        fines.forEach(fine => {
            const amount = Number(fine.amount);
            totalRevenue += amount;

            if (fine.type) {
                breakdown[fine.type] += amount;
            }

            const date = new Date(fine.paidAt!); // paidAt is not null due to where query (usually), strict check needed
            let key = '';

            if (period === 'daily') {
                key = date.toISOString().split('T')[0]; // YYYY-MM-DD
            } else if (period === 'monthly') {
                key = date.toISOString().slice(0, 7); // YYYY-MM
            } else {
                key = date.toISOString().slice(0, 4); // YYYY
            }

            timeSeries[key] = (timeSeries[key] || 0) + amount;
        });

        // Format chart data
        const chartData = Object.entries(timeSeries)
            .map(([date, value]) => ({ date, value }))
            .sort((a, b) => a.date.localeCompare(b.date));

        return {
            totalRevenue,
            breakdown,
            chartData
        };
    }
}
