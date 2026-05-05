import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser, Role } from '../common/types';
import { SubmitPaymentDto } from './dto/submit-payment.dto';
import { RejectPaymentDto } from './dto/reject-payment.dto';
import { IssueCaretakerSalaryDto } from './dto/issue-caretaker-salary.dto';

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('tenant/dashboard')
  @Roles(Role.TENANT)
  getTenantDashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.paymentsService.getTenantDashboard(user.id);
  }

  @Post('tenant')
  @Roles(Role.TENANT)
  submitPayment(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SubmitPaymentDto,
  ) {
    return this.paymentsService.submitPayment(
      user.id,
      dto.amount,
      dto.weekNumber,
      dto.note,
    );
  }

  @Get('estate/:estateId/dashboard')
  @Roles(Role.CARETAKER, Role.OWNER, Role.ADMIN)
  getEstateDashboard(
    @Param('estateId') estateId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.paymentsService.getEstateDashboard(
      estateId,
      user.id,
      user.role,
    );
  }

  @Get('estate/:estateId/pending')
  @Roles(Role.CARETAKER)
  listPendingPayments(
    @Param('estateId') estateId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.paymentsService.listPendingPayments(estateId, user.id);
  }

  @Get('estate/:estateId/confirmations')
  @Roles(Role.CARETAKER, Role.OWNER, Role.ADMIN)
  getEstatePaymentConfirmations(
    @Param('estateId') estateId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.paymentsService.getEstatePaymentConfirmations(
      estateId,
      user.id,
      user.role,
    );
  }

  @Patch(':paymentId/confirm')
  @Roles(Role.CARETAKER)
  confirmPayment(
    @Param('paymentId') paymentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.paymentsService.confirmPayment(paymentId, user.id);
  }

  @Patch(':paymentId/reject')
  @Roles(Role.CARETAKER)
  rejectPayment(
    @Param('paymentId') paymentId: string,
    @Body() dto: RejectPaymentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.paymentsService.rejectPayment(paymentId, dto.reason, user.id);
  }

  @Get('estate/:estateId/report')
  @Roles(Role.CARETAKER, Role.OWNER, Role.ADMIN)
  getMonthlyReport(
    @Param('estateId') estateId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    return this.paymentsService.getMonthlyReport(
      estateId,
      user.id,
      user.role,
      Number(month),
      Number(year),
    );
  }

  @Post('estate/:estateId/caretaker-salaries')
  @Roles(Role.OWNER, Role.ADMIN)
  issueCaretakerSalary(
    @Param('estateId') estateId: string,
    @Body() dto: IssueCaretakerSalaryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.paymentsService.issueCaretakerSalary(
      estateId,
      user.id,
      user.role,
      dto.amount,
      dto.month,
      dto.year,
      dto.note,
    );
  }
}
