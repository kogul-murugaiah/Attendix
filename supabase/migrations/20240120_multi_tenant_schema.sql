-- Truncate existing tables to start fresh (as requested)
TRUNCATE TABLE scan_logs CASCADE;
TRUNCATE TABLE participants CASCADE;
TRUNCATE TABLE events CASCADE;
TRUNCATE TABLE staff CASCADE;

-- Enable UUID extension (just in case)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ORGANIZATIONS (Tenant/Client Level)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_code TEXT UNIQUE NOT NULL, -- 'college-a-tech-2024'
  org_name TEXT NOT NULL, -- 'College A - Tech Symposium 2024'
  org_type TEXT CHECK (org_type IN ('college', 'corporate', 'conference', 'club')),
  institution_name TEXT,
  department TEXT,
  
  -- Contact & Branding
  contact_person TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  logo_url TEXT,
  custom_domain TEXT, -- 'events.collegea.edu'
  branding_colors JSONB, -- {"primary": "#667eea", "secondary": "#764ba2"}
  
  -- Subscription Management
  subscription_plan TEXT DEFAULT 'free', -- 'free', 'basic', 'pro', 'enterprise'
  subscription_status TEXT DEFAULT 'trial', -- 'trial', 'active', 'suspended', 'cancelled'
  max_events INTEGER DEFAULT 3,
  max_participants_per_event INTEGER DEFAULT 100,
  max_staff INTEGER DEFAULT 5,
  features JSONB DEFAULT '{"custom_branding": false, "email_notifications": true, "analytics": false}'::jsonb,
  
  -- Billing
  billing_email TEXT,
  -- Manual subscription fields
  assigned_by UUID, -- Reference to super_admins(id) handled later
  plan_assigned_at TIMESTAMPTZ,
  subscription_notes TEXT,
  
  trial_ends_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '14 days',
  subscription_start_date TIMESTAMPTZ,
  subscription_end_date TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ORGANIZATION ADMINS
CREATE TABLE IF NOT EXISTS organization_admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'org_admin', -- 'org_owner', 'org_admin'
  permissions JSONB DEFAULT '{"manage_events": true, "manage_staff": true, "view_analytics": true}'::jsonb,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, email)
);

-- 3. SUBSCRIPTION PLANS (Platform Level)
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_code TEXT UNIQUE NOT NULL, -- 'free', 'basic', 'pro', 'enterprise'
  plan_name TEXT NOT NULL, -- 'Free Plan'
  description TEXT,
  
  -- Pricing
  price_monthly DECIMAL(10,2) DEFAULT 0,
  price_yearly DECIMAL(10,2) DEFAULT 0,
  
  -- Limits
  max_events INTEGER,
  max_participants_per_event INTEGER,
  max_staff INTEGER,
  storage_gb INTEGER,
  
  -- Features
  features JSONB, 
  
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SUPER ADMINS (Platform Management)
CREATE TABLE IF NOT EXISTS super_admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'super_admin', -- 'super_admin', 'platform_support'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Subscription Plans
INSERT INTO subscription_plans (plan_code, plan_name, description, price_monthly, price_yearly, max_events, max_participants_per_event, max_staff, storage_gb, features, is_active, display_order)
VALUES
(
  'free',
  'Free Plan',
  'Perfect for testing and small events',
  0, 0, 3, 100, 5, 1,
  '{"custom_branding": false, "email_support": false, "analytics": false, "whatsapp_notifications": false, "api_access": false, "export_data": true}'::jsonb,
  true, 1
),
(
  'basic',
  'Basic Plan',
  'Great for college events and small conferences',
  499, 4999, 10, 500, 10, 5,
  '{"custom_branding": true, "email_support": true, "analytics": true, "whatsapp_notifications": false, "api_access": false, "export_data": true, "bulk_email": true}'::jsonb,
  true, 2
),
(
  'pro',
  'Professional Plan',
  'For large events and symposiums',
  1499, 14999, 50, 2000, 30, 20,
  '{"custom_branding": true, "email_support": true, "analytics": true, "whatsapp_notifications": true, "api_access": true, "export_data": true, "bulk_email": true, "priority_support": true, "custom_reports": true}'::jsonb,
  true, 3
),
(
  'enterprise',
  'Enterprise Plan',
  'Unlimited everything with dedicated support',
  NULL, NULL, 9999, 10000, 100, 100,
  '{"custom_branding": true, "email_support": true, "analytics": true, "whatsapp_notifications": true, "api_access": true, "export_data": true, "bulk_email": true, "priority_support": true, "custom_reports": true, "dedicated_account_manager": true, "custom_integrations": true, "white_label": true, "sla_guarantee": true}'::jsonb,
  true, 4
)
ON CONFLICT (plan_code) DO NOTHING;

