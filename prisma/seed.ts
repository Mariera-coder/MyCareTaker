import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

import { PrismaClient, Role, RentRecordStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as pg from 'pg';
import * as bcrypt from 'bcrypt';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as never);

async function main(): Promise<void> {
  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash('Password123!', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@inkahome.com' },
    update: { password_hash: passwordHash, role: Role.ADMIN, is_active: true },
    create: {
      email: 'admin@inkahome.com',
      password_hash: passwordHash,
      first_name: 'System',
      last_name: 'Admin',
      role: Role.ADMIN,
    },
  });

  const owner = await prisma.user.upsert({
    where: { email: 'owner@inkahome.com' },
    update: { password_hash: passwordHash, role: Role.OWNER, is_active: true },
    create: {
      email: 'owner@inkahome.com',
      password_hash: passwordHash,
      first_name: 'James',
      last_name: 'Mwangi',
      phone: '+254700000001',
      role: Role.OWNER,
    },
  });

  const caretaker = await prisma.user.upsert({
    where: { email: 'caretaker@inkahome.com' },
    update: { password_hash: passwordHash, role: Role.CARETAKER, is_active: true },
    create: {
      email: 'caretaker@inkahome.com',
      password_hash: passwordHash,
      first_name: 'Peter',
      last_name: 'Kamau',
      phone: '+254700000002',
      role: Role.CARETAKER,
    },
  });

  const tenant = await prisma.user.upsert({
    where: { email: 'tenant@inkahome.com' },
    update: { password_hash: passwordHash, role: Role.TENANT, is_active: true },
    create: {
      email: 'tenant@inkahome.com',
      password_hash: passwordHash,
      first_name: 'Grace',
      last_name: 'Wanjiku',
      phone: '+254700000003',
      role: Role.TENANT,
    },
  });

  const existingEstate = await prisma.estate.findFirst({
    where: { name: 'Sunrise Apartments', owner_id: owner.id },
    select: { id: true },
  });

  const estate = existingEstate
    ? await prisma.estate.update({
        where: { id: existingEstate.id },
        data: {
          address: '123 Kenyatta Avenue',
          city: 'Nairobi',
          owner_id: owner.id,
        },
      })
    : await prisma.estate.create({
        data: {
          name: 'Sunrise Apartments',
          address: '123 Kenyatta Avenue',
          city: 'Nairobi',
          owner_id: owner.id,
        },
      });

  await prisma.caretakerEstate.upsert({
    where: {
      user_id_estate_id: {
        user_id: caretaker.id,
        estate_id: estate.id,
      },
    },
    update: {},
    create: {
      user_id: caretaker.id,
      estate_id: estate.id,
    },
  });

  const houseOne = await prisma.house.upsert({
    where: {
      estateId_name: {
        estateId: estate.id,
        name: 'House No.1',
      },
    },
    update: {
      rentAmount: 25000,
      isOccupied: true,
    },
    create: {
      estateId: estate.id,
      name: 'House No.1',
      rentAmount: 25000,
      isOccupied: true,
    },
  });

  await prisma.house.upsert({
    where: {
      estateId_name: {
        estateId: estate.id,
        name: 'House No.2',
      },
    },
    update: {
      rentAmount: 30000,
      isOccupied: false,
    },
    create: {
      estateId: estate.id,
      name: 'House No.2',
      rentAmount: 30000,
      isOccupied: false,
    },
  });

  await prisma.house.upsert({
    where: {
      estateId_name: {
        estateId: estate.id,
        name: 'House No.3',
      },
    },
    update: {
      rentAmount: 35000,
      isOccupied: false,
    },
    create: {
      estateId: estate.id,
      name: 'House No.3',
      rentAmount: 35000,
      isOccupied: false,
    },
  });

  const tenancy = await prisma.tenancy.upsert({
    where: {
      id: `${tenant.id}-${houseOne.id}`,
    },
    update: {
      tenantId: tenant.id,
      houseId: houseOne.id,
      startDate: new Date('2026-03-01T00:00:00.000Z'),
      endDate: null,
      monthlyRent: 25000,
    },
    create: {
      id: `${tenant.id}-${houseOne.id}`,
      tenantId: tenant.id,
      houseId: houseOne.id,
      startDate: new Date('2026-03-01T00:00:00.000Z'),
      monthlyRent: 25000,
    },
  });

  const currentMonth = new Date();
  const monthYear = `${currentMonth.getUTCFullYear()}-${String(
    currentMonth.getUTCMonth() + 1,
  ).padStart(2, '0')}`;

  await prisma.rentRecord.upsert({
    where: {
      tenancyId_monthYear: {
        tenancyId: tenancy.id,
        monthYear,
      },
    },
    update: {
      amountDue: 25000,
      amountPaid: 0,
      deficit: 25000,
      status: RentRecordStatus.PENDING,
      carriedForwardAmount: 0,
    },
    create: {
      tenancyId: tenancy.id,
      monthYear,
      amountDue: 25000,
      amountPaid: 0,
      deficit: 25000,
      status: RentRecordStatus.PENDING,
      carriedForwardAmount: 0,
    },
  });

  console.log('Seed complete.');
  console.log(`Admin: ${admin.email}`);
  console.log(`Owner: ${owner.email}`);
  console.log(`Caretaker: ${caretaker.email}`);
  console.log(`Tenant: ${tenant.email}`);
  console.log('Password for all seeded accounts: Password123!');
}

main()
  .catch((error: unknown) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
