import { Test, TestingModule } from '@nestjs/testing';
import { RequestsService } from './requests.service';
import { BooksService } from '../books/books.service';
import { PrismaService } from '../database/prisma.service';
import { FinesService } from '../fines/fines.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  BookRequestStatus,
  BookRequestType,
  FineRule,
  Role,
} from '@repo/database';
import { BadRequestException, NotFoundException } from '@nestjs/common';

const mockTransactions = {
  inventoryItem: {
    findFirst: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
  },
  bookRequest: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  book: {
    findUnique: jest.fn(),
  },
  loan: {
    create: jest.fn(),
    update: jest.fn(),
  },
};

const mockPrismaService = {
  ...mockTransactions,
  $transaction: jest.fn((cb) => cb(mockTransactions)),
};

const mockFinesService = {
  getApplicableRule: jest.fn(),
};

const mockBooksService = {
  checkAvailability: jest.fn(),
};

describe('RequestsService', () => {
  let service: RequestsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: FinesService,
          useValue: mockFinesService,
        },
        {
          provide: BooksService,
          useValue: mockBooksService,
        },
        {
          provide: NotificationsService,
          useValue: {
            createNotification: jest.fn(),
            notifyRoles: jest.fn(),
          }
        }
      ],
    }).compile();

    service = module.get<RequestsService>(RequestsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a request if book exists and user has no active request for it', async () => {
      const bookId = 'book-1';
      const userId = 'user-1';
      const dto = {
        bookId,
        type: BookRequestType.PICKUP,
        address: 'Req Address',
      };

      mockTransactions.book.findUnique.mockResolvedValue({ id: bookId });
      mockTransactions.inventoryItem.count.mockResolvedValue(1); // 1 copy available - This is CRITICAL
      mockTransactions.bookRequest.findFirst.mockResolvedValue(null); // No existing request

      // Mock created return
      const createdRequest = {
        id: 'req-1',
        ...dto,
        status: BookRequestStatus.PENDING,
        createdAt: new Date(),
      };
      mockTransactions.bookRequest.create.mockResolvedValue(createdRequest);

      const result = await service.create(userId, dto);

      // Assertions
      expect(mockTransactions.inventoryItem.count).toHaveBeenCalled();
      expect(mockTransactions.bookRequest.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          bookId,
          type: dto.type,
          status: BookRequestStatus.PENDING,
        }),
      });
      expect(result).toEqual(createdRequest);
    });

    it('should throw BadRequest if no copies available', async () => {
      mockTransactions.book.findUnique.mockResolvedValue({ id: 'book-1' });
      mockTransactions.inventoryItem.count.mockResolvedValue(0); // 0 copies

      await expect(
        service.create('user-1', {
          bookId: 'book-1',
          type: BookRequestType.PICKUP,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('approve', () => {
    it('should approve request and reserve inventory', async () => {
      const requestId = 'req-1';
      const mockRequest = {
        id: requestId,
        bookId: 'book-1',
        status: BookRequestStatus.PENDING,
      };
      const mockInventory = {
        id: 'inv-1',
        bookId: 'book-1',
        status: 'AVAILABLE',
      };

      mockTransactions.bookRequest.findUnique.mockResolvedValue(mockRequest);
      mockTransactions.inventoryItem.findFirst.mockResolvedValue(mockInventory);
      mockTransactions.bookRequest.update.mockResolvedValue({
        ...mockRequest,
        status: BookRequestStatus.APPROVED,
      });
      mockTransactions.inventoryItem.update.mockResolvedValue({
        ...mockInventory,
        status: 'RESERVED',
      });

      await service.approve(requestId);

      expect(mockTransactions.bookRequest.findUnique).toHaveBeenCalledWith({
        where: { id: requestId },
      });
      expect(mockTransactions.inventoryItem.findFirst).toHaveBeenCalled();
      expect(mockTransactions.inventoryItem.update).toHaveBeenCalled();
      expect(mockTransactions.bookRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: requestId },
          data: expect.objectContaining({
            status: BookRequestStatus.APPROVED,
            inventoryItemId: 'inv-1',
          }),
        }),
      );
      expect(mockBooksService.checkAvailability).toHaveBeenCalledWith('book-1');
    });
  });
});
