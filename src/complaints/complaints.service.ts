import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ComplaintStatus, Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../common/types';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { CaretakerReviewComplaintDto } from './dto/caretaker-review-complaint.dto';
import {
  OwnerReviewComplaintDto,
  OwnerReviewDecision,
} from './dto/owner-review-complaint.dto';

@Injectable()
export class ComplaintsService {
  constructor(private readonly prisma: PrismaService) {}

  async createComplaint(data: CreateComplaintDto, user: AuthenticatedUser) {
    if (user.role === Role.TENANT) {
      const tenancy = await this.prisma.tenancy.findFirst({
        where: { tenantId: user.id, endDate: null },
        include: { house: true },
      });

      if (!tenancy) {
        throw new BadRequestException('Active tenancy not found');
      }

      return this.prisma.complaint.create({
        data: {
          houseId: tenancy.houseId,
          tenancyId: tenancy.id,
          estateId: tenancy.house.estateId,
          description: data.description,
          filedByTenantId: user.id,
          status: ComplaintStatus.OPEN,
        },
        include: this.defaultInclude(),
      });
    }

    if (user.role === Role.CARETAKER) {
      if (!data.houseId) {
        throw new BadRequestException(
          'houseId is required for caretaker complaint submission',
        );
      }

      const house = await this.prisma.house.findUnique({
        where: { id: data.houseId },
        include: {
          tenancies: {
            where: { endDate: null },
          },
        },
      });

      if (!house) {
        throw new NotFoundException('House not found');
      }

      await this.ensureEstateAccess(house.estateId, user);

      const activeTenancy = house.tenancies[0];
      if (!activeTenancy) {
        throw new BadRequestException('House has no active tenancy');
      }

      return this.prisma.complaint.create({
        data: {
          houseId: house.id,
          tenancyId: activeTenancy.id,
          estateId: house.estateId,
          description: data.description,
          filedByTenantId: activeTenancy.tenantId,
          status: ComplaintStatus.OPEN,
        },
        include: this.defaultInclude(),
      });
    }

    throw new ForbiddenException(
      'Only tenants or caretakers can submit complaints',
    );
  }

  async caretakerReview(
    complaintId: string,
    data: CaretakerReviewComplaintDto,
    user: AuthenticatedUser,
  ) {
    if (user.role !== Role.CARETAKER) {
      throw new ForbiddenException('Only caretakers can review complaints');
    }

    const complaint = await this.prisma.complaint.findUnique({
      where: { id: complaintId },
    });

    if (!complaint) {
      throw new NotFoundException('Complaint not found');
    }

    await this.ensureEstateAccess(complaint.estateId, user);

    return this.prisma.complaint.update({
      where: { id: complaintId },
      data: {
        isDeductibleExpense:
          data.isDeductibleExpense ?? complaint.isDeductibleExpense,
        estimatedCost:
          data.estimatedCost === undefined
            ? complaint.estimatedCost
            : new Prisma.Decimal(data.estimatedCost),
        caretakerNotes: data.caretakerNotes ?? complaint.caretakerNotes,
        status: ComplaintStatus.CARETAKER_REVIEW,
      },
      include: this.defaultInclude(),
    });
  }

  async ownerReview(
    complaintId: string,
    data: OwnerReviewComplaintDto,
    user: AuthenticatedUser,
  ) {
    if (user.role !== Role.OWNER) {
      throw new ForbiddenException('Only estate owners can review complaints');
    }

    const complaint = await this.prisma.complaint.findUnique({
      where: { id: complaintId },
    });

    if (!complaint) {
      throw new NotFoundException('Complaint not found');
    }

    await this.ensureEstateAccess(complaint.estateId, user);

    const update =
      data.decision === OwnerReviewDecision.APPROVED
        ? {
            status: ComplaintStatus.OWNER_APPROVED,
            approvedCost:
              data.approvedCost === undefined
                ? complaint.estimatedCost
                : new Prisma.Decimal(data.approvedCost),
            ownerNotes: data.ownerNotes ?? complaint.ownerNotes,
          }
        : {
            status: ComplaintStatus.CARETAKER_REVIEW,
            ownerNotes: data.ownerNotes ?? 'Returned to caretaker',
          };

    return this.prisma.complaint.update({
      where: { id: complaintId },
      data: update,
      include: this.defaultInclude(),
    });
  }

  async listByEstate(estateId: string, user: AuthenticatedUser) {
    await this.ensureEstateAccess(estateId, user);

    return this.prisma.complaint.findMany({
      where: { estateId },
      include: this.defaultInclude(),
      orderBy: { createdAt: 'desc' },
    });
  }

  async listByTenant(tenantUserId: string, user: AuthenticatedUser) {
    if (user.role === Role.TENANT && user.id !== tenantUserId) {
      throw new ForbiddenException('Access denied');
    }

    const complaints = await this.prisma.complaint.findMany({
      where: { filedByTenantId: tenantUserId },
      include: this.defaultInclude(),
      orderBy: { createdAt: 'desc' },
    });

    if (user.role === Role.CARETAKER) {
      const assignments = await this.prisma.caretakerEstate.findMany({
        where: { user_id: user.id },
        select: { estate_id: true },
      });
      const allowed = new Set(assignments.map((item) => item.estate_id));
      return complaints.filter((complaint) => allowed.has(complaint.estateId));
    }

    if (user.role === Role.OWNER) {
      return complaints.filter(
        (complaint) => complaint.estate.owner_id === user.id,
      );
    }

    return complaints;
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

    if (user.role === Role.TENANT) {
      const tenancy = await this.prisma.tenancy.findFirst({
        where: { tenantId: user.id, endDate: null, house: { estateId } },
        select: { id: true },
      });
      if (!tenancy) {
        throw new ForbiddenException('Access denied to this estate');
      }
      return;
    }

    throw new ForbiddenException('Access denied');
  }

  private defaultInclude() {
    return {
      house: true,
      estate: true,
      tenancy: {
        include: {
          tenant: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              phone: true,
            },
          },
        },
      },
      filedByTenant: {
        select: { id: true, first_name: true, last_name: true, phone: true },
      },
    } as const;
  }
}
