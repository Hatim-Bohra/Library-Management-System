import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationTriggerType, NotificationType } from '@prisma/client';

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);

    constructor(private prisma: PrismaService) { }

    @Cron(CronExpression.EVERY_DAY_AT_9AM)
    async checkDueDates() {
        this.logger.log('Checking due dates for notifications...');
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // 1. Before Due Date (1 Day Before)
        const loansDueTomorrow = await this.prisma.loan.findMany({
            where: {
                status: 'ACTIVE',
                dueDate: {
                    gte: new Date(tomorrow.setHours(0, 0, 0, 0)),
                    lt: new Date(tomorrow.setHours(23, 59, 59, 999)),
                },
            },
            include: { book: true, user: true },
        });

        for (const loan of loansDueTomorrow) {
            await this.createNotification(
                loan,
                NotificationTriggerType.BEFORE_DUE,
                `Reminder: Your book "${loan.book.title}" is due tomorrow.`,
                NotificationType.INFO
            );
        }

        // 2. On Due Date
        const loansDueToday = await this.prisma.loan.findMany({
            where: {
                status: 'ACTIVE',
                dueDate: {
                    gte: new Date(now.setHours(0, 0, 0, 0)),
                    lt: new Date(now.setHours(23, 59, 59, 999)),
                },
            },
            include: { book: true, user: true },
        });

        for (const loan of loansDueToday) {
            await this.createNotification(
                loan,
                NotificationTriggerType.ON_DUE,
                `Due Date: Your book "${loan.book.title}" is due today. Please return it.`,
                NotificationType.WARNING
            );
        }

        // 3. Overdue
        const loansOverdue = await this.prisma.loan.findMany({
            where: {
                status: 'ACTIVE',
                dueDate: { lt: new Date(now.setHours(0, 0, 0, 0)) },
            },
            include: { book: true, user: true },
        });

        for (const loan of loansOverdue) {
            // Check grace period from snapshot or rule
            const gracePeriod = loan.ruleGracePeriod ?? 0;
            const daysOverdue = Math.ceil((now.getTime() - new Date(loan.dueDate).getTime()) / (1000 * 60 * 60 * 24));

            if (daysOverdue > gracePeriod) {
                await this.createNotification(
                    loan,
                    NotificationTriggerType.OVERDUE,
                    `Overdue: Your book "${loan.book.title}" is overdue. Fines may apply.`,
                    NotificationType.ERROR
                );
            }
        }
    }

    private async createNotification(loan: any, trigger: NotificationTriggerType, message: string, type: NotificationType) {
        const existing = await this.prisma.loanNotification.findUnique({
            where: {
                loanId_triggerType: {
                    loanId: loan.id,
                    triggerType: trigger,
                },
            },
        });

        if (!existing) {
            await this.prisma.$transaction([
                this.prisma.notification.create({
                    data: {
                        userId: loan.userId,
                        message,
                        type,
                    },
                }),
                this.prisma.loanNotification.create({
                    data: {
                        loanId: loan.id,
                        triggerType: trigger,
                    },
                }),
            ]);
            this.logger.log(`Sent notification ${trigger} to user ${loan.userId} for loan ${loan.id}`);
        }
    }

    async findAll(userId: string) {
        return this.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 20, // Limit to 20 recent
        });
    }

    async getUnreadCount(userId: string) {
        return this.prisma.notification.count({
            where: { userId, read: false },
        });
    }

    async markAsRead(id: string, userId: string) {
        return this.prisma.notification.update({
            where: { id, userId }, // Ensure user owns it
            data: { read: true },
        });
    }
}
