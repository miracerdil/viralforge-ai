'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Users, Settings, Crown, Clock, Link as LinkIcon, Trash2 } from 'lucide-react';
import { WorkspaceProvider, useWorkspace } from '@/contexts/WorkspaceContext';
import { TeamManagement } from '@/components/workspace/TeamManagement';
import { InviteModal } from '@/components/workspace/InviteModal';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function TeamPageContent() {
  const params = useParams();
  const locale = params.locale as string;
  const { currentWorkspace, isOwner, isAdmin, loading } = useWorkspace();

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(false);

  const t = {
    title: locale === 'tr' ? 'Takım Yönetimi' : 'Team Management',
    subtitle: locale === 'tr' ? 'Takım üyelerini yönetin' : 'Manage your team members',
    pendingInvites: locale === 'tr' ? 'Bekleyen Davetler' : 'Pending Invites',
    noPendingInvites: locale === 'tr' ? 'Bekleyen davet yok' : 'No pending invites',
    expires: locale === 'tr' ? 'Süresi:' : 'Expires:',
    copyLink: locale === 'tr' ? 'Link Kopyala' : 'Copy Link',
    cancel: locale === 'tr' ? 'İptal Et' : 'Cancel',
    noWorkspace: {
      title: locale === 'tr' ? 'Çalışma Alanı Yok' : 'No Workspace',
      description: locale === 'tr'
        ? 'Takım özelliklerini kullanmak için bir çalışma alanı oluşturun.'
        : 'Create a workspace to use team features.',
      create: locale === 'tr' ? 'Çalışma Alanı Oluştur' : 'Create Workspace',
    },
    workspaceInfo: {
      plan: locale === 'tr' ? 'Plan' : 'Plan',
      members: locale === 'tr' ? 'Üye Limiti' : 'Member Limit',
      hooks: locale === 'tr' ? 'Hook Limiti' : 'Hooks Limit',
    },
  };

  useEffect(() => {
    if (currentWorkspace && isAdmin) {
      fetchPendingInvites();
    }
  }, [currentWorkspace, isAdmin]);

  const fetchPendingInvites = async () => {
    if (!currentWorkspace) return;
    setLoadingInvites(true);

    try {
      const response = await fetch(`/api/workspaces/${currentWorkspace.id}/invites`);
      if (response.ok) {
        const data = await response.json();
        setPendingInvites(data.invites || []);
      }
    } catch (error) {
      console.error('Error fetching invites:', error);
    } finally {
      setLoadingInvites(false);
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    if (!currentWorkspace) return;

    try {
      const response = await fetch(
        `/api/workspaces/${currentWorkspace.id}/invites?inviteId=${inviteId}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        setPendingInvites((prev) => prev.filter((i) => i.id !== inviteId));
      }
    } catch (error) {
      console.error('Error canceling invite:', error);
    }
  };

  const handleCopyInviteLink = async (token: string) => {
    const link = `${window.location.origin}/invite/${token}`;
    await navigator.clipboard.writeText(link);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Users className="w-10 h-10 text-gray-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{t.noWorkspace.title}</h2>
        <p className="text-gray-600 mb-6">{t.noWorkspace.description}</p>
        <Button variant="primary">{t.noWorkspace.create}</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center">
            <Users className="w-7 h-7 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
            <p className="text-gray-500">{t.subtitle}</p>
          </div>
        </div>

        {isOwner && (
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            {locale === 'tr' ? 'Ayarlar' : 'Settings'}
          </Button>
        )}
      </div>

      {/* Workspace Info */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm text-gray-500 mb-1">{t.workspaceInfo.plan}</div>
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-500" />
            <span className="font-semibold text-gray-900 capitalize">{currentWorkspace.planType}</span>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm text-gray-500 mb-1">{t.workspaceInfo.members}</div>
          <div className="font-semibold text-gray-900">{currentWorkspace.maxMembers}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm text-gray-500 mb-1">{t.workspaceInfo.hooks}</div>
          <div className="font-semibold text-gray-900">{currentWorkspace.hooksLimit.toLocaleString()}</div>
        </div>
      </div>

      {/* Team Members */}
      <TeamManagement locale={locale} onInvite={() => setShowInviteModal(true)} />

      {/* Pending Invites */}
      {isAdmin && (
        <div className="mt-8 bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">{t.pendingInvites}</h3>
          </div>

          {loadingInvites ? (
            <div className="p-8 text-center">
              <Spinner />
            </div>
          ) : pendingInvites.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {t.noPendingInvites}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {pendingInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between px-6 py-4"
                >
                  <div>
                    <div className="font-medium text-gray-900">{invite.email}</div>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="capitalize">{invite.role}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {t.expires} {new Date(invite.expiresAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyInviteLink(invite.token)}
                    >
                      <LinkIcon className="w-4 h-4 mr-1" />
                      {t.copyLink}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancelInvite(invite.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Invite Modal */}
      <InviteModal
        locale={locale}
        isOpen={showInviteModal}
        onClose={() => {
          setShowInviteModal(false);
          fetchPendingInvites();
        }}
      />
    </div>
  );
}

export default function TeamPage() {
  return (
    <WorkspaceProvider>
      <TeamPageContent />
    </WorkspaceProvider>
  );
}
