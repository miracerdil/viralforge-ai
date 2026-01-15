'use client';

import { useState } from 'react';
import {
  User,
  CreditCard,
  Shield,
  BarChart3,
  Calendar,
  RefreshCw,
  Ban,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ConfirmModal } from './confirm-modal';
import { formatDate } from '@/lib/utils/date';
import type { AdminUserView } from '@/lib/types/database';
import type { Dictionary } from '@/lib/i18n/getDictionary';

interface StripeData {
  has_stripe: boolean;
  customer_id?: string;
  subscription?: {
    id: string;
    status: string;
    current_period_start: number;
    current_period_end: number;
    cancel_at_period_end: boolean;
  } | null;
  invoices: Array<{
    id: string;
    amount_due: number;
    amount_paid: number;
    currency: string;
    status: string;
    created: number;
    hosted_invoice_url: string;
  }>;
}

interface UserDetailProps {
  user: AdminUserView;
  stripeData: StripeData | null;
  locale: string;
  dictionary: Dictionary;
  onUpdatePlan: (plan: 'FREE' | 'PRO') => Promise<void>;
  onUpdateComped: (date: string | null) => Promise<void>;
  onToggleDisabled: (disabled: boolean) => Promise<void>;
  onResetQuota: () => Promise<void>;
}

