import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class DashboardService {
    constructor(private prisma: PrismaService) { }

    async getStats() {
        const [totalBooks, activeMembers, activeLoans, overdueBooks] = await Promise.all([
            this.prisma.book.count(),
            this.prisma.user.count({ where: { role: 'MEMBER' } }),
            this.prisma.loan.count({ where: { status: 'ACTIVE' } }),
            this.prisma.loan.count({
                where: {
                    status: 'ACTIVE',
                    dueDate: { lt: new Date() }
                }
            }),
        ]);

        return [
            { title: "Total Books", value: totalBooks.toLocaleString(), icon: "Book", color: "text-blue-500", link: "/dashboard/books" },
            { title: "Active Members", value: activeMembers.toLocaleString(), icon: "Users", color: "text-green-500", link: "/dashboard/admin/users" }, // Admin only link really, but dashboard handles visibility
            { title: "Active Loans", value: activeLoans.toLocaleString(), icon: "Repeat", color: "text-orange-500", link: "/dashboard/loans" },
            { title: "Overdue Books", value: overdueBooks.toLocaleString(), icon: "AlertCircle", color: "text-red-500", link: "/dashboard/loans?status=overdue" },
        ];
    }
}
