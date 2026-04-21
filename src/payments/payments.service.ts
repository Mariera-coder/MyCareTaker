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

    const billingAnchorDay = tenancy.startDate.getUTCDate();
    const monthYear = this.getBillingCycleMonthYear(new Date(), billingAnchorDay);
    const current = await this.prisma.rentRecord.findUnique({
      where: { tenancyId_monthYear: { tenancyId: tenancy.id, monthYear } },
    });

    if (!current) {
      throw new NotFoundException('Current rent record not found');
    }

    const allRecords = await this.prisma.rentRecord.findMany({
      where: { tenancyId: tenancy.id },
      orderBy: { monthYear: 'asc' },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    const previousMonth = this.getPreviousBillingCycleMonthYear(monthYear, billingAnchorDay);
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

    const currentBreakdown = this.buildRentBreakdown(
      Number(tenancy.monthlyRent),
      Number(current.carriedForwardAmount),
      Number(current.amountDue),
    );
    const settlement = this.buildSettlementSummary(
      allRecords,
      tenancy.startDate,
      Number(tenancy.monthlyRent),
    );
    const displayRecords = allRecords
      .slice(-4)
      .reverse()
      .map((record) => {
        const recordSettlement = settlement.recordsById.get(record.id);
        return {
          ...record,
          amountDue: Number(record.amountDue),
          amountPaid: Number(record.amountPaid),
          deficit: Number(record.deficit),
          carriedForwardAmount: Number(record.carriedForwardAmount),
          baseRent: Number(tenancy.monthlyRent),
          securityDepositCharged: this.buildRentBreakdown(
            Number(tenancy.monthlyRent),
            Number(record.carriedForwardAmount),
            Number(record.amountDue),
          ).securityDepositCharged,
          displayBalance:
            record.id === current.id
              ? Number(record.deficit)
              : recordSettlement?.remainingBalance ?? Number(record.deficit),
          displayStatus:
            record.id === current.id
              ? record.status
              : recordSettlement?.remainingBalance === 0
                ? RentRecordStatus.PAID
                : record.status,
          pendingConfirmation: record.payments.some(
            (payment) => !payment.confirmedByCaretaker && !payment.rejectedByCaretaker,
          ),
        };
      });
    const previousSettlement = previousRecord
      ? settlement.recordsById.get(previousRecord.id) ?? null
      : null;

    return {
      tenancy: {
        id: tenancy.id,
        monthlyRent: Number(tenancy.monthlyRent),
        securityDepositAmount: Number(tenancy.securityDepositAmount),
        creditBalance: Number(tenancy.creditBalance),
        moveInDate: tenancy.startDate,
        house: tenancy.house,
        estate: tenancy.house.estate,
      },
      summary: {
        monthlyRentDue: Number(current.amountDue),
        amountPaidThisMonth: Number(current.amountPaid),
        outstandingBalance: Number(current.deficit),
        securityDepositAmount: Number(tenancy.securityDepositAmount),
        includesSecurityDeposit: monthYear === this.getMonthYear(tenancy.startDate),
        baseRent: currentBreakdown.baseRent,
        carriedForward: currentBreakdown.carriedForward,
        securityDepositCharged: currentBreakdown.securityDepositCharged,
        depositSettled: settlement.depositSettled,
        creditBalance: Number(tenancy.creditBalance),
      },
      previousMonthStatus: previousRecord
        ? {
            status:
              previousSettlement?.remainingBalance === 0
                ? RentRecordStatus.PAID
                : previousRecord.status,
            deficit: previousSettlement?.remainingBalance ?? Number(previousRecord.deficit),
          }
        : null,
      rentRecords: displayRecords,
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

    const monthYear = this.getBillingCycleMonthYear(new Date(), tenancy.startDate.getUTCDate());
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

    const houses = await this.prisma.house.findMany({
      where: { estateId },
      include: {
        tenancies: {
          where: { endDate: null },
          include: {
            tenant: {
              select: { id: true, first_name: true, last_name: true, phone: true, email: true },
            },
            rentRecords: {
              orderBy: { monthYear: 'asc' },
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
      const cycleMonthYear = activeTenancy
        ? this.getBillingCycleMonthYear(new Date(), activeTenancy.startDate.getUTCDate())
        : null;
      const previousCycleMonthYear =
        activeTenancy && cycleMonthYear
          ? this.getPreviousBillingCycleMonthYear(
              cycleMonthYear,
              activeTenancy.startDate.getUTCDate(),
            )
          : null;
      const currentRecord =
        activeTenancy && cycleMonthYear
          ? activeTenancy.rentRecords.find((record) => record.monthYear === cycleMonthYear) ?? null
          : null;
      const previousRecord =
        activeTenancy && previousCycleMonthYear
          ? activeTenancy.rentRecords.find((record) => record.monthYear === previousCycleMonthYear) ?? null
          : null;
      const settlement = activeTenancy
        ? this.buildSettlementSummary(
            activeTenancy.rentRecords,
            activeTenancy.startDate,
            Number(activeTenancy.monthlyRent),
          )
        : null;
      const breakdown = currentRecord
        ? this.buildRentBreakdown(
            activeTenancy ? Number(activeTenancy.monthlyRent) : 0,
            Number(currentRecord.carriedForwardAmount),
            Number(currentRecord.amountDue),
          )
        : this.buildRentBreakdown(0, 0, 0);

      return {
        houseId: house.id,
        houseName: house.name,
        tenantId: activeTenancy?.tenant.id ?? null,
        tenantName: activeTenancy
          ? `${activeTenancy.tenant.first_name} ${activeTenancy.tenant.last_name}`.trim()
          : 'Vacant',
        tenantPhone: activeTenancy?.tenant.phone ?? null,
        tenantEmail: activeTenancy?.tenant.email ?? null,
        monthlyRent: activeTenancy ? Number(activeTenancy.monthlyRent) : Number(house.rentAmount),
        carriedForward: breakdown.carriedForward,
        securityDepositCharged: breakdown.securityDepositCharged,
        depositSettled: settlement?.depositSettled ?? true,
        expectedThisMonth: breakdown.totalDue,
        paid: currentRecord ? Number(currentRecord.amountPaid) : 0,
        deficit: currentRecord ? Number(currentRecord.deficit) : 0,
        securityDepositAmount: activeTenancy ? Number(activeTenancy.securityDepositAmount) : 0,
        prevMonthStatus: previousRecord
          ? (settlement?.recordsById.get(previousRecord.id)?.remainingBalance ?? Number(previousRecord.deficit)) === 0
            ? 'Fully paid'
            : `Deficit KES ${(settlement?.recordsById.get(previousRecord.id)?.remainingBalance ?? Number(previousRecord.deficit)).toLocaleString()}`
          : 'No record',
      };
    });

    const totalRentExpected = rows.reduce((sum, row) => sum + row.expectedThisMonth, 0);
    const totalCollected = rows.reduce((sum, row) => sum + row.paid, 0);
    const totalDeficit = rows.reduce((sum, row) => sum + row.deficit, 0);
    const occupiedUnits = rows.filter((row) => row.tenantName !== 'Vacant').length;
    const vacantUnits = rows.length - occupiedUnits;

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
        occupiedUnits,
        vacantUnits,
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

      const currentRecordedPaid = Number(payment.rentRecord.amountPaid);
      const totalAppliedToCurrent = currentRecordedPaid + Number(payment.amount);
      const deficit = Math.max(Number(payment.rentRecord.amountDue) - totalAppliedToCurrent, 0);
      const appliedToCurrent = Math.min(totalAppliedToCurrent, Number(payment.rentRecord.amountDue));
      const creditIncrease = Math.max(totalAppliedToCurrent - Number(payment.rentRecord.amountDue), 0);
      const status =
        deficit <= 0
          ? RentRecordStatus.PAID
          : appliedToCurrent > 0
            ? RentRecordStatus.PARTIAL
            : RentRecordStatus.PENDING;

      await tx.rentRecord.update({
        where: { id: payment.rentRecordId },
        data: {
          amountPaid: new Prisma.Decimal(appliedToCurrent),
          deficit: new Prisma.Decimal(deficit),
          status,
          confirmedByCaretaker: true,
          caretakerConfirmedAt: new Date(),
        },
      });

      if (creditIncrease > 0) {
        await tx.tenancy.update({
          where: { id: payment.tenancyId },
          data: {
            creditBalance: {
              increment: new Prisma.Decimal(creditIncrease),
            },
          },
        });
      }

      return updatedPayment;
    });
  }

  async getEstatePaymentConfirmations(estateId: string, userId: string, role: Role) {
    await this.ensureEstateAccess(estateId, userId, role);
    await this.ensureMonthlyRecordsForEstate(estateId);

    const tenancies = await this.prisma.tenancy.findMany({
      where: {
        house: { estateId },
      },
      include: {
        tenant: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            phone: true,
            email: true,
          },
        },
        house: {
          select: {
            id: true,
            name: true,
          },
        },
        payments: {
          where: {
            confirmedByCaretaker: true,
            rejectedByCaretaker: false,
          },
          orderBy: { paymentDate: 'desc' },
          include: {
            rentRecord: {
              select: {
                monthYear: true,
              },
            },
          },
        },
      },
      orderBy: [
        { house: { name: 'asc' } },
        { startDate: 'desc' },
      ],
    });

    const pendingPayments = await this.prisma.payment.findMany({
      where: {
        confirmedByCaretaker: false,
        rejectedByCaretaker: false,
        tenancy: {
          house: { estateId },
        },
      },
      include: {
        tenancy: {
          include: {
            house: true,
            tenant: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                phone: true,
                email: true,
              },
            },
          },
        },
        rentRecord: {
          select: {
            monthYear: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      tenants: tenancies.map((tenancy) => ({
        tenancyId: tenancy.id,
        tenantId: tenancy.tenant.id,
        tenantName: `${tenancy.tenant.first_name} ${tenancy.tenant.last_name}`.trim(),
        tenantPhone: tenancy.tenant.phone,
        tenantEmail: tenancy.tenant.email,
        houseId: tenancy.house.id,
        houseName: tenancy.house.name,
        isActive: tenancy.endDate === null,
        creditBalance: Number(tenancy.creditBalance),
        receipts: tenancy.payments.map((payment) => ({
          id: payment.id,
          amount: Number(payment.amount),
          paymentDate: payment.paymentDate,
          confirmedAt: payment.confirmedAt,
          paymentType: payment.paymentType,
          cycleLabel: payment.rentRecord.monthYear,
          note: payment.note,
        })),
      })),
      pendingPayments: pendingPayments.map((payment) => ({
        id: payment.id,
        tenancyId: payment.tenancyId,
        tenantId: payment.tenancy.tenant.id,
        tenantName: `${payment.tenancy.tenant.first_name} ${payment.tenancy.tenant.last_name}`.trim(),
        tenantPhone: payment.tenancy.tenant.phone,
        tenantEmail: payment.tenancy.tenant.email,
        houseName: payment.tenancy.house.name,
        amountClaimed: Number(payment.amount),
        paymentType: payment.paymentType,
        dateSubmitted: payment.createdAt,
        cycleLabel: payment.rentRecord.monthYear,
        note: payment.note,
      })),
    };
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
    const billingAnchorDay = tenancy.startDate.getUTCDate();
    const currentCycleStart = this.getBillingCycleStart(now, billingAnchorDay);
    let cursor = new Date(
      Date.UTC(
        tenancy.startDate.getUTCFullYear(),
        tenancy.startDate.getUTCMonth(),
        tenancy.startDate.getUTCDate(),
      ),
    );
    let previousDeficit = 0;

    const existing = await this.prisma.rentRecord.findMany({
      where: { tenancyId },
      orderBy: { monthYear: 'asc' },
    });
    const recordMap = new Map(existing.map((record) => [record.monthYear, record]));
    let availableCredit = Number(tenancy.creditBalance);
    if (existing.length > 0) {
      previousDeficit = Number(existing[existing.length - 1].deficit);
    }

    while (cursor <= currentCycleStart) {
      const monthYear = this.getMonthYear(cursor);
      const existingRecord = recordMap.get(monthYear);

      if (!existingRecord) {
        const isFirstTenancyMonth = monthYear === this.getMonthYear(tenancy.startDate);
        const securityDeposit = isFirstTenancyMonth ? Number(tenancy.securityDepositAmount) : 0;
        const grossAmountDue = Number(tenancy.monthlyRent) + previousDeficit + securityDeposit;
        const creditApplied = Math.min(grossAmountDue, availableCredit);
        const amountDue = grossAmountDue;
        const amountPaid = creditApplied;
        const deficit = Math.max(grossAmountDue - creditApplied, 0);
        const created = await this.prisma.rentRecord.create({
          data: {
            tenancyId,
            monthYear,
            amountDue: new Prisma.Decimal(amountDue),
            amountPaid: new Prisma.Decimal(amountPaid),
            deficit: new Prisma.Decimal(deficit),
            status:
              deficit <= 0
                ? RentRecordStatus.PAID
                : amountPaid > 0
                  ? RentRecordStatus.PARTIAL
                  : previousDeficit > 0
                    ? RentRecordStatus.CARRIED_FORWARD
                    : RentRecordStatus.PENDING,
            carriedForwardAmount: new Prisma.Decimal(previousDeficit),
            confirmedByCaretaker: creditApplied > 0,
            caretakerConfirmedAt: creditApplied > 0 ? new Date() : null,
          },
        });
        recordMap.set(monthYear, created);
        previousDeficit = deficit;
        availableCredit -= creditApplied;
      } else {
        previousDeficit = Number(existingRecord.deficit);
      }

      cursor = this.addBillingCycleMonths(cursor, 1, billingAnchorDay);
    }

    if (availableCredit !== Number(tenancy.creditBalance)) {
      await this.prisma.tenancy.update({
        where: { id: tenancyId },
        data: {
          creditBalance: new Prisma.Decimal(availableCredit),
        },
      });
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

  private buildRentBreakdown(baseRent: number, carriedForward: number, amountDue: number) {
    const securityDepositCharged = Math.max(amountDue - baseRent - carriedForward, 0);
    return {
      baseRent,
      carriedForward,
      securityDepositCharged,
      totalDue: amountDue,
    };
  }

  private buildSettlementSummary(
    records: Array<{
      monthYear: string;
      id: string;
      amountDue: Prisma.Decimal | number;
      amountPaid: Prisma.Decimal | number;
      carriedForwardAmount: Prisma.Decimal | number;
      status: RentRecordStatus;
    }>,
    tenancyStartDate: Date,
    baseRent: number,
  ) {
    const outstandingByRecord = new Map<string, { rent: number; deposit: number }>();
    let hasDepositCharge = false;

    for (const record of records) {
      const breakdown = this.buildRentBreakdown(
        baseRent,
        Number(record.carriedForwardAmount),
        Number(record.amountDue),
      );
      outstandingByRecord.set(record.id, {
        rent: breakdown.baseRent,
        deposit: breakdown.securityDepositCharged,
      });

      if (breakdown.securityDepositCharged > 0) {
        hasDepositCharge = true;
      }
    }

    for (const record of records) {
      let remainingPayment = Number(record.amountPaid);

      for (const [, outstanding] of outstandingByRecord) {
        if (remainingPayment <= 0) {
          break;
        }

        if (outstanding.rent > 0) {
          const applied = Math.min(outstanding.rent, remainingPayment);
          outstanding.rent -= applied;
          remainingPayment -= applied;
        }

        if (remainingPayment <= 0) {
          break;
        }

        if (outstanding.deposit > 0) {
          const applied = Math.min(outstanding.deposit, remainingPayment);
          outstanding.deposit -= applied;
          remainingPayment -= applied;
        }
      }
    }

    const recordsById = new Map<string, { remainingBalance: number }>();
    let hasOutstandingDeposit = false;

    for (const [recordId, outstanding] of outstandingByRecord) {
      const remainingBalance = outstanding.rent + outstanding.deposit;
      recordsById.set(recordId, { remainingBalance });
      if (outstanding.deposit > 0) {
        hasOutstandingDeposit = true;
      }
    }

    return {
      depositSettled: hasDepositCharge ? !hasOutstandingDeposit : true,
      recordsById,
    };
  }

  private getBaseRentForRecord(tenancyStartDate: Date, monthlyRent: number, monthYear: string) {
    if (this.getMonthYear(tenancyStartDate) !== monthYear) {
      return monthlyRent;
    }

    const startDay = tenancyStartDate.getUTCDate();
    const daysInMonth = new Date(
      Date.UTC(tenancyStartDate.getUTCFullYear(), tenancyStartDate.getUTCMonth() + 1, 0),
    ).getUTCDate();
    const occupiedDays = daysInMonth - startDay + 1;
    const prorated = (monthlyRent * occupiedDays) / daysInMonth;

    return this.roundCurrency(prorated);
  }

  private roundCurrency(value: number) {
    return Math.round(value * 100) / 100;
  }

  private getPreviousMonthYear(monthYear: string) {
    const [year, month] = monthYear.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 2, 1));
    return this.getMonthYear(date);
  }

  private getBillingCycleMonthYear(date: Date, billingAnchorDay: number) {
    return this.getMonthYear(this.getBillingCycleStart(date, billingAnchorDay));
  }

  private getBillingCycleStart(date: Date, billingAnchorDay: number) {
    const currentDay = date.getUTCDate();
    const base = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
    const targetMonthDate =
      currentDay >= billingAnchorDay
        ? base
        : new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() - 1, 1));

    return this.withBillingAnchorDay(targetMonthDate, billingAnchorDay);
  }

  private addBillingCycleMonths(date: Date, months: number, billingAnchorDay: number) {
    const shifted = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
    return this.withBillingAnchorDay(shifted, billingAnchorDay);
  }

  private getPreviousBillingCycleMonthYear(monthYear: string, billingAnchorDay: number) {
    const [year, month] = monthYear.split('-').map(Number);
    const currentCycleStart = this.withBillingAnchorDay(
      new Date(Date.UTC(year, month - 1, 1)),
      billingAnchorDay,
    );

    return this.getMonthYear(this.addBillingCycleMonths(currentCycleStart, -1, billingAnchorDay));
  }

  private withBillingAnchorDay(date: Date, billingAnchorDay: number) {
    const daysInMonth = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), Math.min(billingAnchorDay, daysInMonth)),
    );
  }
}
