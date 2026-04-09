/*
  Warnings:

  - Made the column `owner_id` on table `estates` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "complaints_status_idx";

-- DropIndex
DROP INDEX "tenancies_houseId_active_key";

-- DropIndex
DROP INDEX "tenancies_tenantId_active_key";

-- AlterTable
ALTER TABLE "estates" ALTER COLUMN "owner_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "payments" RENAME CONSTRAINT "payments_new_pkey" TO "payments_pkey";

-- AlterTable
ALTER TABLE "rent_records" ALTER COLUMN "status" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "estates_owner_id_idx" ON "estates"("owner_id");
