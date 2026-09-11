-- Preserve leads and delivery history. Stop the previous worker before applying.
ALTER TABLE "notification_outbox" ADD COLUMN "random_id" integer GENERATED ALWAYS AS IDENTITY;
--> statement-breakpoint
ALTER TABLE "notification_outbox" ADD CONSTRAINT "notification_outbox_random_id_unique" UNIQUE ("random_id");
--> statement-breakpoint
ALTER TABLE "notification_outbox" ALTER COLUMN "type" SET DEFAULT 'vk.lead.created';
--> statement-breakpoint
-- Sent records stay historical; only outstanding notifications switch delivery provider.
UPDATE "notification_outbox" SET "type" = 'vk.lead.created'
WHERE "type" = 'telegram.lead.created' AND "status" IN ('pending', 'processing');
