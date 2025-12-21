import { Test, TestingModule } from '@nestjs/testing';
import { RequestsService } from './requests.service';
import { PrismaService } from '../database/prisma.service';
import { FinesService } from '../fines/fines.service';
import { BookRequestStatus, BookRequestType, FineRule, Role } from '@repo/database';
import { BadRequestException, NotFoundException } from '@nestjs/common';

const mockPrismaService = {
    book: {
        findUnique: jest.fn(),
    },
    inventoryItem: {
        findFirst: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
    },
    bookRequest: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        count: jest.fn(), // Added count mock
    },
    loan: {
        create: jest.fn(),
        update: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(mockPrismaService)),
};

const mockFinesService = {
    getApplicableRule: jest.fn(),
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
            const dto = { bookId, type: BookRequestType.PICKUP, address: 'Req Address' };

            mockPrismaService.book.findUnique.mockResolvedValue({ id: bookId, isAvailable: true });
            mockPrismaService.inventoryItem.count.mockResolvedValue(1); // 1 copy available
            mockPrismaService.bookRequest.findFirst.mockResolvedValue(null); // No existing request
            mockPrismaService.bookRequest.create.mockResolvedValue({ id: 'req-1', ...dto, status: BookRequestStatus.PENDING });

            const result = await service.create(userId, dto);

            expect(prisma.bookRequest.create).toHaveBeenCalled();
            expect(result).toEqual(expect.objectContaining({ id: 'req-1', status: BookRequestStatus.PENDING }));
        });

        it('should throw BadRequest if book not available', async () => {
            mockPrismaService.book.findUnique.mockResolvedValue({ id: 'book-1', isAvailable: false });

            await expect(service.create('user-1', { bookId: 'book-1', type: BookRequestType.PICKUP }))
                .rejects.toThrow(BadRequestException);
        });
    });

    describe('approve', () => {
        it('should approve request and reserve inventory', async () => {
            const requestId = 'req-1';
            const mockRequest = { id: requestId, bookId: 'book-1', status: BookRequestStatus.PENDING };
            const mockInventory = { id: 'inv-1', bookId: 'book-1', status: 'AVAILABLE' };

            mockPrismaService.bookRequest.findUnique.mockResolvedValue(mockRequest);
            mockPrismaService.inventoryItem.findFirst.mockResolvedValue(mockInventory);
            mockPrismaService.bookRequest.update.mockResolvedValue({ ...mockRequest, status: BookRequestStatus.APPROVED });
            mockPrismaService.inventoryItem.update.mockResolvedValue({ ...mockInventory, status: 'RESERVED' });

            await service.approve(requestId);

            // Transaction passes the client, so we expect calls on the mockPrismaService (which is the client here)
            expect(prisma.bookRequest.update).toHaveBeenCalled();
            expect(prisma.inventoryItem.update).toHaveBeenCalled();
        });
    });
});
