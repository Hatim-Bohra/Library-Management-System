import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) { }

  findAll() {
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { email: true, role: true } },
      },
    });
  }

  log(
    userId: string,
    action: string,
    entityType: string,
    entityId: string,
    details?: any,
  ) {
    return this.prisma.auditLog.create({
      data: {
        performedBy: userId,
        action,
        entityType,
        entityId,
        details: details ? JSON.stringify(details) : undefined,
      },
    });
  }
}
