CREATE TYPE "public"."outbox_status" AS ENUM('pending', 'processing', 'sent');
--> statement-breakpoint
CREATE TABLE "leads" (
  "id" uuid PRIMARY KEY NOT NULL,
  "client_request_id" uuid NOT NULL UNIQUE,
  "name" varchar(100) NOT NULL,
  "phone" varchar(20) NOT NULL,
  "email" varchar(254),
  "company" varchar(200),
  "message" text,
  "page_url" text NOT NULL,
  "source" varchar(100) NOT NULL,
  "referrer" text,
  "utm_source" varchar(200),
  "utm_medium" varchar(200),
  "utm_campaign" varchar(200),
  "utm_content" varchar(200),
  "utm_term" varchar(200),
  "consent_version" varchar(50) DEFAULT '2026-09-10' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_outbox" (
  "id" uuid PRIMARY KEY NOT NULL,
  "lead_id" uuid NOT NULL REFERENCES "leads"("id") ON DELETE RESTRICT,
  "type" varchar(50) DEFAULT 'telegram.lead.created' NOT NULL,
  "status" "outbox_status" DEFAULT 'pending' NOT NULL,
  "attempts" integer DEFAULT 0 NOT NULL CHECK (attempts >= 0),
  "next_attempt_at" timestamp with time zone DEFAULT now() NOT NULL,
  "locked_at" timestamp with time zone,
  "locked_by" varchar(150),
  "last_error" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "sent_at" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX "outbox_lead_type_unique" ON "notification_outbox" ("lead_id", "type");
--> statement-breakpoint
CREATE INDEX "outbox_pending_due_idx" ON "notification_outbox" ("next_attempt_at") WHERE status = 'pending';
--> statement-breakpoint
CREATE INDEX "outbox_processing_lock_idx" ON "notification_outbox" ("locked_at") WHERE status = 'processing';
