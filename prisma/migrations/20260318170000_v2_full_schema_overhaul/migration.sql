CREATE TYPE "RentRecordStatus_new" AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'CARRIED_FORWARD');
CREATE TYPE "PaymentType_new" AS ENUM ('FULL', 'INSTALLMENT', 'PARTIAL');
CREATE TYPE "ComplaintStatus_new" AS ENUM ('OPEN', 'CARETAKER_REVIEW', 'OWNER_APPROVED', 'RESOLVED');
CREATE TYPE "RegistrationStatus_new" AS ENUM ('AWAITING_ADMIN', 'APPROVED', 'DENIED');
CREATE TYPE "PendingRegistrationRole" AS ENUM ('TENANT', 'CARETAKER', 'OWNER');

ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'ADMIN';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'OWNER';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'CARETAKER';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'TENANT';

ALTER TABLE "estates" DROP CONSTRAINT IF EXISTS "estates_owner_id_fkey";
ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "payments_unit_id_fkey";
ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "payments_tenant_id_fkey";
ALTER TABLE "complaints" DROP CONSTRAINT IF EXISTS "complaints_tenant_id_fkey";
ALTER TABLE "complaints" DROP CONSTRAINT IF EXISTS "complaints_estate_id_fkey";
ALTER TABLE "move_out_requests" DROP CONSTRAINT IF EXISTS "move_out_requests_tenant_id_fkey";
ALTER TABLE "move_out_requests" DROP CONSTRAINT IF EXISTS "move_out_requests_unit_id_fkey";

DROP TABLE IF EXISTS "payment_adjustments";
DROP TABLE IF EXISTS "move_out_requests";

ALTER TABLE "estates" ADD COLUMN "owner_id_new" TEXT;
UPDATE "estates" e
SET "owner_id_new" = op."user_id"
FROM "owner_profiles" op
WHERE e."owner_id" = op."id";
ALTER TABLE "estates" DROP COLUMN "owner_id";
ALTER TABLE "estates" RENAME COLUMN "owner_id_new" TO "owner_id";

CREATE TABLE "houses" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "estateId" TEXT NOT NULL,
    "rentAmount" DECIMAL(12,2) NOT NULL,
    "isOccupied" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "houses_pkey" PRIMARY KEY ("id")
);

INSERT INTO "houses" ("id", "name", "estateId", "rentAmount", "isOccupied", "createdAt")
SELECT
    "id",
    CASE "unit_number"
        WHEN 'A1' THEN 'House No.1'
        WHEN 'A2' THEN 'House No.2'
        WHEN 'B1' THEN 'House No.3'
        ELSE 'House ' || "unit_number"
    END,
    "estate_id",
    "monthly_rent",
    CASE WHEN "status" = 'OCCUPIED' THEN true ELSE false END,
    "created_at"
FROM "units";

CREATE TABLE "tenancies" (
    "id" TEXT NOT NULL,
    "houseId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "monthlyRent" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tenancies_pkey" PRIMARY KEY ("id")
);

INSERT INTO "tenancies" ("id", "houseId", "tenantId", "startDate", "endDate", "monthlyRent", "createdAt")
SELECT
    "tenant_profiles"."id",
    "tenant_profiles"."unit_id",
    "tenant_profiles"."user_id",
    COALESCE("tenant_profiles"."lease_start", "tenant_profiles"."created_at"),
    "tenant_profiles"."lease_end",
    COALESCE("units"."monthly_rent", 0),
    "tenant_profiles"."created_at"
FROM "tenant_profiles"
LEFT JOIN "units" ON "units"."id" = "tenant_profiles"."unit_id"
WHERE "tenant_profiles"."unit_id" IS NOT NULL;

CREATE TABLE "rent_records" (
    "id" TEXT NOT NULL,
    "tenancyId" TEXT NOT NULL,
    "monthYear" TEXT NOT NULL,
    "amountDue" DECIMAL(12,2) NOT NULL,
    "amountPaid" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "deficit" DECIMAL(12,2) NOT NULL,
    "status" "RentRecordStatus_new" NOT NULL DEFAULT 'PENDING',
    "carriedForwardAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "confirmedByCaretaker" BOOLEAN NOT NULL DEFAULT false,
    "caretakerConfirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "rent_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payments_new" (
    "id" TEXT NOT NULL,
    "rentRecordId" TEXT NOT NULL,
    "tenancyId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "paymentType" "PaymentType_new" NOT NULL,
    "weekNumber" INTEGER,
    "note" TEXT,
    "confirmedByCaretaker" BOOLEAN NOT NULL DEFAULT false,
    "confirmedAt" TIMESTAMP(3),
    "rejectedByCaretaker" BOOLEAN NOT NULL DEFAULT false,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payments_new_pkey" PRIMARY KEY ("id")
);

