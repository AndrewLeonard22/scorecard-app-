-- Stores permanent invite tokens that don't expire.
-- When clicked, the server generates a fresh Supabase recovery link on demand.
CREATE TABLE invite_tokens (
  token uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Only the service role touches this table (server-side only)
ALTER TABLE invite_tokens ENABLE ROW LEVEL SECURITY;
