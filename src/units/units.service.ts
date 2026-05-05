// @ts-nocheck
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class UnitsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    unit_number: string;
    estate_id: string;
    monthly_rent: number;
    description?: string;
  }) {
    return this.prisma.unit.create({
      data: {
        unit_number: data.unit_number,
        estate_id: data.estate_id,
        monthly_rent: new Prisma.Decimal(data.monthly_rent),
        description: data.description,
      },
    });
  }

  async findByEstate(estateId: string) {
    return this.prisma.unit.findMany({
      where: { estate_id: estateId },
      include: {
        tenant_profile: {
          include: {
            user: {
              select: {
                email: true,
                first_name: true,
                last_name: true,
                phone: true,
              },
            },
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const unit = await this.prisma.unit.findUnique({
      where: { id },
      include: {
        estate: true,
        tenant_profile: {
          include: {
            user: {
              select: {
                email: true,
                first_name: true,
                last_name: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!unit) {
      throw new NotFoundException('Unit not found');
    }

    return unit;
  }
}
