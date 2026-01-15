'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { ToggleLeft, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import type { Dictionary } from '@/lib/i18n/getDictionary';

interface FeatureFlag {
  id: string;
  flag_key: string;
  flag_name: string;
  description: string | null;
  is_enabled: boolean;
  target_plans: string[];
  target_user_ids: string[];
  created_at: string;
  updated_at: string;
}

export default function FeatureFlagsPage() {
  const params = useParams();
  const locale = params.locale as string;

  const [dictionary, setDictionary] = useState<Dictionary | null>(null);
  const [loading, setLoading] = useState(true);
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [editingFlag, setEditingFlag] = useState<FeatureFlag | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    flag_key: '',
    flag_name: '',
    description: '',
    is_enabled: false,
    target_plans: [] as string[],
  });

  useEffect(() => {
    import(`@/lib/i18n/dictionaries/${locale}.json`).then((module) => {
      setDictionary(module.default);
    });
  }, [locale]);

  const fetchFlags = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/feature-flags');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setFlags(data.flags || []);
    } catch (error) {
      console.error('Failed to fetch feature flags:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  const handleToggle = async (flag: FeatureFlag) => {
    try {
      const response = await fetch('/api/admin/feature-flags', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: flag.id, is_enabled: !flag.is_enabled }),
      });

      if (response.ok) {
        setFlags(flags.map(f => f.id === flag.id ? { ...f, is_enabled: !f.is_enabled } : f));
      }
    } catch (error) {
      console.error('Failed to toggle flag:', error);
    }
  };

  const handleCreate = async () => {
    if (!formData.flag_key || !formData.flag_name) return;

    setSaving(true);
    try {
      const response = await fetch('/api/admin/feature-flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setFlags([...flags, data.flag]);
        setShowCreateForm(false);
        resetForm();
      }
    } catch (error) {
      console.error('Failed to create flag:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingFlag) return;

    setSaving(true);
    try {
      const response = await fetch('/api/admin/feature-flags', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingFlag.id, ...formData }),
      });

      if (response.ok) {
        const data = await response.json();
        setFlags(flags.map(f => f.id === editingFlag.id ? data.flag : f));
        setEditingFlag(null);
        resetForm();
      }
    } catch (error) {
      console.error('Failed to update flag:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(locale === 'tr' ? 'Bu bayrağı silmek istediğinize emin misiniz?' : 'Are you sure you want to delete this flag?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/feature-flags?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setFlags(flags.filter(f => f.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete flag:', error);
    }
  };

  const startEdit = (flag: FeatureFlag) => {
    setEditingFlag(flag);
    setFormData({
      flag_key: flag.flag_key,
      flag_name: flag.flag_name,
      description: flag.description || '',
      is_enabled: flag.is_enabled,
      target_plans: flag.target_plans,
    });
    setShowCreateForm(false);
  };

  const resetForm = () => {
    setFormData({
      flag_key: '',
      flag_name: '',
      description: '',
      is_enabled: false,
      target_plans: [],
    });
  };

  const togglePlan = (plan: string) => {
    if (formData.target_plans.includes(plan)) {
      setFormData({ ...formData, target_plans: formData.target_plans.filter(p => p !== plan) });
    } else {
      setFormData({ ...formData, target_plans: [...formData.target_plans, plan] });
    }
  };

  if (!dictionary || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const plans = ['free', 'creator_pro', 'business_pro'];
  const planLabels: Record<string, string> = {
    free: locale === 'tr' ? 'Ücretsiz' : 'Free',
    creator_pro: 'Creator PRO',
    business_pro: 'Business PRO',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {locale === 'tr' ? 'Özellik Bayrakları' : 'Feature Flags'}
          </h1>
          <p className="text-gray-600 mt-1">
            {locale === 'tr'
              ? 'Özellikleri dinamik olarak açıp kapatın'
              : 'Dynamically enable or disable features'}
          </p>
        </div>
        <Button onClick={() => { setShowCreateForm(true); setEditingFlag(null); resetForm(); }}>
          <Plus className="w-4 h-4 mr-2" />
          {locale === 'tr' ? 'Yeni Bayrak' : 'New Flag'}
        </Button>
      </div>

      {/* Create/Edit Form */}
      {(showCreateForm || editingFlag) && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingFlag
                ? (locale === 'tr' ? 'Bayrağı Düzenle' : 'Edit Flag')
                : (locale === 'tr' ? 'Yeni Bayrak Oluştur' : 'Create New Flag')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === 'tr' ? 'Bayrak Anahtarı' : 'Flag Key'}
                  </label>
                  <input
                    type="text"
                    value={formData.flag_key}
                    onChange={(e) => setFormData({ ...formData, flag_key: e.target.value })}
                    placeholder="e.g., new_dashboard"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    disabled={!!editingFlag}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === 'tr' ? 'Görünen Ad' : 'Display Name'}
                  </label>
                  <input
                    type="text"
                    value={formData.flag_name}
                    onChange={(e) => setFormData({ ...formData, flag_name: e.target.value })}
                    placeholder="e.g., New Dashboard"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {locale === 'tr' ? 'Açıklama' : 'Description'}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={locale === 'tr' ? 'Bu bayrağın ne yaptığını açıklayın...' : 'Describe what this flag does...'}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {locale === 'tr' ? 'Hedef Planlar' : 'Target Plans'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {plans.map((plan) => (
                    <button
                      key={plan}
                      onClick={() => togglePlan(plan)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        formData.target_plans.includes(plan)
                          ? 'bg-primary-100 text-primary-700 border-2 border-primary-500'
                          : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                      }`}
                    >
                      {planLabels[plan]}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {locale === 'tr'
                    ? 'Hiçbir plan seçilmezse bayrak tüm kullanıcılara uygulanır'
                    : 'If no plans selected, flag applies to all users'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFormData({ ...formData, is_enabled: !formData.is_enabled })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.is_enabled ? 'bg-primary-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.is_enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-sm font-medium text-gray-700">
                  {formData.is_enabled
                    ? (locale === 'tr' ? 'Aktif' : 'Enabled')
                    : (locale === 'tr' ? 'Devre Dışı' : 'Disabled')}
                </span>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => { setShowCreateForm(false); setEditingFlag(null); resetForm(); }}
                >
                  {locale === 'tr' ? 'İptal' : 'Cancel'}
                </Button>
                <Button
                  onClick={editingFlag ? handleUpdate : handleCreate}
                  disabled={saving || !formData.flag_key || !formData.flag_name}
                >
                  {saving ? <Spinner size="sm" className="mr-2" /> : null}
                  {editingFlag
                    ? (locale === 'tr' ? 'Güncelle' : 'Update')
                    : (locale === 'tr' ? 'Oluştur' : 'Create')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Flags List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ToggleLeft className="w-5 h-5" />
            {locale === 'tr' ? 'Tüm Bayraklar' : 'All Flags'}
            <span className="text-sm font-normal text-gray-500">({flags.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-gray-100">
            {flags.length === 0 ? (
              <p className="text-gray-500 py-8 text-center">
                {locale === 'tr' ? 'Henüz bayrak oluşturulmamış' : 'No flags created yet'}
              </p>
            ) : (
              flags.map((flag) => (
                <div key={flag.id} className="py-4 flex items-center gap-4">
                  <button
                    onClick={() => handleToggle(flag)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
                      flag.is_enabled ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        flag.is_enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{flag.flag_name}</span>
                      <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                        {flag.flag_key}
                      </code>
                    </div>
                    {flag.description && (
                      <p className="text-sm text-gray-500 truncate">{flag.description}</p>
                    )}
                    {flag.target_plans.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {flag.target_plans.map((plan) => (
                          <span
                            key={plan}
                            className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full"
                          >
                            {planLabels[plan] || plan}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startEdit(flag)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(flag.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
