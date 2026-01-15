'use client';

import { useState } from 'react';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FeedbackFormProps {
  locale: string;
  onSuccess?: () => void;
}

export function FeedbackForm({ locale, onSuccess }: FeedbackFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'feature' | 'improvement' | 'integration' | 'other'>('feature');
  const [importance, setImportance] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const t = {
    titleLabel: locale === 'tr' ? 'Başlık' : 'Title',
    titlePlaceholder: locale === 'tr' ? 'Kısa bir başlık...' : 'A short title...',
    descriptionLabel: locale === 'tr' ? 'Açıklama' : 'Description',
    descriptionPlaceholder: locale === 'tr' ? 'Önerinizi detaylı açıklayın...' : 'Describe your suggestion in detail...',
    categoryLabel: locale === 'tr' ? 'Kategori' : 'Category',
    importanceLabel: locale === 'tr' ? 'Önem Derecesi' : 'Importance',
    submit: locale === 'tr' ? 'Gönder' : 'Submit',
    submitting: locale === 'tr' ? 'Gönderiliyor...' : 'Submitting...',
    success: locale === 'tr' ? 'Öneriniz alındı. Teşekkürler!' : 'Your feedback has been submitted. Thank you!',
    error: locale === 'tr' ? 'Bir hata oluştu. Lütfen tekrar deneyin.' : 'An error occurred. Please try again.',
    categories: {
      feature: locale === 'tr' ? 'Yeni Özellik' : 'New Feature',
      improvement: locale === 'tr' ? 'İyileştirme' : 'Improvement',
      integration: locale === 'tr' ? 'Entegrasyon' : 'Integration',
      other: locale === 'tr' ? 'Diğer' : 'Other',
    },
    importances: {
      low: locale === 'tr' ? 'Düşük' : 'Low',
      medium: locale === 'tr' ? 'Orta' : 'Medium',
      high: locale === 'tr' ? 'Yüksek' : 'High',
      critical: locale === 'tr' ? 'Kritik' : 'Critical',
    },
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/support/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
          importance,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Submit failed');
      }

      setSuccess(true);
      setTitle('');
      setDescription('');
      setCategory('feature');
      setImportance('medium');
      onSuccess?.();
    } catch (err) {
      console.error('Submit error:', err);
      setError(t.error);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{t.success}</h3>
        <Button variant="outline" onClick={() => setSuccess(false)}>
          {locale === 'tr' ? 'Yeni Öneri' : 'New Suggestion'}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t.titleLabel} *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t.titlePlaceholder}
          required
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t.descriptionLabel} *
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t.descriptionPlaceholder}
          required
          rows={5}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
        />
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t.categoryLabel}
        </label>
        <div className="flex flex-wrap gap-2">
          {(['feature', 'improvement', 'integration', 'other'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                category === cat
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t.categories[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Importance */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t.importanceLabel}
        </label>
        <div className="flex flex-wrap gap-2">
          {(['low', 'medium', 'high', 'critical'] as const).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setImportance(level)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                importance === level
                  ? level === 'critical'
                    ? 'bg-red-600 text-white'
                    : level === 'high'
                    ? 'bg-orange-600 text-white'
                    : level === 'medium'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t.importances[level]}
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <Button
        type="submit"
        variant="primary"
        className="w-full"
        disabled={submitting || !title || !description}
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            {t.submitting}
          </>
        ) : (
          t.submit
        )}
      </Button>
    </form>
  );
}