export function UserDetail({
  user,
  stripeData,
  locale,
  dictionary,
  onUpdatePlan,
  onUpdateComped,
  onToggleDisabled,
  onResetQuota,
}: UserDetailProps) {
  const t = dictionary.admin;
  const [loading, setLoading] = useState<string | null>(null);
  const [compedDate, setCompedDate] = useState(user.comped_until || '');
  const [modal, setModal] = useState<{
    type: string;
    message: string;
    action: () => Promise<void>;
    variant?: 'danger' | 'primary';
  } | null>(null);

  const handleAction = async (action: () => Promise<void>, loadingKey: string) => {
    setLoading(loadingKey);
    try {
      await action();
    } finally {
      setLoading(null);
      setModal(null);
    }
  };

  const isComped =
    user.comped_until && user.comped_until >= new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {t.userDetail.basicInfo}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm text-gray-500">{t.table.email}</dt>
              <dd className="text-gray-900 font-medium">{user.email}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">{t.table.name}</dt>
              <dd className="text-gray-900">{user.name || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">{t.table.createdAt}</dt>
              <dd className="text-gray-900">{formatDate(new Date(user.created_at), locale)}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">ID</dt>
              <dd className="text-gray-500 text-sm font-mono">{user.id}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Plan Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            {t.userDetail.planManagement}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{t.userDetail.currentPlan}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={user.plan === 'PRO' ? 'success' : 'default'} className="text-base">
                  {user.plan}
                </Badge>
                {isComped && <Badge variant="info">{t.status.comped}</Badge>}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={user.plan === 'FREE' ? 'primary' : 'outline'}
                size="sm"
                disabled={user.plan === 'FREE' || loading === 'plan'}
                onClick={() =>
                  setModal({
                    type: 'plan',
                    message: t.confirmModal.changePlanTo,
                    action: () => onUpdatePlan('FREE'),
                  })
                }
              >
                FREE
              </Button>
              <Button
                variant={user.plan === 'PRO' ? 'primary' : 'outline'}
                size="sm"
                disabled={user.plan === 'PRO' || loading === 'plan'}
                onClick={() =>
                  setModal({
                    type: 'plan',
                    message: t.confirmModal.changePlanTo,
                    action: () => onUpdatePlan('PRO'),
                  })
                }
              >
                PRO
              </Button>
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm text-gray-500 mb-2">{t.userDetail.compedUntil}</p>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={compedDate}
                onChange={(e) => setCompedDate(e.target.value)}
                className="w-48"
              />
              <Button
                variant="outline"
                size="sm"
                disabled={!compedDate || loading === 'comped'}
                onClick={() =>
                  setModal({
                    type: 'comped',
                    message: t.confirmModal.setComped,
                    action: () => onUpdateComped(compedDate),
                  })
                }
              >
                {t.userDetail.setCompedDate}
              </Button>
              {user.comped_until && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={loading === 'comped'}
                  onClick={() =>
                    setModal({
                      type: 'comped',
                      message: t.confirmModal.clearComped,
                      action: () => {
                        setCompedDate('');
                        return onUpdateComped(null);
                      },
                    })
                  }
                >
                  {t.userDetail.clearCompedDate}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            {t.userDetail.accountStatus}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {user.is_disabled ? (
                <>
                  <Ban className="w-5 h-5 text-red-500" />
                  <span className="text-red-600 font-medium">{t.userDetail.accountDisabled}</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-green-600 font-medium">{t.userDetail.accountEnabled}</span>
                </>
              )}
            </div>
            <Button
              variant={user.is_disabled ? 'primary' : 'danger'}
              size="sm"
              disabled={loading === 'disable'}
              onClick={() =>
                setModal({
                  type: 'disable',
                  message: user.is_disabled
                    ? t.confirmModal.enableUser
                    : t.confirmModal.disableUser,
                  action: () => onToggleDisabled(!user.is_disabled),
                  variant: user.is_disabled ? 'primary' : 'danger',
                })
              }
            >
              {user.is_disabled ? t.userDetail.enableAccount : t.userDetail.disableAccount}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Usage Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            {t.userDetail.usageStats}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">{t.userDetail.todayUsage}</p>
              <p className="text-2xl font-bold text-gray-900">{user.usage_today || 0}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">{t.userDetail.totalAnalyses}</p>
              <p className="text-2xl font-bold text-gray-900">{user.analyses_count || 0}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={loading === 'quota'}
            onClick={() =>
              setModal({
                type: 'quota',
                message: t.confirmModal.resetQuota,
                action: onResetQuota,
              })
            }
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {t.userDetail.resetQuota}
          </Button>
        </CardContent>
      </Card>

      {/* Stripe Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {t.userDetail.stripeInfo}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!stripeData?.has_stripe ? (
            <p className="text-gray-500">{t.userDetail.noStripeCustomer}</p>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">{t.userDetail.stripeCustomerId}</p>
                <p className="font-mono text-sm">{stripeData.customer_id}</p>
              </div>

              {stripeData.subscription && (
                <div>
                  <p className="text-sm text-gray-500">{t.userDetail.subscriptionStatus}</p>
                  <Badge
                    variant={stripeData.subscription.status === 'active' ? 'success' : 'warning'}
                  >
                    {stripeData.subscription.status}
                  </Badge>
                </div>
              )}

              {stripeData.invoices.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">{t.userDetail.lastInvoices}</p>
                  <div className="space-y-2">
                    {stripeData.invoices.map((invoice) => (
                      <div
                        key={invoice.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <span className="text-sm">
                          {new Date(invoice.created * 1000).toLocaleDateString(locale)}
                        </span>
                        <span className="text-sm font-medium">
                          {(invoice.amount_paid / 100).toFixed(2)} {invoice.currency.toUpperCase()}
                        </span>
                        <Badge variant={invoice.status === 'paid' ? 'success' : 'warning'}>
                          {invoice.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {stripeData.invoices.length === 0 && (
                <p className="text-gray-500 text-sm">{t.userDetail.noInvoices}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Modal */}
      {modal && (
        <ConfirmModal
          isOpen={true}
          title={t.confirmModal.title}
          message={modal.message}
          confirmLabel={t.confirmModal.confirm}
          cancelLabel={t.confirmModal.cancel}
          onConfirm={() => handleAction(modal.action, modal.type)}
          onCancel={() => setModal(null)}
          isLoading={loading === modal.type}
          variant={modal.variant}
        />
      )}
    </div>
  );
}
