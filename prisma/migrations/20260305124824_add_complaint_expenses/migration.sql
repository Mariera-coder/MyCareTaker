-- DropForeignKey
ALTER TABLE "complaints" DROP CONSTRAINT "complaints_tenant_id_fkey";

-- AlterTable
ALTER TABLE "complaints" ALTER COLUMN "tenant_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
