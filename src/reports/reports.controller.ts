import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { MonthlyEstateReportQueryDto } from './dto/monthly-estate-report-query.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('estate/:estateId/monthly')
  getMonthlyEstateReport(
    @Param('estateId') estateId: string,
    @Query() query: MonthlyEstateReportQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reportsService.getMonthlyEstateReport(estateId, query, user);
  }
}
