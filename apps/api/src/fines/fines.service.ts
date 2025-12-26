import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Role } from '@repo/database';

@Injectable()
export class FinesService implements OnModuleInit {
  private readonly logger = new Logger(FinesService.name);

  constructor(private prisma: PrismaService) { }

  async onModuleInit() {
    await this.seedDefaultRules();
  }

  private async seedDefaultRules() {
    const defaultRule = {
      role: Role.MEMBER,
      gracePeriod: 1,
      dailyRate: 2.0,
      maxFine: 100.0,
      lostBookProcessingFee: 30.0,
    };

    const existing = await this.prisma.fineRule.findUnique({
      where: { role: Role.MEMBER },
    });

    if (!existing) {
      this.logger.log('Seeding default fine rules for MEMBER...');
      await this.prisma.fineRule.create({
        data: defaultRule,
      });
    }
  }

  async getApplicableRule(role: Role) {
    const rule = await this.prisma.fineRule.findUnique({
      where: { role },
    });
    // Return default 0s if no rule exists, or handle as needed
    return (
      rule || {
        gracePeriod: 0,
        dailyRate: 0,
        maxFine: null,
        lostBookProcessingFee: 0,
      }
    );
  }

  getRules() {
    return this.prisma.fineRule.findMany();
  }

  updateRule(
    role: Role,
    data: {
      gracePeriod: number;
      dailyRate: number;
      maxFine?: number;
      lostBookProcessingFee: number;
    },
  ) {
    return this.prisma.fineRule.upsert({
      where: { role },
      update: data,
      create: { role, ...data },
    });
  }

  calculateOverdueFine(loan: {
    dueDate?: Date;
    returnedAt?: Date | null;
    ruleGracePeriod: number;
    ruleDailyRate: any; // Decimal
    ruleMaxFine?: any; // Decimal
  }): number {
    if (!loan.dueDate) return 0;

    // Logic:
    // overdueDays = (returnedAt || now) - dueDate
    // if overdueDays <= gracePeriod return 0
    // chargeableDays = overdueDays - gracePeriod
    // fine = chargeableDays * dailyRate
    // if maxFine && fine > maxFine return maxFine

    const endDate = loan.returnedAt || new Date();
    const diffTime = endDate.getTime() - new Date(loan.dueDate).getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= loan.ruleGracePeriod) return 0;

    const chargeableDays = diffDays - loan.ruleGracePeriod;
    let fine = chargeableDays * Number(loan.ruleDailyRate);

    if (loan.ruleMaxFine && fine > Number(loan.ruleMaxFine)) {
      fine = Number(loan.ruleMaxFine);
    }

    return Math.max(0, fine);
  }

  calculateLostFee(bookPrice: number, processingFee: any): number {
    return Number(bookPrice) + Number(processingFee);
  }

  getUserFines(userId: string) {
    return this.prisma.fine.findMany({
      where: {
        loan: {
          userId,
        },
      },
      include: {
        loan: {
          include: {
            book: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
