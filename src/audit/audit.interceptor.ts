import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { AuditService } from './audit.service';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {
    console.log('🔥 AUDIT INTERCEPTOR CONSTRUCTED');
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpCtx = context.switchToHttp();
    const req = httpCtx.getRequest();
    const res = httpCtx.getResponse();

    console.log('🧩 INTERCEPT HIT', req.method, req.url);

    return next.handle().pipe(
      finalize(async () => {
        try {
          // Fastify-safe audit payload
          const auditAction = req.raw?.auditAction;
          if (!auditAction) return;

          // Log only successful responses
          if (res.statusCode >= 400) return;

          await this.auditService.log({
            userId: req.user?.sub ?? null,
            action: auditAction.action,
            entity: auditAction.entity,
            entityId: auditAction.entityId,
            metadata: auditAction.metadata ?? null,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
          });

          console.log('🧾 AUDIT LOG WRITTEN', auditAction);
        } catch (err) {
          // Never break request flow because of audit
          console.error('❌ AUDIT LOG FAILED', err);
        }
      }),
    );
  }
}
