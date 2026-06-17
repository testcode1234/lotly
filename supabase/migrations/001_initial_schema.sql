-- =============================================================
-- Lotly — initial schema (Session 1)
-- Communities, units, members, dues, violations, documents,
-- maintenance requests, plus users mirrored from Clerk.
--
-- Multi-tenancy: every domain table carries community_id. The app
-- uses the service role on the server (bypassing RLS) and scopes
-- every query to community_id in code. RLS here is a safety net:
-- service_role full access, anon denied.
-- =============================================================

-- ---------- Tables ----------

-- Users table (synced from Clerk)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Communities table
CREATE TABLE communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  unit_count INTEGER NOT NULL DEFAULT 0,
  stripe_account_id TEXT,        -- Stripe Connect account
  stripe_onboarding_complete BOOLEAN DEFAULT false,
  dues_day_of_month INTEGER DEFAULT 1,  -- 1-28
  late_fee_amount NUMERIC(10,2) DEFAULT 0,
  late_fee_grace_days INTEGER DEFAULT 5,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Units table
CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  unit_number TEXT NOT NULL,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(community_id, unit_number)
);

-- Members table (homeowners linked to units)
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  clerk_id TEXT,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'resident'
    CHECK (role IN ('board_admin', 'board_member', 'resident')),
  status TEXT NOT NULL DEFAULT 'invited'
    CHECK (status IN ('invited', 'active', 'inactive')),
  stripe_customer_id TEXT,
  dues_amount NUMERIC(10,2),     -- override community default if set
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Dues ledger
CREATE TABLE dues_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  period_year INTEGER NOT NULL,
  period_month INTEGER NOT NULL,  -- 1-12
  amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'late', 'waived', 'partial')),
  due_date DATE NOT NULL,
  paid_at TIMESTAMPTZ,
  stripe_payment_intent_id TEXT,
  late_fee_applied NUMERIC(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(community_id, member_id, period_year, period_month)
);

-- Violations
CREATE TABLE violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  reported_by UUID REFERENCES members(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'notified', 'remediation', 'resolved', 'closed')),
  photo_keys TEXT[] DEFAULT '{}',   -- R2 object keys
  notice_pdf_key TEXT,              -- R2 key for generated notice PDF
  notice_sent_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Documents
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES members(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL
    CHECK (category IN ('governing', 'financial', 'meeting', 'insurance', 'other')),
  r2_key TEXT NOT NULL,
  file_size_bytes INTEGER,
  mime_type TEXT,
  visibility TEXT NOT NULL DEFAULT 'all'
    CHECK (visibility IN ('board', 'all')),
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Maintenance requests
CREATE TABLE maintenance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  submitted_by UUID REFERENCES members(id) ON DELETE SET NULL,
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'urgent')),
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_progress', 'completed', 'closed')),
  photo_keys TEXT[] DEFAULT '{}',
  assigned_vendor TEXT,
  comments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- Indexes ----------
CREATE INDEX idx_units_community ON units(community_id);
CREATE INDEX idx_members_community ON members(community_id);
CREATE INDEX idx_members_unit ON members(unit_id);
CREATE INDEX idx_members_clerk_id ON members(clerk_id);
CREATE INDEX idx_dues_community ON dues_ledger(community_id);
CREATE INDEX idx_dues_member ON dues_ledger(member_id);
CREATE INDEX idx_dues_status ON dues_ledger(status);
CREATE INDEX idx_violations_community ON violations(community_id);
CREATE INDEX idx_violations_status ON violations(status);
CREATE INDEX idx_documents_community ON documents(community_id);

-- ---------- updated_at trigger ----------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_communities_updated_at
  BEFORE UPDATE ON communities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_units_updated_at
  BEFORE UPDATE ON units
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_members_updated_at
  BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_dues_ledger_updated_at
  BEFORE UPDATE ON dues_ledger
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_violations_updated_at
  BEFORE UPDATE ON violations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_maintenance_requests_updated_at
  BEFORE UPDATE ON maintenance_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ---------- Row Level Security ----------
-- RLS is enabled on every table. The server uses the service role, which
-- bypasses RLS. These policies are a safety net: only service_role gets
-- access; anon/authenticated are denied by default (no permissive policy).
-- `users` is included (beyond the 7 domain tables) so it is not left exposed
-- to the anon key.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE dues_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access" ON users
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_full_access" ON communities
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_full_access" ON units
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_full_access" ON members
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_full_access" ON dues_ledger
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_full_access" ON violations
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_full_access" ON documents
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_full_access" ON maintenance_requests
  FOR ALL TO service_role USING (true) WITH CHECK (true);
