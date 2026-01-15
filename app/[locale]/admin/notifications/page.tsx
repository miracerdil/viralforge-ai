'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { Bell, Send, Users, Target, AlertCircle, CheckCircle, Info, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import type { Dictionary } from '@/lib/i18n/getDictionary';

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  action_url: string | null;
  is_read: boolean;
  created_at: string;
  profiles?: { email: string; name: string | null };
}

export default function AdminNotificationsPage() {
  const params = useParams();
  const locale = params.locale as string;

  const [dictionary, setDictionary] = useState<Dictionary | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showComposer, setShowComposer] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    type: 'system',
    title: '',
    message: '',
    action_url: '',
    action_label: '',
    target: {
      type: 'all' as 'all' | 'plan' | 'stage' | 'users',
      plans: [] as string[],
      stages: [] as string[],
      user_ids: [] as string[],
    },
  });

  useEffect(() => {
    import(`@/lib/i18n/dictionaries/${locale}.json`).then((module) => {
      setDictionary(module.default);
    });
  }, [locale]);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/notifications');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleSend = async () => {
    if (!formData.title || !formData.message) return;

    setSending(true);
    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        alert(locale === 'tr'
          ? `${data.sent_count} kullanıcıya bildirim gönderildi`
          : `Notification sent to ${data.sent_count} users`);
        setShowComposer(false);
        resetForm();
        fetchNotifications();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to send notification');
      }
    } catch (error) {
      console.error('Failed to send notification:', error);
    } finally {
      setSending(false);
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'system',
      title: '',
      message: '',
      action_url: '',
      action_label: '',
      target: { type: 'all', plans: [], stages: [], user_ids: [] },
    });
  };

  const toggleTargetPlan = (plan: string) => {
    const plans = formData.target.plans.includes(plan)
      ? formData.target.plans.filter((p) => p !== plan)
      : [...formData.target.plans, plan];
    setFormData({ ...formData, target: { ...formData.target, plans } });
  };

  const toggleTargetStage = (stage: string) => {
    const stages = formData.target.stages.includes(stage)
      ? formData.target.stages.filter((s) => s !== stage)
      : [...formData.target.stages, stage];
    setFormData({ ...formData, target: { ...formData.target, stages } });
  };

  if (!dictionary || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const notificationTypes = [
    { value: 'system', label: locale === 'tr' ? 'Sistem' : 'System', icon: Info },
    { value: 'achievement', label: locale === 'tr' ? 'Başarı' : 'Achievement', icon: Star },
    { value: 'feature', label: locale === 'tr' ? 'Özellik' : 'Feature', icon: CheckCircle },
    { value: 'warning', label: locale === 'tr' ? 'Uyarı' : 'Warning', icon: AlertCircle },
  ];

  const plans = ['free', 'creator_pro', 'business_pro'];
  const stages = ['new_user', 'activated', 'engaged', 'at_risk', 'churn_risk'];

  const planLabels: Record<string, string> = {
    free: locale === 'tr' ? 'Ücretsiz' : 'Free',
    creator_pro: 'Creator PRO',
    business_pro: 'Business PRO',
  };

  const stageLabels: Record<string, string> = {
    new_user: locale === 'tr' ? 'Yeni Kullanıcı' : 'New User',
    activated: locale === 'tr' ? 'Aktifleşmiş' : 'Activated',
    engaged: locale === 'tr' ? 'Etkileşimli' : 'Engaged',
    at_risk: locale === 'tr' ? 'Risk Altında' : 'At Risk',
    churn_risk: locale === 'tr' ? 'Kayıp Riski' : 'Churn Risk',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {locale === 'tr' ? 'Bildirim Yönetimi' : 'Notification Management'}
          </h1>
          <p className="text-gray-600 mt-1">
            {locale === 'tr'
              ? 'Kullanıcılara toplu bildirim gönderin'
              : 'Send bulk notifications to users'}
          </p>
        </div>
        <Button onClick={() => setShowComposer(true)}>
          <Send className="w-4 h-4 mr-2" />
          {locale === 'tr' ? 'Yeni Bildirim' : 'New Notification'}
        </Button>
      </div>

      {/* Notification Composer */}
      {showComposer && (
        <Card>
          <CardHeader>
            <CardTitle>
              {locale === 'tr' ? 'Bildirim Oluştur' : 'Compose Notification'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {locale === 'tr' ? 'Bildirim Türü' : 'Notification Type'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {notificationTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.value}
                        onClick={() => setFormData({ ...formData, type: type.value })}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          formData.type === type.value
                            ? 'bg-primary-100 text-primary-700 border-2 border-primary-500'
                            : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {type.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title & Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {locale === 'tr' ? 'Başlık' : 'Title'}
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={locale === 'tr' ? 'Bildirim başlığı...' : 'Notification title...'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {locale === 'tr' ? 'Mesaj' : 'Message'}
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder={locale === 'tr' ? 'Bildirim mesajı...' : 'Notification message...'}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Optional Action */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === 'tr' ? 'Aksiyon URL (Opsiyonel)' : 'Action URL (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={formData.action_url}
                    onChange={(e) => setFormData({ ...formData, action_url: e.target.value })}
                    placeholder="/dashboard"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === 'tr' ? 'Buton Metni (Opsiyonel)' : 'Button Label (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={formData.action_label}
                    onChange={(e) => setFormData({ ...formData, action_label: e.target.value })}
                    placeholder={locale === 'tr' ? 'Görüntüle' : 'View'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Target Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Target className="w-4 h-4 inline mr-1" />
                  {locale === 'tr' ? 'Hedef Kitle' : 'Target Audience'}
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {[
                    { value: 'all', label: locale === 'tr' ? 'Tüm Kullanıcılar' : 'All Users' },
                    { value: 'plan', label: locale === 'tr' ? 'Plana Göre' : 'By Plan' },
                    { value: 'stage', label: locale === 'tr' ? 'Aşamaya Göre' : 'By Stage' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFormData({ ...formData, target: { ...formData.target, type: option.value as 'all' | 'plan' | 'stage' } })}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        formData.target.type === option.value
                          ? 'bg-primary-100 text-primary-700 border-2 border-primary-500'
                          : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                {formData.target.type === 'plan' && (
                  <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg">
                    {plans.map((plan) => (
                      <button
                        key={plan}
                        onClick={() => toggleTargetPlan(plan)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          formData.target.plans.includes(plan)
                            ? 'bg-primary-500 text-white'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {planLabels[plan]}
                      </button>
                    ))}
                  </div>
                )}

                {formData.target.type === 'stage' && (
                  <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg">
                    {stages.map((stage) => (
                      <button
                        key={stage}
                        onClick={() => toggleTargetStage(stage)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          formData.target.stages.includes(stage)
                            ? 'bg-primary-500 text-white'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {stageLabels[stage]}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => { setShowComposer(false); resetForm(); }}>
                  {locale === 'tr' ? 'İptal' : 'Cancel'}
                </Button>
                <Button onClick={handleSend} disabled={sending || !formData.title || !formData.message}>
                  {sending ? <Spinner size="sm" className="mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                  {locale === 'tr' ? 'Gönder' : 'Send'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            {locale === 'tr' ? 'Son Gönderilen Bildirimler' : 'Recent Notifications'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-gray-100">
            {notifications.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                {locale === 'tr' ? 'Henüz bildirim gönderilmemiş' : 'No notifications sent yet'}
              </p>
            ) : (
              notifications.slice(0, 20).map((notification) => (
                <div key={notification.id} className="py-4 flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    notification.type === 'warning' ? 'bg-amber-100' :
                    notification.type === 'achievement' ? 'bg-purple-100' :
                    notification.type === 'feature' ? 'bg-green-100' : 'bg-blue-100'
                  }`}>
                    {notification.type === 'warning' ? <AlertCircle className="w-5 h-5 text-amber-600" /> :
                     notification.type === 'achievement' ? <Star className="w-5 h-5 text-purple-600" /> :
                     notification.type === 'feature' ? <CheckCircle className="w-5 h-5 text-green-600" /> :
                     <Info className="w-5 h-5 text-blue-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">{notification.title}</span>
                      {!notification.is_read && (
                        <span className="w-2 h-2 bg-primary-500 rounded-full" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{notification.message}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <Users className="w-3 h-3" />
                      <span>{notification.profiles?.email || 'Unknown'}</span>
                      <span>•</span>
                      <span>{new Date(notification.created_at).toLocaleDateString(locale)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
