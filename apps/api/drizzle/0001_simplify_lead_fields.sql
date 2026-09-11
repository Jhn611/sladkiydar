-- Back up existing data before applying this migration.
-- Only removed form fields change; names, phones, comments and outbox jobs are retained.
ALTER TABLE "leads" DROP COLUMN "email";
--> statement-breakpoint
ALTER TABLE "leads" DROP COLUMN "company";
