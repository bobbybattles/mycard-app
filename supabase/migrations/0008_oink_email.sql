-- Add oink_email to profiles so users can specify the email tied to their
-- Oink Pro subscription, which may differ from their mycard.to signup email.
-- The subscription check (lib/subscription.ts) prefers oink_email if set,
-- falling back to the auth email.

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS oink_email TEXT;
