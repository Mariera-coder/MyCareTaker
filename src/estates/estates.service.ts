import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import { CreateEstateDto } from './dto/create-estate.dto';

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

  async findAll(user: { id: string; role: Role }) {
    if (user.role === Role.ADMIN) {
      return this.prisma.estate.findMany({
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
        },
      });
    }

    if (user.role === Role.OWNER) {
      return this.prisma.estate.findMany({
        where: { owner_id: user.id },
        include: { houses: true },
      });
    }

    if (user.role === Role.CARETAKER) {
      return this.prisma.estate.findMany({
        where: {
          caretaker_estates: { some: { user_id: user.id } },
        },
        include: { houses: true },
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
}
