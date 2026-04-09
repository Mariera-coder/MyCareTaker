import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaymentType, Prisma, RentRecordStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async getTenantDashboard(userId: string) {
    const tenancy = await this.getActiveTenancy(userId);
    await this.ensureMonthlyRecords(tenancy.id);

    const monthYear = this.getMonthYear(new Date());
    const current = await this.prisma.rentRecord.findUnique({
      where: { tenancyId_monthYear: { tenancyId: tenancy.id, monthYear } },
    });

    if (!current) {
      throw new NotFoundException('Current rent record not found');
    }

    const records = await this.prisma.rentRecord.findMany({
      where: { tenancyId: tenancy.id },
      orderBy: { monthYear: 'desc' },
      take: 4,
      include: {
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    const previousMonth = this.getPreviousMonthYear(monthYear);
    const previousRecord = await this.prisma.rentRecord.findUnique({
      where: { tenancyId_monthYear: { tenancyId: tenancy.id, monthYear: previousMonth } },
    });

    const confirmedWeekTotals = await this.getWeeklyTotals(tenancy.id, monthYear);
    const weeklyGoal = Number(current.amountDue) / 4;

    const caretakerAssignment = await this.prisma.caretakerEstate.findFirst({
      where: { estate_id: tenancy.house.estateId },
      include: {
        user: {
          select: { first_name: true, last_name: true, phone: true },
        },
      },
      orderBy: { assigned_at: 'asc' },
    });

    return {
      tenancy: {
        id: tenancy.id,
        monthlyRent: Number(tenancy.monthlyRent),
        house: tenancy.house,
        estate: tenancy.house.estate,
      },
      summary: {
        monthlyRentDue: Number(current.amountDue),
        amountPaidThisMonth: Number(current.amountPaid),
        outstandingBalance: Number(current.deficit),
      },
      previousMonthStatus: previousRecord
        ? {
            status: previousRecord.status,
            deficit: Number(previousRecord.deficit),
          }
        : null,
      rentRecords: records.map((record) => ({
        ...record,
        amountDue: Number(record.amountDue),
        amountPaid: Number(record.amountPaid),
        deficit: Number(record.deficit),
        carriedForwardAmount: Number(record.carriedForwardAmount),
        pendingConfirmation: record.payments.some(
          (payment) => !payment.confirmedByCaretaker && !payment.rejectedByCaretaker,
        ),
      })),
      planner: Array.from({ length: 4 }, (_, index) => {
        const weekNumber = index + 1;
        const confirmedPaid = confirmedWeekTotals[weekNumber] ?? 0;
        return {
          weekNumber,
          targetAmount: weeklyGoal,
          confirmedPaid,
          remaining: Math.max(weeklyGoal - confirmedPaid, 0),
          progress: weeklyGoal > 0 ? Math.min((confirmedPaid / weeklyGoal) * 100, 100) : 0,
        };
      }),
      paymentInstructions: caretakerAssignment
        ? {
            caretakerName: `${caretakerAssignment.user.first_name} ${caretakerAssignment.user.last_name}`.trim(),
            caretakerPhoneNumber: caretakerAssignment.user.phone,
          }
        : null,
    };
  }

  async submitPayment(userId: string, amount: number, weekNumber?: number, note?: string) {
    const tenancy = await this.getActiveTenancy(userId);
    await this.ensureMonthlyRecords(tenancy.id);

    const monthYear = this.getMonthYear(new Date());
    const rentRecord = await this.prisma.rentRecord.findUnique({
      where: { tenancyId_monthYear: { tenancyId: tenancy.id, monthYear } },
    });

    if (!rentRecord) {
      throw new NotFoundException('Rent record not found');
    }

    const paymentType = weekNumber
      ? PaymentType.INSTALLMENT
      : amount >= Number(rentRecord.amountDue)
        ? PaymentType.FULL
        : PaymentType.PARTIAL;

    return this.prisma.payment.create({
      data: {
        rentRecordId: rentRecord.id,
        tenancyId: tenancy.id,
        amount: new Prisma.Decimal(amount),
        paymentDate: new Date(),
        paymentType,
        weekNumber: weekNumber ?? null,
        note,
      },
    });
  }

  async getEstateDashboard(estateId: string, userId: string, role: Role) {
    await this.ensureEstateAccess(estateId, userId, role);
    await this.ensureMonthlyRecordsForEstate(estateId);

    const monthYear = this.getMonthYear(new Date());
    const previousMonth = this.getPreviousMonthYear(monthYear);

    const houses = await this.prisma.house.findMany({
      where: { estateId },
      include: {
        tenancies: {
          where: { endDate: null },
          include: {
            tenant: {
              select: { id: true, first_name: true, last_name: true },
            },
            rentRecords: {
              where: { monthYear: { in: [monthYear, previousMonth] } },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const pendingPayments = await this.prisma.payment.count({
      where: {
        confirmedByCaretaker: false,
        rejectedByCaretaker: false,
        tenancy: {
          house: { estateId },
        },
      },
    });

    const rows = houses.map((house) => {
      const activeTenancy = house.tenancies[0] ?? null;
      const currentRecord = activeTenancy?.rentRecords.find((record) => record.monthYear === monthYear) ?? null;
      const previousRecord = activeTenancy?.rentRecords.find((record) => record.monthYear === previousMonth) ?? null;

      return {
        houseId: house.id,
        houseName: house.name,
        tenantName: activeTenancy
          ? `${activeTenancy.tenant.first_name} ${activeTenancy.tenant.last_name}`.trim()
          : 'Vacant',
        monthlyRent: activeTenancy ? Number(activeTenancy.monthlyRent) : Number(house.rentAmount),
        paid: currentRecord ? Number(currentRecord.amountPaid) : 0,
        deficit: currentRecord ? Number(currentRecord.deficit) : Number(house.rentAmount),
        prevMonthStatus: previousRecord
          ? previousRecord.status === RentRecordStatus.PAID
            ? 'Fully paid'
            : `Deficit KES ${Number(previousRecord.deficit).toLocaleString()}`
          : 'No record',
      };
    });

    const totalRentExpected = rows.reduce((sum, row) => sum + row.monthlyRent, 0);
    const totalCollected = rows.reduce((sum, row) => sum + row.paid, 0);
    const totalDeficit = rows.reduce((sum, row) => sum + row.deficit, 0);

    const approvedExpenses = await this.prisma.complaint.aggregate({
      where: {
        estateId,
        status: role === Role.OWNER ? undefined : undefined,
        approvedCost: { not: null },
      },
      _sum: { approvedCost: true },
    });

    return {
      stats: {
        totalRentExpected,
        totalCollected,
        totalDeficit,
        awaitingConfirmation: pendingPayments,
        totalApprovedDeductibleExpenses: Number(approvedExpenses._sum.approvedCost ?? 0),
      },
      rows,
    };
  }

  async listPendingPayments(estateId: string, userId: string) {
    await this.ensureEstateAccess(estateId, userId, Role.CARETAKER);

    const payments = await this.prisma.payment.findMany({
      where: {
        confirmedByCaretaker: false,
        rejectedByCaretaker: false,
        tenancy: { house: { estateId } },
      },
      include: {
        tenancy: {
          include: {
            house: true,
            tenant: {
              select: { first_name: true, last_name: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return payments.map((payment) => ({
      id: payment.id,
      houseName: payment.tenancy.house.name,
      tenantName: `${payment.tenancy.tenant.first_name} ${payment.tenancy.tenant.last_name}`.trim(),
      amountClaimed: Number(payment.amount),
      paymentType: payment.paymentType,
      dateSubmitted: payment.createdAt,
      weekNumber: payment.weekNumber,
      note: payment.note,
    }));
  }

  async confirmPayment(paymentId: string, userId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        tenancy: { include: { house: true } },
        rentRecord: true,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    await this.ensureEstateAccess(payment.tenancy.house.estateId, userId, Role.CARETAKER);

    if (payment.confirmedByCaretaker || payment.rejectedByCaretaker) {
      throw new BadRequestException('Payment has already been reviewed');
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.payment.update({
        where: { id: paymentId },
        data: {
          confirmedByCaretaker: true,
          confirmedAt: new Date(),
        },
      });

      const amountPaid = Number(payment.rentRecord.amountPaid) + Number(payment.amount);
      const deficit = Math.max(Number(payment.rentRecord.amountDue) - amountPaid, 0);
      const status =
        deficit <= 0
          ? RentRecordStatus.PAID
          : amountPaid > 0
            ? RentRecordStatus.PARTIAL
            : RentRecordStatus.PENDING;

      await tx.rentRecord.update({
        where: { id: payment.rentRecordId },
        data: {
          amountPaid: new Prisma.Decimal(amountPaid),
          deficit: new Prisma.Decimal(deficit),
          status,
          confirmedByCaretaker: true,
          caretakerConfirmedAt: new Date(),
        },
      });

      return updatedPayment;
    });
  }

  async rejectPayment(paymentId: string, reason: string, userId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { tenancy: { include: { house: true } } },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    await this.ensureEstateAccess(payment.tenancy.house.estateId, userId, Role.CARETAKER);

    return this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        rejectedByCaretaker: true,
        rejectionReason: reason,
      },
    });
  }

  async getMonthlyReport(estateId: string, userId: string, role: Role, month: number, year: number) {
    await this.ensureEstateAccess(estateId, userId, role);
    await this.ensureMonthlyRecordsForEstate(estateId);

    const monthYear = `${year}-${String(month).padStart(2, '0')}`;
    const estate = await this.prisma.estate.findUnique({
      where: { id: estateId },
      select: { id: true, name: true, owner_id: true },
    });
    if (!estate) {
      throw new NotFoundException('Estate not found');
    }

    const rows = await this.prisma.house.findMany({
      where: { estateId },
      include: {
        tenancies: {
          where: { OR: [{ endDate: null }, { endDate: { gte: new Date(`${monthYear}-01T00:00:00.000Z`) } }] },
          include: {
            rentRecords: { where: { monthYear } },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const units = rows.map((house) => {
      const tenancy = house.tenancies[0] ?? null;
      const record = tenancy?.rentRecords[0] ?? null;
      const rentCollected = record ? Number(record.amountPaid) : 0;
      return {
        unit_id: house.id,
        unit_number: house.name,
        monthly_rent: tenancy ? Number(tenancy.monthlyRent) : Number(house.rentAmount),
        rent_collected: rentCollected,
        complaint_deductions: 0,
        net_amount: rentCollected,
      };
    });

    const totalRentCollected = units.reduce((sum, unit) => sum + unit.rent_collected, 0);
    const approved = await this.prisma.complaint.aggregate({
      where: {
        estateId,
        approvedCost: { not: null },
      },
      _sum: { approvedCost: true },
    });
    const totalDeductions = Number(approved._sum.approvedCost ?? 0);

    return {
      estate_id: estate.id,
      estate_name: estate.name,
      owner_user_id: estate.owner_id,
      month,
      year,
      total_rent_collected: totalRentCollected,
      total_deductions: totalDeductions,
      net_owner_payout: totalRentCollected - totalDeductions,
      unassigned_deductions: 0,
      units,
    };
  }

  private async getActiveTenancy(userId: string) {
    const tenancy = await this.prisma.tenancy.findFirst({
      where: { tenantId: userId, endDate: null },
      include: {
        house: {
          include: {
            estate: true,
          },
        },
      },
    });

    if (!tenancy) {
      throw new NotFoundException('Active tenancy not found');
    }

    return tenancy;
  }

  private async ensureMonthlyRecordsForEstate(estateId: string) {
    const tenancies = await this.prisma.tenancy.findMany({
      where: { endDate: null, house: { estateId } },
      select: { id: true },
    });
    await Promise.all(tenancies.map((tenancy) => this.ensureMonthlyRecords(tenancy.id)));
  }

  private async ensureMonthlyRecords(tenancyId: string) {
    const tenancy = await this.prisma.tenancy.findUnique({
      where: { id: tenancyId },
      include: { house: true },
    });

    if (!tenancy) {
      throw new NotFoundException('Tenancy not found');
    }

    const now = new Date();
    const currentMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    let cursor = new Date(Date.UTC(tenancy.startDate.getUTCFullYear(), tenancy.startDate.getUTCMonth(), 1));
    let previousDeficit = 0;

    const existing = await this.prisma.rentRecord.findMany({
      where: { tenancyId },
      orderBy: { monthYear: 'asc' },
    });
    const recordMap = new Map(existing.map((record) => [record.monthYear, record]));
    if (existing.length > 0) {
      previousDeficit = Number(existing[existing.length - 1].deficit);
    }

    while (cursor <= currentMonth) {
      const monthYear = this.getMonthYear(cursor);
      const existingRecord = recordMap.get(monthYear);

      if (!existingRecord) {
        const amountDue = Number(tenancy.house.rentAmount) + previousDeficit;
        const created = await this.prisma.rentRecord.create({
          data: {
            tenancyId,
            monthYear,
            amountDue: new Prisma.Decimal(amountDue),
            amountPaid: new Prisma.Decimal(0),
            deficit: new Prisma.Decimal(amountDue),
            status: previousDeficit > 0 ? RentRecordStatus.CARRIED_FORWARD : RentRecordStatus.PENDING,
            carriedForwardAmount: new Prisma.Decimal(previousDeficit),
          },
        });
        recordMap.set(monthYear, created);
        previousDeficit = amountDue;
      } else {
        previousDeficit = Number(existingRecord.deficit);
      }

      cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1));
    }
  }

  private async getWeeklyTotals(tenancyId: string, monthYear: string) {
    const payments = await this.prisma.payment.findMany({
      where: {
        tenancyId,
        confirmedByCaretaker: true,
        rentRecord: { monthYear },
        weekNumber: { not: null },
      },
    });
    return payments.reduce<Record<number, number>>((acc, payment) => {
      const week = payment.weekNumber ?? 0;
      acc[week] = (acc[week] ?? 0) + Number(payment.amount);
      return acc;
    }, {});
  }

  private async ensureEstateAccess(estateId: string, userId: string, role: Role) {
    if (role === Role.ADMIN) {
      return;
    }
    if (role === Role.CARETAKER) {
      const assignment = await this.prisma.caretakerEstate.findFirst({
        where: { estate_id: estateId, user_id: userId },
      });
      if (!assignment) {
        throw new ForbiddenException('Access denied to this estate');
      }
      return;
    }
    if (role === Role.OWNER) {
      const estate = await this.prisma.estate.findFirst({
        where: { id: estateId, owner_id: userId },
      });
      if (!estate) {
        throw new ForbiddenException('Access denied to this estate');
      }
      return;
    }
    throw new ForbiddenException('Access denied');
  }

  private getMonthYear(date: Date) {
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
  }

  private getPreviousMonthYear(monthYear: string) {
    const [year, month] = monthYear.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 2, 1));
    return this.getMonthYear(date);
  }
}
