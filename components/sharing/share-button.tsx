'use client';

import { useState } from 'react';
import { Share2, Download, Check, Copy, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Dictionary } from '@/lib/i18n/getDictionary';

interface ShareButtonProps {
  type: 'analysis' | 'planner';
  data: {
    // For analysis
    score?: number;
    hookScore?: number;
    viralPotential?: number;
    tip1?: string;
    tip2?: string;
    // For planner
    dayTitle?: string;
    contentType?: string;
    hook?: string;
  };
  locale: string;
  dictionary: Dictionary;
}

export function ShareButton({ type, data, locale, dictionary }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const t = dictionary.share;

  const buildImageUrl = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const params = new URLSearchParams({ locale });

    if (type === 'analysis') {
      params.set('score', String(data.score || 0));
      params.set('hookScore', String(data.hookScore || 0));
      params.set('viralPotential', String(data.viralPotential || 0));
      if (data.tip1) params.set('tip1', data.tip1);
      if (data.tip2) params.set('tip2', data.tip2);
      return `${baseUrl}/api/og/analysis?${params}`;
    } else {
      if (data.dayTitle) params.set('dayTitle', data.dayTitle);
      if (data.contentType) params.set('contentType', data.contentType);
      if (data.hook) params.set('hook', data.hook);
      if (data.tip1) params.set('tip1', data.tip1);
      if (data.tip2) params.set('tip2', data.tip2);
      return `${baseUrl}/api/og/planner?${params}`;
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const imageUrl = buildImageUrl();
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `viralforge-${type}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyLink = async () => {
    const imageUrl = buildImageUrl();
    try {
      await navigator.clipboard.writeText(imageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy error:', error);
    }
  };

  const handleNativeShare = async () => {
    if (!navigator.share) return;

    const imageUrl = buildImageUrl();
    try {
      // Try to share with image
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], 'viralforge-result.png', { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'ViralForge AI',
          text: t.shareText,
          files: [file],
        });
      } else {
        // Fallback to URL share
        await navigator.share({
          title: 'ViralForge AI',
          text: t.shareText,
          url: imageUrl,
        });
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Share error:', error);
      }
    }
  };

  const canNativeShare = typeof navigator !== 'undefined' && 'share' in navigator;

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2"
      >
        <Share2 className="w-4 h-4" />
        {t.button}
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="p-3 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">{t.title}</span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <p className="text-xs text-gray-500">{t.description}</p>
            </div>

            <div className="p-2 space-y-1">
              {canNativeShare && (
                <button
                  onClick={handleNativeShare}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                >
                  <Share2 className="w-4 h-4 text-primary-600" />
                  {t.nativeShare}
                </button>
              )}

              <button
                onClick={handleDownload}
                disabled={downloading}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors disabled:opacity-50"
              >
                <Download className="w-4 h-4 text-green-600" />
                {downloading ? t.downloading : t.download}
              </button>

              <button
                onClick={handleCopyLink}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" />
                    {t.copied}
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-blue-600" />
                    {t.copyLink}
                  </>
                )}
              </button>
            </div>

            {/* Preview */}
            <div className="p-3 border-t border-gray-100">
              <div className="aspect-[1200/630] bg-gradient-to-br from-primary-600 to-accent-600 rounded-lg overflow-hidden">
                <img
                  src={buildImageUrl()}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