-- ALTER EXISTING TABLES to include organization_id
ALTER TABLE events ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE scan_logs ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Add updated constraints/columns to Scan Logs & Participants for robustness
ALTER TABLE scan_logs ADD COLUMN IF NOT EXISTS device_info JSONB;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS qr_code_url TEXT;

-- ADD INDEXES
CREATE INDEX IF NOT EXISTS idx_org_code ON organizations(org_code);
CREATE INDEX IF NOT EXISTS idx_org_status ON organizations(subscription_status);
CREATE INDEX IF NOT EXISTS idx_event_org ON events(organization_id);
CREATE INDEX IF NOT EXISTS idx_participant_org ON participants(organization_id);
CREATE INDEX IF NOT EXISTS idx_staff_org ON staff(organization_id);
CREATE INDEX IF NOT EXISTS idx_scanlog_org ON scan_logs(organization_id);

-- RLS POLICIES (Re-applying comprehensive RLS)

-- Enable RLS on new tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY; -- Generally public read
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;

-- 1. ORGANIZATIONS POLICIES
CREATE POLICY "super_admins_view_all_orgs" ON organizations
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM super_admins WHERE super_admins.user_id = auth.uid())
  );

CREATE POLICY "org_admins_view_own_org" ON organizations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_admins 
      WHERE organization_admins.organization_id = organizations.id 
      AND organization_admins.user_id = auth.uid()
    )
  );

CREATE POLICY "public_view_org_by_code" ON organizations
  FOR SELECT TO anon
  USING (true); -- Need to allow anon to fetch org details by code for registration page

-- 2. SUBSCRIPTION PLANS POLICIES
CREATE POLICY "everyone_can_view_plans" ON subscription_plans
  FOR SELECT USING (true);

-- 3. EVENTS POLICIES (Update existing)
DROP POLICY IF EXISTS "Public can view events" ON events;
CREATE POLICY "Public can view events" ON events
  FOR SELECT TO anon USING (true); -- Public events visible? Or should be scoped? Keeping open for now.

DROP POLICY IF EXISTS "Admin can manage events" ON events;
CREATE POLICY "Org admins can manage events" ON events
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_admins 
      WHERE organization_admins.organization_id = events.organization_id 
      AND organization_admins.user_id = auth.uid()
    )
  );
  
CREATE POLICY "Staff can view org events" ON events
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff 
      WHERE staff.organization_id = events.organization_id 
      AND staff.user_id = auth.uid()
    )
  );

-- 4. PARTICIPANTS POLICIES
DROP POLICY IF EXISTS "Public can register" ON participants;
CREATE POLICY "Public can register" ON participants
  FOR INSERT TO anon WITH CHECK (true); -- Handled by backend logic/verification ideally

DROP POLICY IF EXISTS "Staff can view participants" ON participants;
CREATE POLICY "Staff view participants" ON participants
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff 
      WHERE staff.organization_id = participants.organization_id 
      AND staff.user_id = auth.uid()
    ) OR
    EXISTS (
        SELECT 1 FROM organization_admins 
        WHERE organization_admins.organization_id = participants.organization_id 
        AND organization_admins.user_id = auth.uid()
    )
  );

-- 5. STAFF POLICIES
DROP POLICY IF EXISTS "Users can view own staff record" ON staff;
CREATE POLICY "View own staff record" ON staff
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admin can manage staff" ON staff;
CREATE POLICY "Org admins manage staff" ON staff
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_admins 
      WHERE organization_admins.organization_id = staff.organization_id 
      AND organization_admins.user_id = auth.uid()
    )
  );

-- 6. SCAN LOGS POLICIES
DROP POLICY IF EXISTS "Staff can create scan logs" ON scan_logs;
CREATE POLICY "Staff create scan logs" ON scan_logs
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff 
      WHERE staff.organization_id = scan_logs.organization_id 
      AND staff.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Staff can view scan logs" ON scan_logs;
CREATE POLICY "Staff view scan logs" ON scan_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff 
      WHERE staff.organization_id = scan_logs.organization_id 
      AND staff.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM organization_admins 
      WHERE organization_admins.organization_id = scan_logs.organization_id 
      AND organization_admins.user_id = auth.uid()
    )
  );

-- Functions update?
-- Existing functions should still work but might need org context. 
-- Ideally we update generate_participant_code to be per-org
DROP FUNCTION IF EXISTS generate_participant_code;
CREATE OR REPLACE FUNCTION generate_participant_code(org_id UUID)
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  counter INTEGER;
  prefix TEXT;
BEGIN
  -- Simple counter for now, scoped to org
  SELECT COUNT(*) + 1 INTO counter FROM participants WHERE organization_id = org_id;
  -- Could fetch prefix from org config
  new_code := 'P-' || LPAD(counter::TEXT, 5, '0');
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

