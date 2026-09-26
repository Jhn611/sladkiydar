-- Apply the revised policy only to future leads; retain previously accepted consent.
ALTER TABLE "leads" ALTER COLUMN "consent_version" SET DEFAULT '2026-09-26';
