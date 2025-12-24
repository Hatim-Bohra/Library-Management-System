import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class DashboardService {
    constructor(private prisma: PrismaService) { }

    async getStats(user: any) {
        if (user.role === 'MEMBER') {
            const [activeLoans, pendingRequests, fines, overDueBooks, totalBooks, totalCategories] = await Promise.all([
                this.prisma.loan.count({ where: { userId: user.sub, status: 'ACTIVE' } }),
                this.prisma.bookRequest.count({ where: { userId: user.sub, status: 'PENDING' } }),
                this.prisma.fine.count({ where: { loan: { userId: user.sub }, paid: false } }),
                this.prisma.loan.count({
                    where: {
                        userId: user.sub,
                        status: 'ACTIVE',
                        dueDate: { lt: new Date() }
                    }
                }),
                this.prisma.book.count(),
                this.prisma.category.count()
            ]);
            return [
                { title: "My Active Loans", value: activeLoans.toLocaleString(), icon: "Book", color: "text-blue-500", link: "/dashboard/my-loans" },
                { title: "Pending Requests", value: pendingRequests.toLocaleString(), icon: "Repeat", color: "text-orange-500", link: "/dashboard/requests" },
                { title: "Unpaid Fines", value: fines.toLocaleString(), icon: "AlertCircle", color: "text-red-500", link: "/dashboard/my-loans" },
                { title: "Overdue Books", value: overDueBooks.toLocaleString(), icon: "AlertCircle", color: "text-red-600", link: "/dashboard/my-loans" },
                { title: "Book Catalog", value: totalBooks.toLocaleString(), icon: "Book", color: "text-green-500", link: "/dashboard/books" },
                { title: "Genres", value: totalCategories.toLocaleString(), icon: "Book", color: "text-indigo-500", link: "/dashboard/books" },
            ];
        }

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
            { title: "Active Members", value: activeMembers.toLocaleString(), icon: "Users", color: "text-green-500", link: "/dashboard/members" },
            { title: "Active Loans", value: activeLoans.toLocaleString(), icon: "Repeat", color: "text-orange-500", link: "/dashboard/circulation" },
            { title: "Overdue Books", value: overdueBooks.toLocaleString(), icon: "AlertCircle", color: "text-red-500", link: "/dashboard/circulation" },
        ];
    }
}
