CREATE TABLE IF NOT EXISTS applications (
  id VARCHAR(255) PRIMARY KEY,
  job_id VARCHAR(255) NOT NULL,
  job_title VARCHAR(255) NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  current_title VARCHAR(255),
  country VARCHAR(255),
  website VARCHAR(255),
  source VARCHAR(255),
  message TEXT,
  resume_name VARCHAR(255),
  resume_link VARCHAR(255),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  stage VARCHAR(50) NOT NULL,
  stage_history JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- Re-running this file is safe: adds the column if it's missing on a table
-- created before stage/notes syncing existed.
ALTER TABLE applications ADD COLUMN IF NOT EXISTS stage_history JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS notes (
  id VARCHAR(255) PRIMARY KEY,
  application_id VARCHAR(255) NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job descriptions added via the CRM. Publicly readable (the careers site
-- lists these to every visitor); only writable by an authenticated admin.
CREATE TABLE IF NOT EXISTS custom_jobs (
  id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  department VARCHAR(255),
  city VARCHAR(255),
  state VARCHAR(255),
  country VARCHAR(255),
  job_type VARCHAR(255),
  experience VARCHAR(255),
  date_opened VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Per-job edits layered on top of the read-only seeded catalogue, keyed by
-- the seeded job's id. `patch` holds only the changed fields (camelCase,
-- matching the frontend Job type).
CREATE TABLE IF NOT EXISTS job_overrides (
  job_id VARCHAR(255) PRIMARY KEY,
  patch JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Seeded job ids the admin has deleted (hidden from the public portal).
CREATE TABLE IF NOT EXISTS hidden_jobs (
  job_id VARCHAR(255) PRIMARY KEY
);

-- Read-only mirror of who has admin/CRM access, synced from Clerk (the
-- actual auth system) by the admin-users Netlify Function every time the
-- Settings > Admin Users tab loads or an admin is invited/removed. Holds no
-- passwords — just account metadata, so it's visible in the Supabase table
-- editor. Only ever written with the service_role key from that one
-- server-side function; the app never exposes it through a public endpoint.
CREATE TABLE IF NOT EXISTS admin_users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
