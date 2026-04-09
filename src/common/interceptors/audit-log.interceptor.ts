import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request } from 'express';
import { AuditLogService } from '../../audit-log/audit-log.service';
import { AuthenticatedUser } from '../types';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
    constructor(private readonly auditLogService: AuditLogService) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        const request = context.switchToHttp().getRequest<Request>();
        const method = request.method;

        // Only audit state-changing operations
        if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
            return next.handle();
        }

        const user = (request as Request & { user?: AuthenticatedUser }).user;
        if (!user) {
            return next.handle();
        }

        const handler = context.getHandler().name;
        const controller = context.getClass().name;

        return next.handle().pipe(
            tap((responseBody: unknown) => {
                void this.auditLogService.log({
                    actorId: user.id,
                    action: `${method} ${controller}.${handler}`,
                    entity: controller.replace('Controller', ''),
                    entityId: (responseBody as Record<string, string>)?.id ?? 'unknown',
                    after: responseBody as Record<string, unknown>,
                });
            }),
        );
    }
}