WITH monthly_paid AS (
    SELECT
        tp."id" AS tenant_profile_id,
        to_char(date_trunc('month', p."payment_date"), 'YYYY-MM') AS month_year,
        SUM(p."amount") AS amount_paid
    FROM "payments" p
    INNER JOIN "tenant_profiles" tp ON tp."id" = p."tenant_id"
    GROUP BY tp."id", to_char(date_trunc('month', p."payment_date"), 'YYYY-MM')
),
tenancy_lookup AS (
    SELECT
        t."id" AS tenancy_id,
        tp."id" AS tenant_profile_id,
        t."monthlyRent" AS monthly_rent
    FROM "tenancies" t
    INNER JOIN "tenant_profiles" tp ON tp."user_id" = t."tenantId" AND tp."unit_id" = t."houseId"
)
INSERT INTO "rent_records" ("id", "tenancyId", "monthYear", "amountDue", "amountPaid", "deficit", "status", "carriedForwardAmount", "confirmedByCaretaker", "caretakerConfirmedAt", "createdAt", "updatedAt")
SELECT
    md5(random()::text || clock_timestamp()::text || tl."tenancy_id" || mp."month_year"),
    tl."tenancy_id",
    mp."month_year",
    tl."monthly_rent",
    mp."amount_paid",
    GREATEST(tl."monthly_rent" - mp."amount_paid", 0),
    CASE
        WHEN mp."amount_paid" >= tl."monthly_rent" THEN 'PAID'::"RentRecordStatus_new"
        WHEN mp."amount_paid" > 0 THEN 'PARTIAL'::"RentRecordStatus_new"
        ELSE 'PENDING'::"RentRecordStatus_new"
    END,
    0,
    true,
    NOW(),
    NOW(),
    NOW()
FROM monthly_paid mp
INNER JOIN tenancy_lookup tl ON tl."tenant_profile_id" = mp."tenant_profile_id";

INSERT INTO "payments_new" ("id", "rentRecordId", "tenancyId", "amount", "paymentDate", "paymentType", "weekNumber", "note", "confirmedByCaretaker", "confirmedAt", "rejectedByCaretaker", "rejectionReason", "createdAt")
SELECT
    p."id",
    rr."id",
    rr."tenancyId",
    p."amount",
    p."payment_date",
    CASE
        WHEN p."amount" >= rr."amountDue" THEN 'FULL'::"PaymentType_new"
        ELSE 'PARTIAL'::"PaymentType_new"
    END,
    NULL,
    COALESCE(p."notes", p."reference"),
    true,
    p."payment_date",
    false,
    NULL,
    p."created_at"
FROM "payments" p
INNER JOIN "tenant_profiles" tp ON tp."id" = p."tenant_id"
INNER JOIN "tenancies" t ON t."tenantId" = tp."user_id" AND t."houseId" = tp."unit_id"
INNER JOIN "rent_records" rr
    ON rr."tenancyId" = t."id"
   AND rr."monthYear" = to_char(date_trunc('month', p."payment_date"), 'YYYY-MM');

ALTER TABLE "complaints" RENAME COLUMN "tenant_id" TO "tenancyId";
ALTER TABLE "complaints" RENAME COLUMN "estate_id" TO "estateId";
ALTER TABLE "complaints" RENAME COLUMN "is_deductible" TO "isDeductibleExpense";
ALTER TABLE "complaints" RENAME COLUMN "estimated_cost" TO "estimatedCost";
ALTER TABLE "complaints" RENAME COLUMN "final_cost" TO "approvedCost";
ALTER TABLE "complaints" RENAME COLUMN "created_at" TO "createdAt";
ALTER TABLE "complaints" RENAME COLUMN "updated_at" TO "updatedAt";
ALTER TABLE "complaints" DROP COLUMN IF EXISTS "subject";
ALTER TABLE "complaints" DROP COLUMN IF EXISTS "is_voided";
ALTER TABLE "complaints" DROP COLUMN IF EXISTS "voided_at";
ALTER TABLE "complaints" DROP COLUMN IF EXISTS "source";
ALTER TABLE "complaints" DROP COLUMN IF EXISTS "expense_status";
ALTER TABLE "complaints" DROP COLUMN IF EXISTS "approved_by";
ALTER TABLE "complaints" DROP COLUMN IF EXISTS "approved_at";
ALTER TABLE "complaints" ADD COLUMN "houseId" TEXT;
ALTER TABLE "complaints" ADD COLUMN "filedByTenantId" TEXT;
ALTER TABLE "complaints" ADD COLUMN "caretakerNotes" TEXT;
ALTER TABLE "complaints" ADD COLUMN "ownerNotes" TEXT;

UPDATE "complaints" c
SET
    "tenancyId" = t."id",
    "houseId" = t."houseId",
    "filedByTenantId" = t."tenantId"
FROM "tenant_profiles" tp
INNER JOIN "tenancies" t ON t."tenantId" = tp."user_id" AND t."houseId" = tp."unit_id"
WHERE c."tenancyId" = tp."id";

