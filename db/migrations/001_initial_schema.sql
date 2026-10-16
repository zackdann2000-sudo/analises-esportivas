-- Initial PostgreSQL schema for Neon.
-- Apply only after reviewing a backup and before switching the application adapter.
-- Passwords must be stored as one-way hashes; API keys are server-side secrets.

CREATE TABLE IF NOT EXISTS app_users (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'user')),
  plan text NOT NULL,
  access_until timestamptz,
  blocked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz
);

CREATE TABLE IF NOT EXISTS app_sessions (
  token_hash text PRIMARY KEY,
  user_id text NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS app_sessions_user_id_idx ON app_sessions(user_id);
CREATE INDEX IF NOT EXISTS app_sessions_expires_at_idx ON app_sessions(expires_at);

CREATE TABLE IF NOT EXISTS app_settings (
  setting_key text PRIMARY KEY,
  setting_value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Provider API credentials must only be read/written by server-side code.
-- Do not expose setting_value contents to public endpoints.
