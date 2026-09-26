-- Apply the new policy version only to future leads; accepted consent stays historical.
ALTER TABLE "leads" ALTER COLUMN "consent_version" SET DEFAULT '2026-09-24';
