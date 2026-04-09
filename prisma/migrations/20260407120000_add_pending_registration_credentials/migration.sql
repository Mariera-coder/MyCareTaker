ALTER TABLE "pending_registrations"
ADD COLUMN "email" TEXT NOT NULL DEFAULT '',
ADD COLUMN "passwordHash" TEXT NOT NULL DEFAULT '';

UPDATE "pending_registrations"
SET "email" = CONCAT('pending.', "id", '@gmail.com')
WHERE "email" = '';

UPDATE "pending_registrations"
SET "passwordHash" = 'PENDING_PASSWORD_RESET'
WHERE "passwordHash" = '';

ALTER TABLE "pending_registrations"
ALTER COLUMN "email" DROP DEFAULT,
ALTER COLUMN "passwordHash" DROP DEFAULT;
