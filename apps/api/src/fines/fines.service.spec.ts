import { Test, TestingModule } from '@nestjs/testing';
import { FinesService } from './fines.service';
import { PrismaService } from '../database/prisma.service';
import { Loan, LoanStatus } from '@repo/database';
import { Prisma } from '@prisma/client';
const Decimal = Prisma.Decimal;

describe('FinesService', () => {
  let service: FinesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinesService,
        {
          provide: PrismaService,
          useValue: {}, // Mock PrismaService as we don't need DB access for calculation logic tests
        },
      ],
    }).compile();

    service = module.get<FinesService>(FinesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateOverdueFine', () => {
    const mockLoanBase = {
      id: 'loan-1',
      userId: 'user-1',
      bookId: 'book-1',
      borrowedAt: new Date(),
      returnedAt: null,
      status: LoanStatus.ACTIVE,
      // DB fields are Decimals, but in tests often we can treat them as numbers or mocked decimals
      // We'll mimic the service expecting numbers/Decimals. Service casts to Number().
      ruleGracePeriod: 3,
      ruleDailyRate: new Decimal(2.0),
      ruleMaxFine: new Decimal(50.0),
      ruleLostFee: new Decimal(100.0),
    } as unknown as Loan; // Casting to avoid full Loan shape requirements

    it('should return 0 if no due date', () => {
      expect(
        service.calculateOverdueFine({
          ...mockLoanBase,
          dueDate: undefined,
        } as any),
      ).toBe(0);
    });

    it('should return 0 if NOT overdue', () => {
      const now = new Date();
      const futureDue = new Date(now);
      futureDue.setDate(now.getDate() + 1); // Due tomorrow

      expect(
        service.calculateOverdueFine({ ...mockLoanBase, dueDate: futureDue } as any),
      ).toBe(0);
    });

    it('should return 0 if overdue but within grace period', () => {
      const now = new Date();
      const pastDue = new Date(now);
      pastDue.setDate(now.getDate() - 2); // Overdue by 2 days (Grace is 3)

      expect(
        service.calculateOverdueFine({ ...mockLoanBase, dueDate: pastDue } as any),
      ).toBe(0);
    });

    it('should calculate fine correctly after grace period', () => {
      const now = new Date();
      const pastDue = new Date(now);
      // Overdue by 5 days. Grace is 3. Chargeable = 2 days. Rate = 2.0. Fine = 4.0.
      pastDue.setDate(now.getDate() - 5);

      expect(
        service.calculateOverdueFine({ ...mockLoanBase, dueDate: pastDue } as any),
      ).toBe(4);
    });

    it('should cap fine at max fine', () => {
      const now = new Date();
      const pastDue = new Date(now);
      // Overdue by 100 days. Grace 3. Chargeable 97. Rate 2. Fine 194. Max 50.
      pastDue.setDate(now.getDate() - 100);

      expect(
        service.calculateOverdueFine({ ...mockLoanBase, dueDate: pastDue } as any),
      ).toBe(50);
    });
  });

  describe('calculateLostFee', () => {
    it('should sum book price and processing fee', () => {
      expect(service.calculateLostFee(20, 10)).toBe(30);
    });
  });
});
