import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import { CreateEstateDto } from './dto/create-estate.dto';
import { UpdateEstateFinancialSettingsDto } from './dto/update-estate-financial-settings.dto';

@Injectable()
export class EstatesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateEstateDto) {
    const ownerUser = await this.prisma.user.findUnique({
      where: { id: data.owner_user_id },
      select: { id: true, role: true, is_active: true },
    });

    if (!ownerUser) {
      throw new NotFoundException('Owner user not found');
    }

    if (ownerUser.role !== Role.OWNER) {
      throw new BadRequestException('Assigned owner must have OWNER role');
    }

    if (!ownerUser.is_active) {
      throw new BadRequestException(
        'Cannot assign an inactive owner to an estate',
      );
    }

    return this.prisma.estate.create({
      data: {
        name: data.name,
        address: data.address,
        city: data.city,
        owner_id: ownerUser.id,
      },
      include: { houses: true, owner: true },
    });
  }

  async assignCaretaker(estateId: string, userId: string) {
    const estate = await this.prisma.estate.findUnique({
      where: { id: estateId },
      select: { id: true },
    });

    if (!estate) {
      throw new NotFoundException('Estate not found');
    }

    const caretaker = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, is_active: true },
    });

    if (!caretaker) {
      throw new NotFoundException('Caretaker user not found');
    }

    if (caretaker.role !== Role.CARETAKER) {
      throw new BadRequestException('Assigned user must have CARETAKER role');
    }

    if (!caretaker.is_active) {
      throw new BadRequestException('Cannot assign an inactive caretaker');
    }

    await this.prisma.caretakerEstate.upsert({
      where: {
        user_id_estate_id: {
          user_id: userId,
          estate_id: estateId,
        },
      },
      update: {},
      create: {
        user_id: userId,
        estate_id: estateId,
      },
    });

    return { message: 'Caretaker assigned to estate' };
  }

  async replaceCaretaker(
    estateId: string,
    outgoingUserId: string,
    incomingUserId: string,
    deactivateOutgoing = false,
  ) {
    const estate = await this.prisma.estate.findUnique({
      where: { id: estateId },
      select: { id: true, name: true },
    });

    if (!estate) {
      throw new NotFoundException('Estate not found');
    }

    const [outgoingCaretaker, incomingCaretaker] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: outgoingUserId },
        select: { id: true, role: true },
      }),
      this.prisma.user.findUnique({
        where: { id: incomingUserId },
        select: { id: true, role: true, is_active: true },
      }),
    ]);

    if (!outgoingCaretaker || outgoingCaretaker.role !== Role.CARETAKER) {
      throw new BadRequestException('Outgoing user must be an existing caretaker');
    }

    if (!incomingCaretaker || incomingCaretaker.role !== Role.CARETAKER) {
      throw new BadRequestException('Incoming user must be an existing caretaker');
    }

    if (!incomingCaretaker.is_active) {
      throw new BadRequestException('Incoming caretaker must be active');
    }

    const currentAssignment = await this.prisma.caretakerEstate.findFirst({
      where: {
        estate_id: estateId,
        user_id: outgoingUserId,
      },
      select: { id: true },
    });

    if (!currentAssignment) {
      throw new BadRequestException(
        'Outgoing caretaker is not assigned to this estate',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.caretakerEstate.delete({
        where: { id: currentAssignment.id },
      });

      await tx.caretakerEstate.upsert({
        where: {
          user_id_estate_id: {
            user_id: incomingUserId,
            estate_id: estateId,
          },
        },
        update: {},
        create: {
          user_id: incomingUserId,
          estate_id: estateId,
        },
      });

      if (deactivateOutgoing) {
        const remainingAssignments = await tx.caretakerEstate.count({
          where: { user_id: outgoingUserId },
        });

        if (remainingAssignments === 0) {
          await tx.user.update({
            where: { id: outgoingUserId },
            data: {
              is_active: false,
              refresh_token_hash: null,
            },
          });
        }
      }
    });

    return { message: `Caretaker switched for ${estate.name}` };
  }

  async findAll(user: { id: string; role: Role }) {
    if (user.role === Role.ADMIN) {
      return this.prisma.estate.findMany({
        include: {
          houses: {
            include: {
              tenancies: {
                where: { endDate: null },
                include: {
                  tenant: {
                    select: {
                      id: true,
                      email: true,
                      first_name: true,
                      last_name: true,
                      phone: true,
                    },
                  },
                },
              },
            },
          },
          owner: {
            select: {
              id: true,
              email: true,
              first_name: true,
              last_name: true,
            },
          },
          caretaker_estates: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  first_name: true,
                  last_name: true,
                  phone: true,
                },
              },
            },
            orderBy: { assigned_at: 'asc' },
          },
        },
        orderBy: { name: 'asc' },
      });
    }

    if (user.role === Role.OWNER) {
      return this.prisma.estate.findMany({
        where: { owner_id: user.id },
        include: { houses: true },
        orderBy: { name: 'asc' },
      });
    }

    if (user.role === Role.CARETAKER) {
      return this.prisma.estate.findMany({
        where: {
          caretaker_estates: { some: { user_id: user.id } },
        },
        include: { houses: true },
        orderBy: { name: 'asc' },
      });
    }

    throw new ForbiddenException('Access denied');
  }

  async findOne(id: string, user: { id: string; role: Role }) {
    const estate = await this.prisma.estate.findUnique({
      where: { id },
      include: {
        houses: true,
        owner: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
          },
        },
        caretaker_estates: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                first_name: true,
                last_name: true,
              },
            },
          },
        },
      },
    });

    if (!estate) {
      throw new NotFoundException('Estate not found');
    }

    if (user.role === Role.CARETAKER) {
      const hasAccess = estate.caretaker_estates.some(
        (entry) => entry.user_id === user.id,
      );
      if (!hasAccess) {
        throw new ForbiddenException('Access denied to this estate');
      }
    }

    if (user.role === Role.OWNER && estate.owner_id !== user.id) {
      throw new ForbiddenException('Access denied to this estate');
    }

    return estate;
  }

  async updateFinancialSettings(
    id: string,
    data: UpdateEstateFinancialSettingsDto,
    user: { id: string; role: Role },
  ) {
    const estate = await this.prisma.estate.findUnique({
      where: { id },
      select: { id: true, owner_id: true },
    });

    if (!estate) {
      throw new NotFoundException('Estate not found');
    }

    if (user.role === Role.OWNER && estate.owner_id !== user.id) {
      throw new ForbiddenException('Access denied to this estate');
    }

    if (user.role !== Role.ADMIN && user.role !== Role.OWNER) {
      throw new ForbiddenException(
        'Only admins and owners can update estate financial settings',
      );
    }

    const hasDeductionColumn = await this.hasMonthlyCaretakerDeductionColumn();

    if (!hasDeductionColumn) {
      return {
        message:
          'Estate financial settings are not available until the monthly caretaker deduction migration is applied.',
        monthlyCaretakerDeduction: 0,
      };
    }

    await this.prisma.$executeRaw`
        UPDATE "estates"
        SET "monthlyCaretakerDeduction" = ${new Prisma.Decimal(data.monthlyCaretakerDeduction)}
        WHERE "id" = ${id}
      `;

    const [settings] = await this.prisma.$queryRaw<
      Array<{ monthlyCaretakerDeduction: Prisma.Decimal }>
    >`
        SELECT "monthlyCaretakerDeduction"
        FROM "estates"
        WHERE "id" = ${id}
      `;

    return {
      message: 'Estate financial settings updated',
      monthlyCaretakerDeduction: Number(
        settings?.monthlyCaretakerDeduction ?? 0,
      ),
    };
  }

  private async hasMonthlyCaretakerDeductionColumn() {
    const result = await this.prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'estates'
          AND column_name = 'monthlyCaretakerDeduction'
      ) AS "exists"
    `;

    return result[0]?.exists ?? false;
  }
}
