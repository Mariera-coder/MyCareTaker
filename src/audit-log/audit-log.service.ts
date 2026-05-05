import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    actorId: string;
    action: string;
    entity: string;
    entityId: string;
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  }): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        actor_id: params.actorId,
        action: params.action,
        entity: params.entity,
        entity_id: params.entityId,
        before: params.before ? (params.before as any) : undefined,
        after: params.after ? (params.after as any) : undefined,
      },
    });
  }
}
