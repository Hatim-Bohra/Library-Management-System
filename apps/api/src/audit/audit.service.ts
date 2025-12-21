import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async findAll(skip = 0, take = 50) {
    return this.prisma.auditLog.findMany({
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { email: true, role: true },
        },
      },
    });
  }

  async log(
    action: string,
    entityType: string,
    entityId: string,
    performedBy: string,
    details?: any,
  ) {
    return this.prisma.auditLog.create({
      data: {
        action,
        entityType,
        entityId,
        performedBy,
        details: details ? JSON.stringify(details) : undefined,
      },
    });
  }
}
