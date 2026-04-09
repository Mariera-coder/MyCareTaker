-- CreateEnum
CREATE TYPE "ComplaintSource" AS ENUM ('TENANT', 'CARETAKER');

-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('PENDING_CARETAKER', 'PENDING_OWNER', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "complaints" ADD COLUMN     "approved_at" TIMESTAMP(3),
ADD COLUMN     "approved_by" TEXT,
ADD COLUMN     "estimated_cost" DECIMAL(12,2),
ADD COLUMN     "expense_status" "ExpenseStatus" NOT NULL DEFAULT 'PENDING_CARETAKER',
ADD COLUMN     "final_cost" DECIMAL(12,2),
ADD COLUMN     "is_deductible" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "source" "ComplaintSource" NOT NULL DEFAULT 'TENANT';

-- CreateIndex
CREATE INDEX "complaints_expense_status_idx" ON "complaints"("expense_status");

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
