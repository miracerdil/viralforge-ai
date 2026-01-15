-- =============================================
-- SPEC 3: WORKSPACE / TEAM / WHITE-LABEL SYSTEM
-- =============================================

-- =============================================
-- WORKSPACE TABLES
-- =============================================

-- Workspaces (Teams)
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  plan_type TEXT DEFAULT 'team' CHECK (plan_type IN ('team', 'business', 'enterprise', 'white_label')),
  max_members INTEGER DEFAULT 5,
  hooks_limit INTEGER DEFAULT 500,
  storage_limit_mb INTEGER DEFAULT 1000,
  is_active BOOLEAN DEFAULT true,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  settings JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Workspace members
CREATE TABLE IF NOT EXISTS workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'admin', 'editor', 'viewer', 'client')),
  permissions JSONB DEFAULT '{}', -- Custom permission overrides
  is_active BOOLEAN DEFAULT true,
  invited_by UUID REFERENCES profiles(id),
  joined_at TIMESTAMPTZ DEFAULT now(),
  last_active_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

-- Workspace invites
CREATE TABLE IF NOT EXISTS workspace_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer', 'client')),
  invite_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by UUID NOT NULL REFERENCES profiles(id),
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES profiles(id),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
  resend_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Workspace activity log
CREATE TABLE IF NOT EXISTS workspace_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- WHITE-LABEL SETTINGS
-- =============================================

CREATE TABLE IF NOT EXISTS white_label_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL UNIQUE REFERENCES workspaces(id) ON DELETE CASCADE,
  custom_domain TEXT UNIQUE,
  domain_verified BOOLEAN DEFAULT false,
  domain_verification_token TEXT,
  custom_logo_url TEXT,
  custom_favicon_url TEXT,
  app_name TEXT DEFAULT 'ViralForge',
  support_email TEXT,
  support_url TEXT,
  theme_json JSONB DEFAULT '{
    "primaryColor": "#6366f1",
    "accentColor": "#8b5cf6",
    "backgroundColor": "#ffffff",
    "textColor": "#111827",
    "borderRadius": "0.5rem",
    "fontFamily": "Inter"
  }',
  hide_viralforge_branding BOOLEAN DEFAULT false,
  custom_css TEXT,
  email_from_name TEXT,
  email_from_address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- WORKSPACE CONTENT LINKING
-- =============================================

-- Link AB tests to workspaces (saved_hooks and content_planners may not exist yet)
ALTER TABLE ab_tests ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL;

-- Note: Add workspace_id to other content tables when they exist:
-- ALTER TABLE saved_hooks ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL;
-- ALTER TABLE content_planners ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL;

-- =============================================
-- PERMISSION SYSTEM
-- =============================================

-- Role permissions table (configurable by workspace)
CREATE TABLE IF NOT EXISTS workspace_role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  permission_key TEXT NOT NULL,
  allowed BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, role, permission_key)
);

-- Default permissions for roles
INSERT INTO workspace_role_permissions (workspace_id, role, permission_key, allowed) VALUES
  -- Owner permissions (all)
  (NULL, 'owner', 'workspace:manage', true),
  (NULL, 'owner', 'workspace:delete', true),
  (NULL, 'owner', 'members:manage', true),
  (NULL, 'owner', 'members:invite', true),
  (NULL, 'owner', 'members:remove', true),
  (NULL, 'owner', 'billing:manage', true),
  (NULL, 'owner', 'content:create', true),
  (NULL, 'owner', 'content:edit', true),
  (NULL, 'owner', 'content:delete', true),
  (NULL, 'owner', 'content:view', true),
  (NULL, 'owner', 'white_label:manage', true),

  -- Admin permissions
  (NULL, 'admin', 'members:manage', true),
  (NULL, 'admin', 'members:invite', true),
  (NULL, 'admin', 'members:remove', true),
  (NULL, 'admin', 'content:create', true),
  (NULL, 'admin', 'content:edit', true),
  (NULL, 'admin', 'content:delete', true),
  (NULL, 'admin', 'content:view', true),

  -- Editor permissions
  (NULL, 'editor', 'content:create', true),
  (NULL, 'editor', 'content:edit', true),
  (NULL, 'editor', 'content:view', true),

  -- Viewer permissions
  (NULL, 'viewer', 'content:view', true),

  -- Client permissions (white-label)
  (NULL, 'client', 'content:view', true)
