import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PaymentsService } from '../payments/payments.service';
import { AuthenticatedUser } from '../common/types';
import { MonthlyEstateReportQueryDto } from './dto/monthly-estate-report-query.dto';

@Injectable()
export class ReportsService {
  constructor(private readonly paymentsService: PaymentsService) {}

  async getMonthlyEstateReport(
    estateId: string,
    query: MonthlyEstateReportQueryDto,
    user: AuthenticatedUser,
  ) {
    return this.paymentsService.getMonthlyReport(
      estateId,
      user.id,
      user.role,
      query.month,
      query.year,
    );
  }
}
