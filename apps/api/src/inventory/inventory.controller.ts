import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { AddInventoryDto, UpdateInventoryStatusDto } from './dto';
import { Roles, GetCurrentUserId } from '../auth/decorators';
import { Role } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Inventory')
@ApiBearerAuth()
@Controller()
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) { }

  @Roles(Role.ADMIN, Role.LIBRARIAN)
  @Post('books/:bookId/inventory')
  @ApiOperation({ summary: 'Add a physical copy to inventory' })
  addCopy(
    @Param('bookId', ParseUUIDPipe) bookId: string,
    @Body() dto: AddInventoryDto,
    @GetCurrentUserId() userId: string,
  ) {
    return this.inventoryService.addCopy(bookId, dto, userId);
  }

  @Roles(Role.ADMIN, Role.LIBRARIAN, Role.MEMBER) // Members might see availability detail
  @Get('books/:bookId/inventory')
  @ApiOperation({ summary: 'List inventory items for a book' })
  listByBook(@Param('bookId', ParseUUIDPipe) bookId: string) {
    return this.inventoryService.listByBook(bookId);
  }

  @Roles(Role.ADMIN, Role.LIBRARIAN)
  @Patch('inventory/:id/status')
  @ApiOperation({ summary: 'Update inventory item status' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInventoryStatusDto,
    @GetCurrentUserId() userId: string,
  ) {
    return this.inventoryService.updateStatus(id, dto, userId);
  }

  @Roles(Role.ADMIN, Role.LIBRARIAN)
  @Get('inventory/global-stats')
  @ApiOperation({ summary: 'Get global inventory statistics' })
  getGlobalStats() {
    return this.inventoryService.getGlobalStats();
  }

  @Roles(Role.ADMIN, Role.LIBRARIAN)
  @Get('inventory/stats')
  @ApiOperation({ summary: 'Get aggregated inventory stats for all books' })
  getInventoryStats(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ) {
    return this.inventoryService.getInventoryStats(
      page ? Number(page) : 1,
      limit ? Number(limit) : 10,
      search,
    );
  }

  @Roles(Role.ADMIN, Role.LIBRARIAN, Role.MEMBER)
  @Get('books/:bookId/inventory/stats')
  @ApiOperation({ summary: 'Get inventory stats for a specific book' })
  getBookInventoryStats(@Param('bookId', ParseUUIDPipe) bookId: string) {
    return this.inventoryService.getBookInventoryStats(bookId);
  }
}
