/**
 * Workspace Permission System
 * Role-based access control for workspace features
 */

export type WorkspaceRole = 'owner' | 'admin' | 'editor' | 'viewer' | 'client';

export type Permission =
  | 'workspace:manage'
  | 'workspace:delete'
  | 'members:manage'
  | 'members:invite'
  | 'members:remove'
  | 'billing:manage'
  | 'content:create'
  | 'content:edit'
  | 'content:delete'
  | 'content:view'
  | 'white_label:manage';

/**
 * Default permissions by role
 */
const DEFAULT_PERMISSIONS: Record<WorkspaceRole, Permission[]> = {
  owner: [
    'workspace:manage',
    'workspace:delete',
    'members:manage',
    'members:invite',
    'members:remove',
    'billing:manage',
    'content:create',
    'content:edit',
    'content:delete',
    'content:view',
    'white_label:manage',
  ],
  admin: [
    'members:manage',
    'members:invite',
    'members:remove',
    'content:create',
    'content:edit',
    'content:delete',
    'content:view',
  ],
  editor: ['content:create', 'content:edit', 'content:view'],
  viewer: ['content:view'],
  client: ['content:view'],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: WorkspaceRole, permission: Permission): boolean {
  if (role === 'owner') return true; // Owner has all permissions
  return DEFAULT_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: WorkspaceRole): Permission[] {
  return DEFAULT_PERMISSIONS[role] || [];
}

/**
 * Check if a role can manage another role
 */
export function canManageRole(managerRole: WorkspaceRole, targetRole: WorkspaceRole): boolean {
  const roleHierarchy: Record<WorkspaceRole, number> = {
    owner: 4,
    admin: 3,
    editor: 2,
    viewer: 1,
    client: 0,
  };

  // Owner can manage everyone
  if (managerRole === 'owner') return true;

  // Admin can manage everyone except owner and other admins
  if (managerRole === 'admin') {
    return targetRole !== 'owner' && targetRole !== 'admin';
  }

  // Others cannot manage anyone
  return false;
}

/**
 * Get role display name
 */
export function getRoleLabel(role: WorkspaceRole, locale: string): string {
  const labels: Record<WorkspaceRole, { tr: string; en: string }> = {
    owner: { tr: 'Sahip', en: 'Owner' },
    admin: { tr: 'Yönetici', en: 'Admin' },
    editor: { tr: 'Editör', en: 'Editor' },
    viewer: { tr: 'İzleyici', en: 'Viewer' },
    client: { tr: 'Müşteri', en: 'Client' },
  };

  return labels[role]?.[locale as 'tr' | 'en'] || role;
}

/**
 * Get role description
 */
export function getRoleDescription(role: WorkspaceRole, locale: string): string {
  const descriptions: Record<WorkspaceRole, { tr: string; en: string }> = {
    owner: {
      tr: 'Tüm yetkiler, fatura yönetimi',
      en: 'All permissions, billing management',
    },
    admin: {
      tr: 'Üye yönetimi, tüm içerik yetkileri',
      en: 'Member management, all content permissions',
    },
    editor: {
      tr: 'İçerik oluşturma ve düzenleme',
      en: 'Create and edit content',
    },
    viewer: {
      tr: 'Sadece görüntüleme',
      en: 'View only',
    },
    client: {
      tr: 'White-label portal erişimi',
      en: 'White-label portal access',
    },
  };

  return descriptions[role]?.[locale as 'tr' | 'en'] || '';
}

/**
 * Get available roles for invitation (excludes owner)
 */
export function getInvitableRoles(): WorkspaceRole[] {
  return ['admin', 'editor', 'viewer', 'client'];
}
