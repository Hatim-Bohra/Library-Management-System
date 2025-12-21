import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AddInventoryDto, UpdateInventoryStatusDto } from './dto';
import { InventoryAction, ItemStatus, Prisma } from '@prisma/client';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) { }

  async addCopy(bookId: string, dto: AddInventoryDto, userId: string) {
    // 1. Check if Book exists
    const book = await this.prisma.book.findUnique({ where: { id: bookId } });
    if (!book) throw new NotFoundException('Book not found');

    // 2. Transaction: Create Item, Create Log, Increment Book Copies
    // Updating book copies count is optional if we compute it,
    // but schema has 'copies' so let's keep it synced.
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const item = await tx.inventoryItem.create({
        data: {
          bookId,
          barcode: dto.barcode,
          location: dto.location,
          status: ItemStatus.AVAILABLE,
        },
      });

      await tx.inventoryTransaction.create({
        data: {
          inventoryItemId: item.id,
          action: InventoryAction.ADD,
          performedBy: userId,
          reason: 'Initial addition',
        },
      });

      await tx.book.update({
        where: { id: bookId },
        data: {
          copies: { increment: 1 },
          isAvailable: true, // If it was zero, now it's not
        },
      });

      return item;
    });
  }

  updateStatus(
    id: string,
    dto: UpdateInventoryStatusDto,
    userId: string,
  ) {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const item = await tx.inventoryItem.findUnique({ where: { id } });
      if (!item) throw new NotFoundException('Item not found');

      if (item.status === dto.status) return item;

      const updated = await tx.inventoryItem.update({
        where: { id },
        data: { status: dto.status },
      });

      await tx.inventoryTransaction.create({
        data: {
          inventoryItemId: id,
          action: InventoryAction.STATUS_CHANGE,
          performedBy: userId,
          reason: dto.reason,
        },
      });

      // Logic: If status becomes LOST or DAMAGED, maybe decrement copies?
      // "copies" usually means "Total owned", not "Currently on shelf".
      // "Available copies" is dynamic.
      // Let's assume 'copies' field in Book is TOTAL PHYSICAL copies in system (including loaned).
      // If LOST, maybe we should decrement?
      // For now, let's leave 'copies' as total inventory record count.

      return updated;
    });
  }

  listByBook(bookId: string) {
    return this.prisma.inventoryItem.findMany({
      where: { bookId },
      orderBy: { createdAt: 'asc' },
    });
  }

  // Atomic Reservation Logic
  // This might be called by Circulation Module later, but strictly implementing it as requested
  // "Atomic reservation (no race conditions)"
  reserveItem(bookId: string, userId: string) {
    // Find an available item and lock it
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Find first available item locked for update
      // Prisma doesn't support "FOR UPDATE SKIP LOCKED" natively in findFirst easily without raw query
      // But normal updateMany can act atomically as a "find and update one"

      /*
               Strategy: 
               Try to update the first available item found.
               If successful, we got the lock.
            */

      // 1. Check if Book generally available (optimization)
      // Not strictly necessary if we query items directly.

      // 2. Attempt to update ONE available item
      // Note: Prisma's updateMany returns { count: n }
      // We can't get the ID easily with updateMany in Postgres without `returning` (enabled in recent Prisma)
      // Let's try to query first, then update with check.
      // Or use raw query for true SKIP LOCKED.
      // For standard Prisma:

      const availableItems = await tx.inventoryItem.findMany({
        where: { bookId, status: ItemStatus.AVAILABLE },
        take: 1,
      });

      if (availableItems.length === 0) {
        throw new ConflictException('No copies available for reservation');
      }

      const targetItem = availableItems[0];

      // Optimistic Lock / Standard Transaction Lock
      // The read above (findMany) inside transaction provides some isolation depending on level.
      // But "Repeatable Read" might see snapshot.
      // Better: Update where status=AVAILABLE and Id=targetId.
      // If count is 0, someone else took it, retry.

      const updateOp = await tx.inventoryItem.updateMany({
        where: { id: targetItem.id, status: ItemStatus.AVAILABLE },
        data: { status: ItemStatus.RESERVED },
      });

      if (updateOp.count === 0) {
        throw new ConflictException(
          'Race condition detected: Item taken. Please retry.',
        );
      }

      // Log it
      await tx.inventoryTransaction.create({
        data: {
          inventoryItemId: targetItem.id,
          action: InventoryAction.STATUS_CHANGE,
          performedBy: userId,
          reason: 'Reserved for user',
        },
      });

      return targetItem;
    });
  }
}
