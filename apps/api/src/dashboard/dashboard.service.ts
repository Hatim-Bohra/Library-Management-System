import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class DashboardService {
    constructor(private prisma: PrismaService) { }

    async getStats(user: any) {
        if (user.role === 'MEMBER') {
            const [activeLoans, pendingRequests, fines, overDueBooks] = await Promise.all([
                this.prisma.loan.count({ where: { userId: user.sub, status: 'ACTIVE' } }),
                this.prisma.bookRequest.count({ where: { userId: user.sub, status: 'PENDING' } }),
                this.prisma.fine.count({ where: { loan: { userId: user.sub }, paid: false } }),
                this.prisma.loan.count({
                    where: {
                        userId: user.sub,
                        status: 'ACTIVE',
                        dueDate: { lt: new Date() }
                    }
                })
            ]);
            return [
                { title: "My Active Loans", value: activeLoans.toLocaleString(), icon: "Book", color: "text-blue-500", link: "/dashboard/my-loans" },
                { title: "Pending Requests", value: pendingRequests.toLocaleString(), icon: "Repeat", color: "text-orange-500", link: "/dashboard/requests" },
                { title: "Unpaid Fines", value: fines.toLocaleString(), icon: "AlertCircle", color: "text-red-500", link: "/dashboard/my-loans" },
                { title: "Overdue Books", value: overDueBooks.toLocaleString(), icon: "AlertCircle", color: "text-red-600", link: "/dashboard/my-loans" },
            ];
        }

        // Admin / Librarian Stats
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const [
            totalBooks,
            activeMembers,
            activeLoans,
            overdueBooks,
            totalInventory,
            availableInventory,
            lostInventory,
            totalRevenueRaw,
            dailyRevenueRaw,
            pendingFines
        ] = await Promise.all([
            // Core
            this.prisma.book.count(),
            this.prisma.user.count({ where: { role: 'MEMBER' } }),
            this.prisma.loan.count({ where: { status: 'ACTIVE' } }),
            this.prisma.loan.count({ where: { status: 'ACTIVE', dueDate: { lt: new Date() } } }),

            // Inventory
            this.prisma.inventoryItem.count(),
            this.prisma.inventoryItem.count({ where: { status: 'AVAILABLE' } }),
            this.prisma.inventoryItem.count({ where: { status: 'LOST' } }),

            // Revenue
            // Revenue (Using Transaction table now)
            this.prisma.transaction.aggregate({
                _sum: { amount: true },
                where: {
                    type: { in: ['RENTAL', 'FINE_PAYMENT'] },
                    status: 'COMPLETED'
                }
            }),
            this.prisma.transaction.aggregate({
                _sum: { amount: true },
                where: {
                    type: { in: ['RENTAL', 'FINE_PAYMENT'] },
                    status: 'COMPLETED',
                    createdAt: { gte: startOfDay }
                }
            }),
            this.prisma.fine.count({ where: { paid: false } })
        ]);

        const totalRevenue = totalRevenueRaw._sum.amount ? parseFloat(totalRevenueRaw._sum.amount.toString()) : 0;
        const dailyRevenue = dailyRevenueRaw._sum.amount ? parseFloat(dailyRevenueRaw._sum.amount.toString()) : 0;

        const stats = [

            { title: "Total Books", value: totalBooks.toLocaleString(), icon: "Book", color: "text-blue-500", link: "/dashboard/books" },
            { title: "Active Members", value: activeMembers.toLocaleString(), icon: "Users", color: "text-green-500", link: "/dashboard/members" },
            { title: "Active Loans", value: activeLoans.toLocaleString(), icon: "Repeat", color: "text-orange-500", link: "/dashboard/circulation" },
            { title: "Overdue Loans", value: overdueBooks.toLocaleString(), icon: "AlertCircle", color: "text-red-500", link: "/dashboard/circulation" },

            // Inventory
            { title: "Total Inventory", value: totalInventory.toLocaleString(), icon: "Book", color: "text-indigo-500", link: "/dashboard/inventory" },
            { title: "Available Items", value: availableInventory.toLocaleString(), icon: "CheckCircle", color: "text-emerald-500", link: "/dashboard/inventory" },

            // Revenue (Visible to Admin & Librarian, but usually Admin cares more about total)
            { title: "Revenue Today", value: `$${dailyRevenue.toFixed(2)}`, icon: "DollarSign", color: "text-green-600", link: "/dashboard/revenue" },
            { title: "Total Revenue", value: `$${totalRevenue.toFixed(2)}`, icon: "DollarSign", color: "text-green-700", link: "/dashboard/revenue" },
        ];

        if (user.role === 'LIBRARIAN') {
            // Maybe hide Total Revenue for basic librarians? Keeping it for now as per requirement.
        }

        return stats;
    }
}
