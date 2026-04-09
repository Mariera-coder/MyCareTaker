import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EstatesModule } from './estates/estates.module';
import { UnitsModule } from './units/units.module';
import { AuditLogModule } from './audit-log/audit-log.module';
import { ComplaintsModule } from './complaints/complaints.module';
import { ReportsModule } from './reports/reports.module';
import { HousesModule } from './houses/houses.module';
import { PaymentsModule } from './payments/payments.module';
import { CsrfMiddleware } from './common/middleware/csrf.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuditLogModule,
    AuthModule,
    UsersModule,
    EstatesModule,
    UnitsModule,
    HousesModule,
    PaymentsModule,
    ComplaintsModule,
    ReportsModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CsrfMiddleware).forRoutes('*');
  }
}