ON CONFLICT DO NOTHING;

-- Check permission function
CREATE OR REPLACE FUNCTION check_workspace_permission(
  p_user_id UUID,
  p_workspace_id UUID,
  p_permission TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
  v_allowed BOOLEAN;
BEGIN
  -- Get user's role in workspace
  SELECT role INTO v_role
  FROM workspace_members
  WHERE workspace_id = p_workspace_id AND user_id = p_user_id AND is_active = true;

  IF v_role IS NULL THEN
    RETURN false;
  END IF;

  -- Owner has all permissions
  IF v_role = 'owner' THEN
    RETURN true;
  END IF;

  -- Check custom workspace permission first
  SELECT allowed INTO v_allowed
  FROM workspace_role_permissions
  WHERE workspace_id = p_workspace_id AND role = v_role AND permission_key = p_permission;

  IF v_allowed IS NOT NULL THEN
    RETURN v_allowed;
  END IF;

  -- Fall back to default permissions
  SELECT allowed INTO v_allowed
  FROM workspace_role_permissions
  WHERE workspace_id IS NULL AND role = v_role AND permission_key = p_permission;

  RETURN COALESCE(v_allowed, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- WORKSPACE FUNCTIONS
-- =============================================

-- Create workspace with owner
CREATE OR REPLACE FUNCTION create_workspace(
  p_owner_id UUID,
  p_name TEXT,
  p_slug TEXT,
  p_plan_type TEXT DEFAULT 'team'
)
RETURNS UUID AS $$
DECLARE
  v_workspace_id UUID;
  v_max_members INTEGER;
  v_hooks_limit INTEGER;
BEGIN
  -- Set limits based on plan
  CASE p_plan_type
    WHEN 'team' THEN
      v_max_members := 5;
      v_hooks_limit := 500;
    WHEN 'business' THEN
      v_max_members := 15;
      v_hooks_limit := 2000;
    WHEN 'enterprise' THEN
      v_max_members := 50;
      v_hooks_limit := 10000;
    WHEN 'white_label' THEN
      v_max_members := 100;
      v_hooks_limit := 50000;
    ELSE
      v_max_members := 5;
      v_hooks_limit := 500;
  END CASE;

  -- Create workspace
  INSERT INTO workspaces (owner_id, name, slug, plan_type, max_members, hooks_limit)
  VALUES (p_owner_id, p_name, p_slug, p_plan_type, v_max_members, v_hooks_limit)
  RETURNING id INTO v_workspace_id;

  -- Add owner as member
  INSERT INTO workspace_members (workspace_id, user_id, role, is_active)
  VALUES (v_workspace_id, p_owner_id, 'owner', true);

  -- Create white-label settings if applicable
  IF p_plan_type IN ('business', 'enterprise', 'white_label') THEN
    INSERT INTO white_label_settings (workspace_id)
    VALUES (v_workspace_id);
  END IF;

  -- Log activity
  INSERT INTO workspace_activity (workspace_id, user_id, action, metadata)
  VALUES (v_workspace_id, p_owner_id, 'workspace_created', jsonb_build_object('name', p_name, 'plan', p_plan_type));

  RETURN v_workspace_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Invite member to workspace
CREATE OR REPLACE FUNCTION invite_workspace_member(
  p_workspace_id UUID,
  p_inviter_id UUID,
  p_email TEXT,
  p_role TEXT DEFAULT 'viewer'
)
RETURNS JSONB AS $$
DECLARE
  v_invite_id UUID;
  v_token TEXT;
  v_workspace_name TEXT;
  v_current_count INTEGER;
  v_max_members INTEGER;
BEGIN
  -- Check permission
  IF NOT check_workspace_permission(p_inviter_id, p_workspace_id, 'members:invite') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Permission denied');
  END IF;

  -- Get workspace info
  SELECT name, max_members INTO v_workspace_name, v_max_members
  FROM workspaces WHERE id = p_workspace_id;

  -- Check member limit
  SELECT COUNT(*) INTO v_current_count
  FROM workspace_members WHERE workspace_id = p_workspace_id AND is_active = true;

  IF v_current_count >= v_max_members THEN
    RETURN jsonb_build_object('success', false, 'error', 'Member limit reached');
  END IF;

  -- Check if already member
  IF EXISTS (
    SELECT 1 FROM workspace_members wm
    JOIN profiles p ON wm.user_id = p.id
    WHERE wm.workspace_id = p_workspace_id AND p.email = p_email AND wm.is_active = true
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'User is already a member');
  END IF;

  -- Check for existing invite
  IF EXISTS (
    SELECT 1 FROM workspace_invites
    WHERE workspace_id = p_workspace_id AND email = p_email AND accepted_at IS NULL AND expires_at > now()
  ) THEN
    -- Update resend count
    UPDATE workspace_invites
    SET resend_count = resend_count + 1, updated_at = now()
    WHERE workspace_id = p_workspace_id AND email = p_email AND accepted_at IS NULL
    RETURNING id, invite_token INTO v_invite_id, v_token;

    RETURN jsonb_build_object('success', true, 'invite_id', v_invite_id, 'token', v_token, 'resent', true);
  END IF;

  -- Create new invite
  INSERT INTO workspace_invites (workspace_id, email, role, invited_by)
  VALUES (p_workspace_id, p_email, p_role, p_inviter_id)
  RETURNING id, invite_token INTO v_invite_id, v_token;

  -- Log activity
  INSERT INTO workspace_activity (workspace_id, user_id, action, metadata)
  VALUES (p_workspace_id, p_inviter_id, 'member_invited', jsonb_build_object('email', p_email, 'role', p_role));

  RETURN jsonb_build_object(
    'success', true,
    'invite_id', v_invite_id,
    'token', v_token,
    'workspace_name', v_workspace_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accept workspace invite
CREATE OR REPLACE FUNCTION accept_workspace_invite(
  p_token TEXT,
  p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_invite workspace_invites%ROWTYPE;
  v_member_id UUID;
BEGIN
  -- Find valid invite
  SELECT * INTO v_invite
  FROM workspace_invites
  WHERE invite_token = p_token AND accepted_at IS NULL AND expires_at > now();

  IF v_invite IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invite');
  END IF;

  -- Check if already member
  IF EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = v_invite.workspace_id AND user_id = p_user_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already a member');
  END IF;

  -- Add as member
  INSERT INTO workspace_members (workspace_id, user_id, role, invited_by)
  VALUES (v_invite.workspace_id, p_user_id, v_invite.role, v_invite.invited_by)
  RETURNING id INTO v_member_id;

  -- Mark invite as accepted
  UPDATE workspace_invites
  SET accepted_at = now(), accepted_by = p_user_id
  WHERE id = v_invite.id;

  -- Log activity
  INSERT INTO workspace_activity (workspace_id, user_id, action, metadata)
  VALUES (v_invite.workspace_id, p_user_id, 'member_joined', jsonb_build_object('role', v_invite.role));

  RETURN jsonb_build_object(
    'success', true,
    'member_id', v_member_id,
    'workspace_id', v_invite.workspace_id,
    'role', v_invite.role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove member from workspace
CREATE OR REPLACE FUNCTION remove_workspace_member(
  p_workspace_id UUID,
  p_remover_id UUID,
  p_member_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_member_role TEXT;
  v_remover_role TEXT;
BEGIN
  -- Get roles
  SELECT role INTO v_remover_role
  FROM workspace_members WHERE workspace_id = p_workspace_id AND user_id = p_remover_id;

  SELECT role INTO v_member_role
  FROM workspace_members WHERE workspace_id = p_workspace_id AND user_id = p_member_id;

  -- Cannot remove owner
  IF v_member_role = 'owner' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot remove workspace owner');
  END IF;

  -- Check permission
  IF NOT check_workspace_permission(p_remover_id, p_workspace_id, 'members:remove') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Permission denied');
  END IF;

  -- Admin cannot remove other admins unless they're the owner
  IF v_member_role = 'admin' AND v_remover_role != 'owner' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only owner can remove admins');
  END IF;

  -- Soft delete member
  UPDATE workspace_members
  SET is_active = false, updated_at = now()
  WHERE workspace_id = p_workspace_id AND user_id = p_member_id;

  -- Log activity
  INSERT INTO workspace_activity (workspace_id, user_id, action, resource_id, metadata)
  VALUES (p_workspace_id, p_remover_id, 'member_removed', p_member_id, jsonb_build_object('member_role', v_member_role));

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- RLS POLICIES
-- =============================================

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE white_label_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_role_permissions ENABLE ROW LEVEL SECURITY;

-- Workspaces: Members can view, owner can manage
DROP POLICY IF EXISTS "workspaces_member_read" ON workspaces;
CREATE POLICY "workspaces_member_read" ON workspaces FOR SELECT
  USING (
    owner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = id AND user_id = auth.uid() AND is_active = true)
  );

DROP POLICY IF EXISTS "workspaces_owner_update" ON workspaces;
CREATE POLICY "workspaces_owner_update" ON workspaces FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "workspaces_owner_delete" ON workspaces;
CREATE POLICY "workspaces_owner_delete" ON workspaces FOR DELETE
  USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "workspaces_insert" ON workspaces;
CREATE POLICY "workspaces_insert" ON workspaces FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- Note: Admin access handled via service role, not RLS

-- Workspace members: Members can view, manage via functions
DROP POLICY IF EXISTS "workspace_members_read" ON workspace_members;
CREATE POLICY "workspace_members_read" ON workspace_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_id AND wm.user_id = auth.uid() AND wm.is_active = true
    )
  );

-- Workspace invites: Inviter and invitee can view
DROP POLICY IF EXISTS "workspace_invites_read" ON workspace_invites;
CREATE POLICY "workspace_invites_read" ON workspace_invites FOR SELECT
  USING (
    invited_by = auth.uid()
    OR email = (SELECT email FROM profiles WHERE id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin')
        AND wm.is_active = true
    )
  );

-- Workspace activity: Members can view
DROP POLICY IF EXISTS "workspace_activity_member_read" ON workspace_activity;
CREATE POLICY "workspace_activity_member_read" ON workspace_activity FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = workspace_activity.workspace_id
        AND user_id = auth.uid()
        AND is_active = true
    )
  );

-- White-label settings: Owner/admin can manage
DROP POLICY IF EXISTS "white_label_owner_read" ON white_label_settings;
CREATE POLICY "white_label_owner_read" ON white_label_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = white_label_settings.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin')
        AND wm.is_active = true
    )
  );