ALTER TABLE "complaints"
    ALTER COLUMN "tenancyId" SET NOT NULL,
    ALTER COLUMN "estateId" SET NOT NULL,
    ALTER COLUMN "houseId" SET NOT NULL,
    ALTER COLUMN "filedByTenantId" SET NOT NULL;

ALTER TABLE "complaints" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "complaints"
    ALTER COLUMN "status" TYPE "ComplaintStatus_new"
    USING CASE
        WHEN "status"::text IN ('OPEN', 'IN_PROGRESS') THEN 'CARETAKER_REVIEW'::"ComplaintStatus_new"
        WHEN "status"::text = 'RESOLVED' THEN 'RESOLVED'::"ComplaintStatus_new"
        WHEN "status"::text = 'CLOSED' THEN 'OWNER_APPROVED'::"ComplaintStatus_new"
        ELSE 'OPEN'::"ComplaintStatus_new"
    END;
ALTER TABLE "complaints" ALTER COLUMN "status" SET DEFAULT 'OPEN';

CREATE TABLE "pending_registrations" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "role" "PendingRegistrationRole" NOT NULL,
    "estateOfInterest" TEXT,
    "message" TEXT,
    "status" "RegistrationStatus_new" NOT NULL DEFAULT 'AWAITING_ADMIN',
    "reviewedByAdminId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pending_registrations_pkey" PRIMARY KEY ("id")
);

DROP TABLE "payments";
ALTER TABLE "payments_new" RENAME TO "payments";
DROP TABLE "tenant_profiles";
DROP TABLE "units";
DROP TABLE IF EXISTS "owner_profiles";

ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;

CREATE UNIQUE INDEX "houses_estateId_name_key" ON "houses"("estateId", "name");
CREATE INDEX "houses_estateId_idx" ON "houses"("estateId");
CREATE INDEX "tenancies_houseId_idx" ON "tenancies"("houseId");
CREATE INDEX "tenancies_tenantId_idx" ON "tenancies"("tenantId");
CREATE UNIQUE INDEX "tenancies_tenantId_active_key" ON "tenancies"("tenantId") WHERE "endDate" IS NULL;
CREATE UNIQUE INDEX "tenancies_houseId_active_key" ON "tenancies"("houseId") WHERE "endDate" IS NULL;
CREATE UNIQUE INDEX "rent_records_tenancyId_monthYear_key" ON "rent_records"("tenancyId", "monthYear");
CREATE INDEX "rent_records_monthYear_idx" ON "rent_records"("monthYear");
CREATE INDEX "payments_rentRecordId_idx" ON "payments"("rentRecordId");
CREATE INDEX "payments_tenancyId_idx" ON "payments"("tenancyId");
CREATE INDEX "complaints_houseId_idx" ON "complaints"("houseId");
CREATE INDEX "complaints_tenancyId_idx" ON "complaints"("tenancyId");
CREATE INDEX "complaints_estateId_idx" ON "complaints"("estateId");
CREATE INDEX "complaints_filedByTenantId_idx" ON "complaints"("filedByTenantId");
CREATE INDEX "pending_registrations_status_idx" ON "pending_registrations"("status");

ALTER TABLE "estates" ADD CONSTRAINT "estates_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "houses" ADD CONSTRAINT "houses_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "estates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tenancies" ADD CONSTRAINT "tenancies_houseId_fkey" FOREIGN KEY ("houseId") REFERENCES "houses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tenancies" ADD CONSTRAINT "tenancies_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "rent_records" ADD CONSTRAINT "rent_records_tenancyId_fkey" FOREIGN KEY ("tenancyId") REFERENCES "tenancies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_rentRecordId_fkey" FOREIGN KEY ("rentRecordId") REFERENCES "rent_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_tenancyId_fkey" FOREIGN KEY ("tenancyId") REFERENCES "tenancies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_houseId_fkey" FOREIGN KEY ("houseId") REFERENCES "houses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_tenancyId_fkey" FOREIGN KEY ("tenancyId") REFERENCES "tenancies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "estates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_filedByTenantId_fkey" FOREIGN KEY ("filedByTenantId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "pending_registrations" ADD CONSTRAINT "pending_registrations_reviewedByAdminId_fkey" FOREIGN KEY ("reviewedByAdminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

DROP TYPE IF EXISTS "UnitStatus";
DROP TYPE IF EXISTS "MoveOutStatus";
DROP TYPE IF EXISTS "PaymentMethod";
DROP TYPE IF EXISTS "ExpenseStatus";
DROP TYPE IF EXISTS "ComplaintSource";
DROP TYPE IF EXISTS "ComplaintStatus";
ALTER TYPE "ComplaintStatus_new" RENAME TO "ComplaintStatus";
ALTER TYPE "RentRecordStatus_new" RENAME TO "RentRecordStatus";
ALTER TYPE "PaymentType_new" RENAME TO "PaymentType";
DROP TYPE IF EXISTS "RegistrationStatus";
ALTER TYPE "RegistrationStatus_new" RENAME TO "RegistrationStatus";
