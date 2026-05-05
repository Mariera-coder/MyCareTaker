CREATE TABLE "caretaker_salary_payments" (
    "id" TEXT NOT NULL,
    "estate_id" TEXT NOT NULL,
    "caretaker_user_id" TEXT,
    "paid_by_owner_id" TEXT NOT NULL,
    "salary_month_year" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "note" TEXT,
    "paid_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "caretaker_salary_payments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "caretaker_salary_payments_estate_id_idx" ON "caretaker_salary_payments"("estate_id");
CREATE INDEX "caretaker_salary_payments_salary_month_year_idx" ON "caretaker_salary_payments"("salary_month_year");
CREATE INDEX "caretaker_salary_payments_caretaker_user_id_idx" ON "caretaker_salary_payments"("caretaker_user_id");
CREATE INDEX "caretaker_salary_payments_paid_by_owner_id_idx" ON "caretaker_salary_payments"("paid_by_owner_id");

ALTER TABLE "caretaker_salary_payments" ADD CONSTRAINT "caretaker_salary_payments_estate_id_fkey" FOREIGN KEY ("estate_id") REFERENCES "estates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "caretaker_salary_payments" ADD CONSTRAINT "caretaker_salary_payments_caretaker_user_id_fkey" FOREIGN KEY ("caretaker_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "caretaker_salary_payments" ADD CONSTRAINT "caretaker_salary_payments_paid_by_owner_id_fkey" FOREIGN KEY ("paid_by_owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
