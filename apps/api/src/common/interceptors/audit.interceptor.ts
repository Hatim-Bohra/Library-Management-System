 
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../../audit/audit.service';
import { AUDIT_KEY } from '../decorators/audit.decorator';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private auditService: AuditService,
  ) { }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditMetadata = this.reflector.getAllAndOverride<{
      action: string;
      entityType?: string;
    }>(AUDIT_KEY, [context.getHandler(), context.getClass()]);

    if (!auditMetadata) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    // Assuming AuthGuard puts user in request. If not authenticated, might need handling.

    return next.handle().pipe(
      tap(async (data) => {
        if (user) {
          // Try to infer entityId.
          // 1. From params (e.g. /requests/:id)
          // 2. From response data (e.g. { id: '...' })
          let entityId = request.params.id;
          if (!entityId && data && typeof data === 'object' && data.id) {
            entityId = data.id;
          }
          if (!entityId) entityId = 'N/A';

          const details = request.body ? { body: request.body } : undefined;

          await this.auditService
            .log(
              auditMetadata.action,
              auditMetadata.entityType || 'UNKNOWN',
              entityId,
              user.sub, // Assuming sub is the userId based on tokens.type.ts
              details,
            )
            .catch((err) => console.error('Audit Log Failed', err));
        }
      }),
    );
  }
}
