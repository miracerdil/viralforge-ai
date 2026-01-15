'use client';

import { useState, useEffect } from 'react';
import { Upload, X, Loader2, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BugReportFormProps {
  locale: string;
  onSuccess?: () => void;
}

export function BugReportForm({ locale, onSuccess }: BugReportFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [browserInfo, setBrowserInfo] = useState<Record<string, any>>({});

  useEffect(() => {
    // Collect browser/device info
    setBrowserInfo({
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      url: window.location.href,
    });
  }, []);

  const t = {
    title: locale === 'tr' ? 'Hata Bildir' : 'Report a Bug',
    subtitle: locale === 'tr' ? 'Karşılaştığınız sorunu bize bildirin' : 'Let us know about any issues you encounter',
    titleLabel: locale === 'tr' ? 'Başlık' : 'Title',
    titlePlaceholder: locale === 'tr' ? 'Kısa bir başlık...' : 'A short title...',
    descriptionLabel: locale === 'tr' ? 'Açıklama' : 'Description',
    descriptionPlaceholder: locale === 'tr' ? 'Hatayı detaylı açıklayın...' : 'Describe the bug in detail...',
    severityLabel: locale === 'tr' ? 'Önem Derecesi' : 'Severity',
    screenshotLabel: locale === 'tr' ? 'Ekran Görüntüsü (isteğe bağlı)' : 'Screenshot (optional)',
    uploadScreenshot: locale === 'tr' ? 'Görsel Yükle' : 'Upload Image',
    submit: locale === 'tr' ? 'Gönder' : 'Submit',
    submitting: locale === 'tr' ? 'Gönderiliyor...' : 'Submitting...',
    success: locale === 'tr' ? 'Hata raporunuz alındı. Teşekkürler!' : 'Bug report received. Thank you!',
    error: locale === 'tr' ? 'Bir hata oluştu. Lütfen tekrar deneyin.' : 'An error occurred. Please try again.',
    severities: {
      low: locale === 'tr' ? 'Düşük' : 'Low',
      medium: locale === 'tr' ? 'Orta' : 'Medium',
      high: locale === 'tr' ? 'Yüksek' : 'High',
      critical: locale === 'tr' ? 'Kritik' : 'Critical',
    },
  };

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/support/screenshot', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setScreenshotUrl(data.url);
    } catch (err) {
      console.error('Upload error:', err);
      setError(t.error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/support/bugs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          severity,
          screenshot_url: screenshotUrl,
          page_url: window.location.href,
          browser_info: browserInfo,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Submit failed');
      }

      setSuccess(true);
      setTitle('');
      setDescription('');
      setSeverity('medium');
      setScreenshotUrl(null);
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
          {locale === 'tr' ? 'Yeni Rapor' : 'New Report'}
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

      {/* Severity */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t.severityLabel}
        </label>
        <div className="flex flex-wrap gap-2">
          {(['low', 'medium', 'high', 'critical'] as const).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setSeverity(level)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                severity === level
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
              {t.severities[level]}
            </button>
          ))}
        </div>
      </div>

      {/* Screenshot */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t.screenshotLabel}
        </label>
        {screenshotUrl ? (
          <div className="relative inline-block">
            <img
              src={screenshotUrl}
              alt="Screenshot"
              className="max-w-xs rounded-lg border border-gray-200"
            />
            <button
              type="button"
              onClick={() => setScreenshotUrl(null)}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <label className="flex items-center justify-center gap-2 px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors">
            {uploading ? (
              <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
            ) : (
              <>
                <Upload className="w-5 h-5 text-gray-500" />
                <span className="text-gray-600">{t.uploadScreenshot}</span>
              </>
            )}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleScreenshotUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        )}
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