DROP POLICY IF EXISTS "white_label_owner_update" ON white_label_settings;
CREATE POLICY "white_label_owner_update" ON white_label_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_id AND w.owner_id = auth.uid()
    )
  );

-- Role permissions: Public read for defaults, owner manages custom
DROP POLICY IF EXISTS "role_permissions_read" ON workspace_role_permissions;
CREATE POLICY "role_permissions_read" ON workspace_role_permissions FOR SELECT
  USING (
    workspace_id IS NULL
    OR EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = workspace_role_permissions.workspace_id
        AND user_id = auth.uid()
        AND is_active = true
    )
  );

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_workspaces_owner ON workspaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_slug ON workspaces(slug);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_invites_workspace ON workspace_invites(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_invites_email ON workspace_invites(email);
CREATE INDEX IF NOT EXISTS idx_workspace_invites_token ON workspace_invites(invite_token);
CREATE INDEX IF NOT EXISTS idx_workspace_activity_workspace ON workspace_activity(workspace_id);
CREATE INDEX IF NOT EXISTS idx_white_label_domain ON white_label_settings(custom_domain);
CREATE INDEX IF NOT EXISTS idx_ab_tests_workspace ON ab_tests(workspace_id) WHERE workspace_id IS NOT NULL;
-- Note: Add these indexes when the tables exist:
-- CREATE INDEX IF NOT EXISTS idx_saved_hooks_workspace ON saved_hooks(workspace_id) WHERE workspace_id IS NOT NULL;
-- CREATE INDEX IF NOT EXISTS idx_content_planners_workspace ON content_planners(workspace_id) WHERE workspace_id IS NOT NULL;

-- =============================================
-- ADD WORKSPACE COLUMN TO USER CONTEXT
-- =============================================

-- Add current_workspace_id to profiles for user context
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL;
