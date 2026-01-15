'use client';

import { useState } from 'react';
import { X, Send, Loader2, Copy, Check, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { getInvitableRoles, getRoleLabel, getRoleDescription, WorkspaceRole } from '@/lib/workspace/permissions';
import { cn } from '@/lib/utils';

interface InviteModalProps {
  locale: string;
  isOpen: boolean;
  onClose: () => void;
}

export function InviteModal({ locale, isOpen, onClose }: InviteModalProps) {
  const { currentWorkspace } = useWorkspace();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<WorkspaceRole>('viewer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const t = {
    title: locale === 'tr' ? 'Takım Üyesi Davet Et' : 'Invite Team Member',
    email: locale === 'tr' ? 'E-posta Adresi' : 'Email Address',
    emailPlaceholder: locale === 'tr' ? 'ornek@email.com' : 'example@email.com',
    role: locale === 'tr' ? 'Rol' : 'Role',
    send: locale === 'tr' ? 'Davet Gönder' : 'Send Invite',
    sending: locale === 'tr' ? 'Gönderiliyor...' : 'Sending...',
    success: locale === 'tr' ? 'Davet gönderildi!' : 'Invite sent!',
    copyLink: locale === 'tr' ? 'Linki Kopyala' : 'Copy Link',
    copied: locale === 'tr' ? 'Kopyalandı!' : 'Copied!',
    cancel: locale === 'tr' ? 'İptal' : 'Cancel',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace || !email) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/workspaces/${currentWorkspace.id}/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to send invite');
        return;
      }

      // Generate invite link
      const link = `${window.location.origin}/invite/${data.token}`;
      setInviteLink(link);
      setEmail('');
    } catch (err) {
      setError('Failed to send invite');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setEmail('');
    setRole('viewer');
    setError(null);
    setInviteLink(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{t.title}</h2>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {inviteLink ? (
          /* Success State */
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t.success}</h3>
            <p className="text-sm text-gray-600 mb-4">
              {locale === 'tr'
                ? 'Davet linki oluşturuldu. Linki kopyalayıp paylaşabilirsiniz.'
                : 'Invite link created. Copy and share the link.'}
            </p>

            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg mb-4">
              <input
                type="text"
                value={inviteLink}
                readOnly
                className="flex-1 bg-transparent text-sm text-gray-600 outline-none truncate"
              />
              <Button
                variant={copied ? 'ghost' : 'outline'}
                size="sm"
                onClick={handleCopy}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-500 mr-1" />
                    {t.copied}
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1" />
                    {t.copyLink}
                  </>
                )}
              </Button>
            </div>

            <Button variant="primary" className="w-full" onClick={() => setInviteLink(null)}>
              {locale === 'tr' ? 'Başka Birini Davet Et' : 'Invite Someone Else'}
            </Button>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.email}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.emailPlaceholder}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.role}</label>
              <div className="space-y-2">
                {getInvitableRoles().map((r) => (
                  <label
                    key={r}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors',
                      role === r
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={r}
                      checked={role === r}
                      onChange={(e) => setRole(e.target.value as WorkspaceRole)}
                      className="mt-0.5"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{getRoleLabel(r, locale)}</div>
                      <div className="text-sm text-gray-500">{getRoleDescription(r, locale)}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
                {t.cancel}
              </Button>
              <Button type="submit" variant="primary" className="flex-1" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    {t.sending}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    {t.send}
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
