import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { HousesService } from './houses.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser, Role } from '../common/types';
import { UpdateHouseRentDto } from './dto/update-house-rent.dto';
import { UpdateHouseSecurityDepositDto } from './dto/update-house-security-deposit.dto';
import { CreateHouseDto } from './dto/create-house.dto';
import { ManualRegisterTenantDto } from './dto/manual-register-tenant.dto';

@Controller('houses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HousesController {
  constructor(private readonly housesService: HousesService) {}

  @Post()
  @Roles(Role.ADMIN)
  createHouse(@Body() dto: CreateHouseDto, @CurrentUser() user: AuthenticatedUser) {
    return this.housesService.createHouse(dto, user);
  }

  @Get('available')
  @Roles(Role.ADMIN)
  listAvailableHouses() {
    return this.housesService.listAvailableHouses();
  }

  @Get('estate/:estateId')
  listByEstate(@Param('estateId') estateId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.housesService.listByEstate(estateId, user);
  }

  @Patch(':houseId/rent')
  @Roles(Role.ADMIN)
  updateRent(
    @Param('houseId') houseId: string,
    @Body() dto: UpdateHouseRentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.housesService.updateRent(houseId, dto.rentAmount, user.id);
  }

  @Patch(':houseId/security-deposit')
  @Roles(Role.ADMIN)
  updateSecurityDeposit(
    @Param('houseId') houseId: string,
    @Body() dto: UpdateHouseSecurityDepositDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.housesService.updateSecurityDeposit(
      houseId,
      dto.securityDepositAmount,
      user.id,
    );
  }

  @Post(':houseId/vacate')
  @Roles(Role.ADMIN)
  vacateTenant(@Param('houseId') houseId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.housesService.vacateTenant(houseId, user.id);
  }

  @Post('manual-register-tenant')
  @Roles(Role.ADMIN)
  manualRegisterTenant(
    @Body() dto: ManualRegisterTenantDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.housesService.manualRegisterTenant(dto, user.id);
  }
}
