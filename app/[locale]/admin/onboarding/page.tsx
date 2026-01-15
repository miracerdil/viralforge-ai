'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Compass, Edit, Save, X, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';

interface OnboardingStep {
  step_key: string;
  title_tr: string;
  title_en: string;
  description_tr: string;
  description_en: string;
  xp_reward: number;
  sort_order: number;
  is_active: boolean;
  icon: string;
  action_url: string;
  action_label_tr: string;
  action_label_en: string;
}

export default function AdminOnboardingPage() {
  const params = useParams();
  const locale = params.locale as string;
  const supabase = createClient();

  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingStep, setEditingStep] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<OnboardingStep>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSteps();
  }, []);

  const fetchSteps = async () => {
    const { data, error } = await supabase
      .from('onboarding_config')
      .select('*')
      .order('sort_order');

    if (error) {
      console.error('Error fetching onboarding steps:', error);
    } else {
      setSteps(data || []);
    }
    setLoading(false);
  };

  const handleEdit = (step: OnboardingStep) => {
    setEditingStep(step.step_key);
    setEditForm(step);
  };

  const handleSave = async () => {
    if (!editingStep) return;
    setSaving(true);

    const { error } = await supabase
      .from('onboarding_config')
      .update(editForm)
      .eq('step_key', editingStep);

    if (!error) {
      setSteps((prev) =>
        prev.map((s) => (s.step_key === editingStep ? { ...s, ...editForm } : s))
      );
      setEditingStep(null);
      setEditForm({});
    }
    setSaving(false);
  };

  const handleCancel = () => {
    setEditingStep(null);
    setEditForm({});
  };

  const toggleActive = async (stepKey: string, currentValue: boolean) => {
    const { error } = await supabase
      .from('onboarding_config')
      .update({ is_active: !currentValue })
      .eq('step_key', stepKey);

    if (!error) {
      setSteps((prev) =>
        prev.map((s) => (s.step_key === stepKey ? { ...s, is_active: !currentValue } : s))
      );
    }
  };

  const t = {
    title: locale === 'tr' ? 'Onboarding Ayarları' : 'Onboarding Settings',
    subtitle: locale === 'tr' ? 'Kullanıcı başlangıç adımlarını yönetin' : 'Manage user onboarding steps',
    step: locale === 'tr' ? 'Adım' : 'Step',
    xpReward: locale === 'tr' ? 'XP Ödülü' : 'XP Reward',
    active: locale === 'tr' ? 'Aktif' : 'Active',
    inactive: locale === 'tr' ? 'Pasif' : 'Inactive',
    save: locale === 'tr' ? 'Kaydet' : 'Save',
    cancel: locale === 'tr' ? 'İptal' : 'Cancel',
    edit: locale === 'tr' ? 'Düzenle' : 'Edit',
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
          <Compass className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
          <p className="text-gray-500">{t.subtitle}</p>
        </div>
      </div>

      {/* Steps List */}
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div
            key={step.step_key}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            {editingStep === step.step_key ? (
              /* Edit Form */
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Title (TR)</label>
                    <input
                      type="text"
                      value={editForm.title_tr || ''}
                      onChange={(e) => setEditForm({ ...editForm, title_tr: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Title (EN)</label>
                    <input
                      type="text"
                      value={editForm.title_en || ''}
                      onChange={(e) => setEditForm({ ...editForm, title_en: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Description (TR)</label>
                    <input
                      type="text"
                      value={editForm.description_tr || ''}
                      onChange={(e) => setEditForm({ ...editForm, description_tr: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description (EN)</label>
                    <input
                      type="text"
                      value={editForm.description_en || ''}
                      onChange={(e) => setEditForm({ ...editForm, description_en: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">{t.xpReward}</label>
                    <input
                      type="number"
                      value={editForm.xp_reward || 0}
                      onChange={(e) => setEditForm({ ...editForm, xp_reward: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Icon</label>
                    <input
                      type="text"
                      value={editForm.icon || ''}
                      onChange={(e) => setEditForm({ ...editForm, icon: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Action URL</label>
                    <input
                      type="text"
                      value={editForm.action_url || ''}
                      onChange={(e) => setEditForm({ ...editForm, action_url: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Sort Order</label>
                    <input
                      type="number"
                      value={editForm.sort_order || 0}
                      onChange={(e) => setEditForm({ ...editForm, sort_order: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={handleCancel}>
                    <X className="w-4 h-4 mr-1" />
                    {t.cancel}
                  </Button>
                  <Button variant="primary" onClick={handleSave} disabled={saving}>
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    ) : (
                      <Save className="w-4 h-4 mr-1" />
                    )}
                    {t.save}
                  </Button>
                </div>
              </div>
            ) : (
              /* Display Mode */
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-sm font-semibold text-gray-600">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {locale === 'tr' ? step.title_tr : step.title_en}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {locale === 'tr' ? step.description_tr : step.description_en}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded">
                    +{step.xp_reward} XP
                  </span>

                  <button
                    onClick={() => toggleActive(step.step_key, step.is_active)}
                    className={`px-3 py-1 text-xs font-medium rounded-full ${
                      step.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {step.is_active ? t.active : t.inactive}
                  </button>

                  <Button variant="ghost" size="sm" onClick={() => handleEdit(step)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
