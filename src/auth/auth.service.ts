import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  PendingRegistrationRole,
  Prisma,
  RegistrationStatus,
  Role,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayload, TokenPair } from '../common/types';
import { CreatePendingRegistrationDto } from './dto/create-pending-registration.dto';
import { ApprovePendingRegistrationDto } from './dto/approve-pending-registration.dto';
import {
  clearAuthCookies,
  ensureCsrfCookie,
  setAuthCookies,
} from './auth.utils';

const BCRYPT_SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: CreatePendingRegistrationDto) {
    const existingUser = await this.prisma.user.findFirst({
      where: { email: dto.email },
      select: { id: true },
    });

    if (existingUser) {
      throw new BadRequestException('Email is already registered');
    }

    const existingPending = await this.prisma.pendingRegistration.findFirst({
      where: {
        email: dto.email,
        status: RegistrationStatus.AWAITING_ADMIN,
      },
      select: { id: true },
    });

    if (existingPending) {
      throw new BadRequestException('A pending registration already exists for this email');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);

    const pendingRegistration = await this.prisma.pendingRegistration.create({
      data: {
        fullName: dto.fullName,
        phoneNumber: dto.phoneNumber,
        email: dto.email,
        passwordHash,
        role: dto.role,
        estateOfInterest: dto.estateOfInterest,
        message: dto.message,
        status: RegistrationStatus.AWAITING_ADMIN,
      },
    });

    return {
      id: pendingRegistration.id,
      message:
        'Your registration request has been submitted. The administrator will review and contact you.',
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.is_active) {
      throw new ForbiddenException('Account is deactivated');
    }

    if (!user.password_hash) {
      throw new ForbiddenException(
        'This account has not been issued login credentials yet.',
      );
    }

    const passwordValid = await bcrypt.compare(dto.password, user.password_hash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email ?? '',
      role: user.role,
    });

    await this.updateRefreshTokenHash(user.id, tokens.refresh_token);

    const session = await this.getSessionContext(user.id);

    return {
      tokens,
      session,
    };
  }

  async refresh(userId: string, refreshToken: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.refresh_token_hash) {
      throw new ForbiddenException('Access denied');
    }

    if (!user.is_active) {
      throw new ForbiddenException('Account is deactivated');
    }

    const tokenMatches = await bcrypt.compare(
      refreshToken,
      user.refresh_token_hash,
    );

    if (!tokenMatches) {
      throw new ForbiddenException('Access denied');
    }

    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email ?? '',
      role: user.role,
    });

    await this.updateRefreshTokenHash(user.id, tokens.refresh_token);

    const session = await this.getSessionContext(user.id);

    return {
      tokens,
      session,
    };
  }

  async logout(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refresh_token_hash: null },
    });
  }

  issueAuthCookies(
    response: Response,
    accessToken: string,
    refreshToken: string,
  ): void {
    setAuthCookies(response, this.config, accessToken, refreshToken);
  }

  clearAuthCookies(response: Response): void {
    clearAuthCookies(response, this.config);
  }

  ensureCsrfCookie(request: Request, response: Response): string {
    return ensureCsrfCookie(request, response, this.config);
  }

  async getSessionContext(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        role: true,
        phone: true,
        is_active: true,
      },
    });

    if (!user || !user.is_active) {
      throw new ForbiddenException('Account is deactivated');
    }

    const baseUser = {
      id: user.id,
      email: user.email ?? '',
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      phone: user.phone,
    };

    if (user.role === Role.TENANT) {
      const tenancy = await this.prisma.tenancy.findFirst({
        where: {
          tenantId: user.id,
          endDate: null,
        },
        include: {
          house: {
            include: {
              estate: {
                select: { id: true, name: true, address: true, city: true },
              },
            },
          },
        },
      });

      if (!tenancy) {
        throw new ForbiddenException('No active tenancy found for this tenant');
      }

      const caretakerAssignment = await this.prisma.caretakerEstate.findFirst({
        where: { estate_id: tenancy.house.estateId },
        include: {
          user: {
            select: {
              first_name: true,
              last_name: true,
              phone: true,
            },
          },
        },
        orderBy: { assigned_at: 'asc' },
      });

      return {
        user: baseUser,
        role: user.role,
        nextRoute: '/dashboard',
        estates: [],
        tenantContext: {
          tenancyId: tenancy.id,
          monthlyRent: Number(tenancy.monthlyRent),
          house: {
            id: tenancy.house.id,
            name: tenancy.house.name,
          },
          estate: tenancy.house.estate,
          caretaker: caretakerAssignment
            ? {
                name: `${caretakerAssignment.user.first_name} ${caretakerAssignment.user.last_name}`.trim(),
                phoneNumber: caretakerAssignment.user.phone,
              }
            : null,
        },
      };
    }

    if (user.role === Role.CARETAKER) {
      const assignments = await this.prisma.caretakerEstate.findMany({
        where: { user_id: user.id },
        include: {
          estate: {
            select: { id: true, name: true, address: true, city: true },
          },
        },
        orderBy: { assigned_at: 'asc' },
      });

      return {
        user: baseUser,
        role: user.role,
        nextRoute: '/select-estate',
        estates: assignments.map((entry) => entry.estate),
        tenantContext: null,
      };
    }

    if (user.role === Role.OWNER) {
      const estates = await this.prisma.estate.findMany({
        where: { owner_id: user.id },
        select: { id: true, name: true, address: true, city: true },
        orderBy: { name: 'asc' },
      });

      return {
        user: baseUser,
        role: user.role,
        nextRoute: '/select-estate',
        estates,
        tenantContext: null,
      };
    }

    return {
      user: baseUser,
      role: user.role,
      nextRoute: '/admin/registrations',
      estates: [],
      tenantContext: null,
    };
  }

  async listPendingRegistrations() {
    return this.prisma.pendingRegistration.findMany({
      where: { status: RegistrationStatus.AWAITING_ADMIN },
      orderBy: { createdAt: 'asc' },
    });
  }

  async listAvailableHouses() {
    return this.prisma.house.findMany({
      where: { isOccupied: false },
      include: {
        estate: {
          select: { id: true, name: true },
        },
      },
      orderBy: [{ estateId: 'asc' }, { name: 'asc' }],
    });
  }

  async approvePendingRegistration(
    registrationId: string,
    dto: ApprovePendingRegistrationDto,
    adminId: string,
  ) {
    const pendingRegistration = await this.prisma.pendingRegistration.findUnique({
      where: { id: registrationId },
    });

    if (!pendingRegistration) {
      throw new NotFoundException('Pending registration not found');
    }

    if (pendingRegistration.status !== RegistrationStatus.AWAITING_ADMIN) {
      throw new BadRequestException('Registration has already been reviewed');
    }

    if (pendingRegistration.role === PendingRegistrationRole.TENANT && !dto.houseId) {
      throw new BadRequestException(
        'A house assignment is required when approving a tenant',
      );
    }

    const { firstName, lastName } = this.splitName(pendingRegistration.fullName);
    const email = dto.email ?? pendingRegistration.email;
    const passwordHash = pendingRegistration.passwordHash;

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password_hash: passwordHash,
          first_name: firstName,
          last_name: lastName,
          phone: pendingRegistration.phoneNumber,
          role: pendingRegistration.role as Role,
          is_active: true,
        },
      });

      if (pendingRegistration.role === PendingRegistrationRole.TENANT) {
        const house = await tx.house.findUnique({
          where: { id: dto.houseId! },
        });

        if (!house || house.isOccupied) {
          throw new BadRequestException('Selected house is not available');
        }

        const activeTenancy = await tx.tenancy.findFirst({
          where: { houseId: house.id, endDate: null },
          select: { id: true },
        });

        if (activeTenancy) {
          throw new BadRequestException('Selected house already has an active tenancy');
        }

        await tx.tenancy.create({
          data: {
            houseId: house.id,
            tenantId: user.id,
            startDate: new Date(),
            monthlyRent: new Prisma.Decimal(house.rentAmount),
          },
        });

        await tx.house.update({
          where: { id: house.id },
          data: { isOccupied: true },
        });
      }

      if (
        pendingRegistration.role === PendingRegistrationRole.CARETAKER &&
        dto.estateIds?.length
      ) {
        await tx.caretakerEstate.createMany({
          data: dto.estateIds.map((estateId) => ({
            user_id: user.id,
            estate_id: estateId,
          })),
          skipDuplicates: true,
        });
      }

      if (
        pendingRegistration.role === PendingRegistrationRole.OWNER &&
        dto.estateIds?.length
      ) {
        await tx.estate.updateMany({
          where: { id: { in: dto.estateIds } },
          data: { owner_id: user.id },
        });
      }

      await tx.pendingRegistration.update({
        where: { id: pendingRegistration.id },
        data: {
          status: RegistrationStatus.APPROVED,
          reviewedByAdminId: adminId,
          reviewedAt: new Date(),
        },
      });

      return user;
    });

    return {
      message: 'Registration approved and credentials issued.',
      credentials: {
        email,
        password: 'Password set during registration request',
      },
      userId: result.id,
    };
  }

  async denyPendingRegistration(
    registrationId: string,
    reason: string,
    adminId: string,
  ) {
    const pendingRegistration = await this.prisma.pendingRegistration.findUnique({
      where: { id: registrationId },
      select: { id: true, status: true, message: true },
    });

    if (!pendingRegistration) {
      throw new NotFoundException('Pending registration not found');
    }

    if (pendingRegistration.status !== RegistrationStatus.AWAITING_ADMIN) {
      throw new BadRequestException('Registration has already been reviewed');
    }

    await this.prisma.pendingRegistration.update({
      where: { id: registrationId },
      data: {
        status: RegistrationStatus.DENIED,
        message: pendingRegistration.message
          ? `${pendingRegistration.message}\nDenied: ${reason}`
          : `Denied: ${reason}`,
        reviewedByAdminId: adminId,
        reviewedAt: new Date(),
      },
    });

    return { message: 'Registration denied.' };
  }

  private async generateTokens(payload: JwtPayload): Promise<TokenPair> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.config.getOrThrow<string>('JWT_ACCESS_EXPIRATION') as never,
      }),
      this.jwt.signAsync(payload, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.getOrThrow<string>('JWT_REFRESH_EXPIRATION') as never,
      }),
    ]);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  private async updateRefreshTokenHash(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const hash = await bcrypt.hash(refreshToken, BCRYPT_SALT_ROUNDS);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refresh_token_hash: hash },
    });
  }

  private splitName(fullName: string) {
    const parts = fullName.trim().split(/\s+/);
    const firstName = parts.shift() ?? 'New';
    const lastName = parts.join(' ') || 'User';
    return { firstName, lastName };
  }

}
