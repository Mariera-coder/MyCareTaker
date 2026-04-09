import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ComplaintsService } from './complaints.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { CaretakerReviewComplaintDto } from './dto/caretaker-review-complaint.dto';
import { OwnerReviewComplaintDto } from './dto/owner-review-complaint.dto';

@Controller('complaints')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService) {}

  @Post()
  createComplaint(
    @Body() data: CreateComplaintDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.complaintsService.createComplaint(data, user);
  }

  @Patch(':id/caretaker-review')
  caretakerReview(
    @Param('id') id: string,
    @Body() data: CaretakerReviewComplaintDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.complaintsService.caretakerReview(id, data, user);
  }

  @Patch(':id/owner-review')
  ownerReview(
    @Param('id') id: string,
    @Body() data: OwnerReviewComplaintDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.complaintsService.ownerReview(id, data, user);
  }

  @Get('estate/:estateId')
  listByEstate(
    @Param('estateId') estateId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.complaintsService.listByEstate(estateId, user);
  }

  @Get('tenant/:tenantId')
  listByTenant(
    @Param('tenantId') tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.complaintsService.listByTenant(tenantId, user);
  }
}
