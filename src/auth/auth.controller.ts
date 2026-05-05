import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { JwtRefreshGuard } from '../common/guards/jwt-refresh.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types';
import { RefreshTokenUser } from './strategies/jwt-refresh.strategy';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CreatePendingRegistrationDto } from './dto/create-pending-registration.dto';
import { ApprovePendingRegistrationDto } from './dto/approve-pending-registration.dto';
import { DenyPendingRegistrationDto } from './dto/deny-pending-registration.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: CreatePendingRegistrationDto) {
    return this.authService.register(dto);
  }

  @Get('csrf')
  getCsrfToken(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const csrfToken = this.authService.ensureCsrfCookie(req, res);
    return { csrfToken };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { tokens, session } = await this.authService.login(dto);
    this.authService.issueAuthCookies(
      res,
      tokens.access_token,
      tokens.refresh_token,
    );
    return { session };
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  async refresh(
    @CurrentUser() user: RefreshTokenUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { tokens, session } = await this.authService.refresh(
      user.id,
      user.refreshToken,
    );
    this.authService.issueAuthCookies(
      res,
      tokens.access_token,
      tokens.refresh_token,
    );
    return { session };
  }

  @Get('session')
  @UseGuards(JwtAuthGuard)
  async getSession(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getSessionContext(user.id);
  }

  @Get('pending-registrations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async listPendingRegistrations() {
    return this.authService.listPendingRegistrations();
  }

  @Get('approval-options/houses')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async listAvailableHouses() {
    return this.authService.listAvailableHouses();
  }

  @Post('pending-registrations/:id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async approvePendingRegistration(
    @Param('id') id: string,
    @Body() dto: ApprovePendingRegistrationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.authService.approvePendingRegistration(id, dto, user.id);
  }

  @Post('pending-registrations/:id/deny')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async denyPendingRegistration(
    @Param('id') id: string,
    @Body() dto: DenyPendingRegistrationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.authService.denyPendingRegistration(id, dto.reason, user.id);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    await this.authService.logout(user.id);
    this.authService.clearAuthCookies(res);
    return { message: 'Logged out successfully' };
  }
}
