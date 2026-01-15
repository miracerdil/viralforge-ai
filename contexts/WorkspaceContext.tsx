'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { WorkspaceRole, hasPermission, Permission } from '@/lib/workspace/permissions';

interface Workspace {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  planType: string;
  maxMembers: number;
  hooksLimit: number;
  isActive: boolean;
  createdAt: string;
}

interface WorkspaceMember {
  id: string;
  userId: string;
  role: WorkspaceRole;
  isActive: boolean;
  joinedAt: string;
  user: {
    email: string;
    fullName: string | null;
    avatarUrl: string | null;
  };
}

interface WorkspaceContextValue {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  currentRole: WorkspaceRole | null;
  members: WorkspaceMember[];
  loading: boolean;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  fetchWorkspaces: () => Promise<void>;
  fetchMembers: () => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
  isOwner: boolean;
  isAdmin: boolean;
  canEdit: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspaceState] = useState<Workspace | null>(null);
  const [currentRole, setCurrentRole] = useState<WorkspaceRole | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, [supabase.auth]);

  // Fetch workspaces
  const fetchWorkspaces = useCallback(async () => {
    if (!userId) return;

    try {
      const { data: memberData } = await supabase
        .from('workspace_members')
        .select(`
          role,
          workspace:workspace_id(
            id,
            name,
            slug,
            logo_url,
            plan_type,
            max_members,
            hooks_limit,
            is_active,
            created_at
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true);

      if (memberData) {
        const ws = memberData.map((m: any) => ({
          id: m.workspace.id,
          name: m.workspace.name,
          slug: m.workspace.slug,
          logoUrl: m.workspace.logo_url,
          planType: m.workspace.plan_type,
          maxMembers: m.workspace.max_members,
          hooksLimit: m.workspace.hooks_limit,
          isActive: m.workspace.is_active,
          createdAt: m.workspace.created_at,
        }));
        setWorkspaces(ws);

        // Set first workspace as current if none selected
        if (!currentWorkspace && ws.length > 0) {
          setCurrentWorkspaceState(ws[0]);
          setCurrentRole(memberData[0].role as WorkspaceRole);
        }
      }
    } catch (error) {
      console.error('Error fetching workspaces:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, supabase, currentWorkspace]);

  // Fetch members of current workspace
  const fetchMembers = useCallback(async () => {
    if (!currentWorkspace) {
      setMembers([]);
      return;
    }

    try {
      const { data: memberData } = await supabase
        .from('workspace_members')
        .select(`
          id,
          user_id,
          role,
          is_active,
          joined_at,
          user:user_id(email, full_name, avatar_url)
        `)
        .eq('workspace_id', currentWorkspace.id)
        .eq('is_active', true);

      if (memberData) {
        const m = memberData.map((md: any) => ({
          id: md.id,
          userId: md.user_id,
          role: md.role as WorkspaceRole,
          isActive: md.is_active,
          joinedAt: md.joined_at,
          user: {
            email: md.user?.email || '',
            fullName: md.user?.full_name || null,
            avatarUrl: md.user?.avatar_url || null,
          },
        }));
        setMembers(m);

        // Update current user's role
        const myMembership = m.find((member) => member.userId === userId);
        if (myMembership) {
          setCurrentRole(myMembership.role);
        }
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  }, [currentWorkspace, userId, supabase]);

  // Set current workspace and fetch members
  const setCurrentWorkspace = useCallback((workspace: Workspace | null) => {
    setCurrentWorkspaceState(workspace);
    if (workspace) {
      // Update user's current workspace in profile
      supabase
        .from('profiles')
        .update({ current_workspace_id: workspace.id })
        .eq('id', userId)
        .then();
    }
  }, [supabase, userId]);

  // Check permission
  const checkPermission = useCallback((permission: Permission): boolean => {
    if (!currentRole) return false;
    return hasPermission(currentRole, permission);
  }, [currentRole]);

  // Initial fetch
  useEffect(() => {
    if (userId) {
      fetchWorkspaces();
    }
  }, [userId, fetchWorkspaces]);

  // Fetch members when workspace changes
  useEffect(() => {
    if (currentWorkspace) {
      fetchMembers();
    }
  }, [currentWorkspace, fetchMembers]);

  const value: WorkspaceContextValue = {
    workspaces,
    currentWorkspace,
    currentRole,
    members,
    loading,
    setCurrentWorkspace,
    fetchWorkspaces,
    fetchMembers,
    hasPermission: checkPermission,
    isOwner: currentRole === 'owner',
    isAdmin: currentRole === 'owner' || currentRole === 'admin',
    canEdit: checkPermission('content:edit'),
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
