import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../common/types';
import { CreateHouseDto } from './dto/create-house.dto';
import { ManualRegisterTenantDto } from './dto/manual-register-tenant.dto';

const BCRYPT_SALT_ROUNDS = 12;

@Injectable()
export class HousesService {
  constructor(private readonly prisma: PrismaService) {}

  async createHouse(dto: CreateHouseDto, user: AuthenticatedUser) {
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admins can create houses');
    }

    return this.prisma.house.create({
      data: {
        name: dto.name,
        estateId: dto.estateId,
        rentAmount: new Prisma.Decimal(dto.rentAmount),
      },
    });
  }

  async listAvailableHouses() {
    return this.prisma.house.findMany({
      where: { isOccupied: false },
      include: { estate: true },
      orderBy: [{ estateId: 'asc' }, { name: 'asc' }],
    });
  }

  async listByEstate(estateId: string, user: AuthenticatedUser) {
    await this.ensureEstateAccess(estateId, user);

    return this.prisma.house.findMany({
      where: { estateId },
      include: {
        estate: true,
        tenancies: {
          where: { endDate: null },
          include: {
            tenant: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                phone: true,
                email: true,
                is_active: true,
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async updateRent(houseId: string, rentAmount: number, actorId: string) {
    const actor = await this.prisma.user.findUnique({
      where: { id: actorId },
      select: { role: true },
    });

    if (!actor || actor.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admins can update rent amount');
    }

    const house = await this.prisma.house.findUnique({ where: { id: houseId } });

    if (!house) {
      throw new NotFoundException('House not found');
    }

    const updated = await this.prisma.house.update({
      where: { id: houseId },
      data: { rentAmount: new Prisma.Decimal(rentAmount) },
    });

    await this.prisma.auditLog.create({
      data: {
        actor_id: actorId,
        action: 'HOUSE_RENT_UPDATED',
        entity: 'House',
        entity_id: houseId,
        before: { rentAmount: house.rentAmount.toString() },
        after: { rentAmount: updated.rentAmount.toString() },
      },
    });

    return updated;
  }

  async updateSecurityDeposit(
    houseId: string,
    securityDepositAmount: number,
    actorId: string,
  ) {
    const actor = await this.prisma.user.findUnique({
      where: { id: actorId },
      select: { role: true },
    });

    if (!actor || actor.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admins can update security deposit');
    }

    const tenancy = await this.prisma.tenancy.findFirst({
      where: { houseId, endDate: null },
      include: {
        house: true,
        rentRecords: {
          orderBy: { monthYear: 'desc' },
          take: 1,
        },
      },
    });

    if (!tenancy) {
      throw new NotFoundException('Active tenancy not found for this house');
    }

    const previousAmount = Number(tenancy.securityDepositAmount);
    const delta = securityDepositAmount - previousAmount;

    const updatedTenancy = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.tenancy.update({
        where: { id: tenancy.id },
        data: {
          securityDepositAmount: new Prisma.Decimal(securityDepositAmount),
        },
        include: {
          tenant: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              phone: true,
              email: true,
              is_active: true,
            },
          },
        },
      });

      const monthYear = this.getBillingCycleMonthYear(
        new Date(),
        tenancy.startDate.getUTCDate(),
      );
      const currentRecord = await tx.rentRecord.findUnique({
        where: {
          tenancyId_monthYear: {
            tenancyId: tenancy.id,
            monthYear,
          },
        },
      });

      if (currentRecord && delta !== 0) {
        const amountDue = Math.max(Number(currentRecord.amountDue) + delta, 0);
        const deficit = Math.max(amountDue - Number(currentRecord.amountPaid), 0);
        await tx.rentRecord.update({
          where: { id: currentRecord.id },
          data: {
            amountDue: new Prisma.Decimal(amountDue),
            deficit: new Prisma.Decimal(deficit),
            status:
              deficit <= 0
                ? 'PAID'
                : Number(currentRecord.amountPaid) > 0
                  ? 'PARTIAL'
                  : 'PENDING',
          },
        });
      }

      await tx.auditLog.create({
        data: {
          actor_id: actorId,
          action: 'HOUSE_SECURITY_DEPOSIT_UPDATED',
          entity: 'Tenancy',
          entity_id: tenancy.id,
          before: { securityDepositAmount: previousAmount },
          after: { securityDepositAmount },
        },
      });

      return updated;
    });

    return updatedTenancy;
  }

  async vacateTenant(houseId: string, actorId: string) {
    const actor = await this.prisma.user.findUnique({
      where: { id: actorId },
      select: { id: true, role: true },
    });

    if (!actor || actor.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admins can vacate tenants');
    }

    const tenancy = await this.prisma.tenancy.findFirst({
      where: { houseId, endDate: null },
      include: { tenant: true, house: true },
    });

    if (!tenancy) {
      throw new NotFoundException('Active tenancy not found for this house');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.tenancy.update({
        where: { id: tenancy.id },
        data: { endDate: new Date() },
      });

      await tx.user.update({
        where: { id: tenancy.tenantId },
        data: { is_active: false, refresh_token_hash: null },
      });

      await tx.house.update({
        where: { id: houseId },
        data: { isOccupied: false },
      });
    });

    return { message: 'Tenant vacated and house is now available.' };
  }

  async manualRegisterTenant(dto: ManualRegisterTenantDto, actorId: string) {
    const actor = await this.prisma.user.findUnique({
      where: { id: actorId },
      select: { role: true },
    });

    if (!actor || actor.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admins can register tenants');
    }

    const house = await this.prisma.house.findUnique({ where: { id: dto.houseId } });
    if (!house) {
      throw new NotFoundException('House not found');
    }
    if (house.isOccupied) {
      throw new ConflictException('House already has an active tenancy');
    }

    const activeTenancy = await this.prisma.tenancy.findFirst({
      where: { houseId: dto.houseId, endDate: null },
      select: { id: true },
    });
    if (activeTenancy) {
      throw new ConflictException('House already has an active tenancy');
    }

    const { firstName, lastName } = this.splitName(dto.fullName);
    const password = this.generateTemporaryPassword();
    const email = dto.email ?? (await this.generateEmail(dto.fullName, dto.phone));
    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    const user = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email,
          password_hash: passwordHash,
          first_name: firstName,
          last_name: lastName,
          phone: dto.phone,
          role: Role.TENANT,
          is_active: true,
        },
      });

      await tx.tenancy.create({
        data: {
          houseId: house.id,
          tenantId: createdUser.id,
          startDate: new Date(),
          monthlyRent: house.rentAmount,
          securityDepositAmount: house.rentAmount,
        },
      });

      await tx.house.update({
        where: { id: house.id },
        data: { isOccupied: true },
      });

      return createdUser;
    });

    return {
      message: 'Tenant registered successfully.',
      credentials: { email, password },
      userId: user.id,
    };
  }

  private async ensureEstateAccess(estateId: string, user: AuthenticatedUser) {
    if (user.role === Role.ADMIN) {
      return;
    }

    if (user.role === Role.OWNER) {
      const estate = await this.prisma.estate.findFirst({
        where: { id: estateId, owner_id: user.id },
        select: { id: true },
      });
      if (!estate) {
        throw new ForbiddenException('Access denied to this estate');
      }
      return;
    }

    if (user.role === Role.CARETAKER) {
      const assignment = await this.prisma.caretakerEstate.findFirst({
        where: { estate_id: estateId, user_id: user.id },
        select: { id: true },
      });
      if (!assignment) {
        throw new ForbiddenException('Access denied to this estate');
      }
      return;
    }

    throw new ForbiddenException('Access denied');
  }

  private splitName(fullName: string) {
    const parts = fullName.trim().split(/\s+/);
    const firstName = parts.shift() ?? 'New';
    const lastName = parts.join(' ') || 'Tenant';
    return { firstName, lastName };
  }

  private generateTemporaryPassword() {
    return `Temp${Math.random().toString(36).slice(2, 10)}!9`;
  }

  private async generateEmail(fullName: string, phone: string) {
    const safe = fullName.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '');
    const digits = phone.replace(/\D/g, '').slice(-4) || 'user';
    let candidate = `${safe || 'tenant'}.${digits}@mycaretaker.local`;
    let suffix = 1;
    while (await this.prisma.user.findFirst({ where: { email: candidate }, select: { id: true } })) {
      candidate = `${safe || 'tenant'}.${digits}.${suffix}@mycaretaker.local`;
      suffix += 1;
    }
    return candidate;
  }

  private getMonthYear(date: Date) {
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
  }

  private getBillingCycleMonthYear(date: Date, billingAnchorDay: number) {
    const currentDay = date.getUTCDate();
    const base = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
    const targetMonthDate =
      currentDay >= billingAnchorDay
        ? base
        : new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() - 1, 1));
    const daysInMonth = new Date(
      Date.UTC(targetMonthDate.getUTCFullYear(), targetMonthDate.getUTCMonth() + 1, 0),
    ).getUTCDate();

    return this.getMonthYear(
      new Date(
        Date.UTC(
          targetMonthDate.getUTCFullYear(),
          targetMonthDate.getUTCMonth(),
          Math.min(billingAnchorDay, daysInMonth),
        ),
      ),
    );
  }
}
