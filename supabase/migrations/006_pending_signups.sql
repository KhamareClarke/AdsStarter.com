-- Email verification codes for signup (server-only via service role)
CREATE TABLE IF NOT EXISTS public.pending_signups (
  email TEXT PRIMARY KEY,
  code_hash TEXT NOT NULL,
  password_encrypted TEXT NOT NULL,
  full_name TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.pending_signups ENABLE ROW LEVEL SECURITY;
