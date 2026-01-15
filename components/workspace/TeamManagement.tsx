'use client';

import { useState } from 'react';
import { Users, UserPlus, MoreVertical, Trash2, Shield, Edit, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { getRoleLabel, getInvitableRoles, WorkspaceRole } from '@/lib/workspace/permissions';
import { cn } from '@/lib/utils';

interface TeamManagementProps {
  locale: string;
  onInvite: () => void;
}

export function TeamManagement({ locale, onInvite }: TeamManagementProps) {
  const { currentWorkspace, members, isAdmin, fetchMembers } = useWorkspace();
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const t = {
    title: locale === 'tr' ? 'Takım Üyeleri' : 'Team Members',
    invite: locale === 'tr' ? 'Davet Et' : 'Invite',
    changeRole: locale === 'tr' ? 'Rol Değiştir' : 'Change Role',
    remove: locale === 'tr' ? 'Kaldır' : 'Remove',
    confirmRemove: locale === 'tr'
      ? 'Bu üyeyi kaldırmak istediğinize emin misiniz?'
      : 'Are you sure you want to remove this member?',
    you: locale === 'tr' ? '(sen)' : '(you)',
  };

  const getRoleIcon = (role: WorkspaceRole) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4 text-amber-500" />;
      case 'admin':
        return <Shield className="w-4 h-4 text-purple-500" />;
      default:
        return null;
    }
  };

  const handleRoleChange = async (memberId: string, newRole: WorkspaceRole) => {
    if (!currentWorkspace) return;
    setLoading(true);

    try {
      const response = await fetch(`/api/workspaces/${currentWorkspace.id}/members`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, role: newRole }),
      });

      if (response.ok) {
        await fetchMembers();
      }
    } catch (error) {
      console.error('Error changing role:', error);
    } finally {
      setLoading(false);
      setEditingRole(null);
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!currentWorkspace || !confirm(t.confirmRemove)) return;
    setLoading(true);

    try {
      const response = await fetch(
        `/api/workspaces/${currentWorkspace.id}/members?memberId=${memberId}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        await fetchMembers();
      }
    } catch (error) {
      console.error('Error removing member:', error);
    } finally {
      setLoading(false);
      setMenuOpen(null);
    }
  };

  if (!currentWorkspace) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">
            {t.title} ({members.length}/{currentWorkspace.maxMembers})
          </h3>
        </div>
        {isAdmin && (
          <Button variant="primary" size="sm" onClick={onInvite}>
            <UserPlus className="w-4 h-4 mr-2" />
            {t.invite}
          </Button>
        )}
      </div>

      {/* Members List */}
      <div className="divide-y divide-gray-100">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between px-6 py-4 hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                {member.user.avatarUrl ? (
                  <img
                    src={member.user.avatarUrl}
                    alt={member.user.fullName || member.user.email}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-medium text-gray-600">
                    {(member.user.fullName || member.user.email).charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              {/* Info */}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">
                    {member.user.fullName || member.user.email.split('@')[0]}
                  </span>
                  {member.role === 'owner' && (
                    <span className="text-xs text-gray-500">{t.you}</span>
                  )}
                </div>
                <span className="text-sm text-gray-500">{member.user.email}</span>
              </div>
            </div>

            {/* Role & Actions */}
            <div className="flex items-center gap-3">
              {editingRole === member.id ? (
                <select
                  value={member.role}
                  onChange={(e) => handleRoleChange(member.id, e.target.value as WorkspaceRole)}
                  disabled={loading}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  autoFocus
                  onBlur={() => setEditingRole(null)}
                >
                  {getInvitableRoles().map((role) => (
                    <option key={role} value={role}>
                      {getRoleLabel(role, locale)}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-full">
                  {getRoleIcon(member.role)}
                  <span className="text-sm font-medium text-gray-700">
                    {getRoleLabel(member.role, locale)}
                  </span>
                </div>
              )}

              {/* Actions Menu */}
              {isAdmin && member.role !== 'owner' && (
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(menuOpen === member.id ? null : member.id)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {menuOpen === member.id && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setMenuOpen(null)}
                      />
                      <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                        <button
                          onClick={() => {
                            setEditingRole(member.id);
                            setMenuOpen(null);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Edit className="w-4 h-4" />
                          {t.changeRole}
                        </button>
                        <button
                          onClick={() => handleRemove(member.id)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                          {t.remove}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
