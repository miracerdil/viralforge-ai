'use client';

import { useState } from 'react';
import { X, Copy, Check, Link2, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ShareLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentType: 'hooks' | 'analysis' | 'planner' | 'ab_test';
  contentId: string;
  title?: string;
  locale: string;
}

export function ShareLinkModal({
  isOpen,
  onClose,
  contentType,
  contentId,
  title,
  locale,
}: ShareLinkModalProps) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const labels = {
    title: locale === 'tr' ? 'Paylaşım Linki Oluştur' : 'Create Share Link',
    subtitle: locale === 'tr' ? 'Bu içeriği başkalarıyla paylaşın' : 'Share this content with others',
    createButton: locale === 'tr' ? 'Link Oluştur' : 'Create Link',
    copyButton: locale === 'tr' ? 'Kopyala' : 'Copy',
    copied: locale === 'tr' ? 'Kopyalandı!' : 'Copied!',
    openLink: locale === 'tr' ? 'Linki Aç' : 'Open Link',
    creating: locale === 'tr' ? 'Oluşturuluyor...' : 'Creating...',
    error: locale === 'tr' ? 'Bir hata oluştu' : 'An error occurred',
    close: locale === 'tr' ? 'Kapat' : 'Close',
  };

  const handleCreateShare = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content_type: contentType,
          content_id: contentId,
          title,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create share');
      }

      const fullUrl = `${window.location.origin}${data.share_url}`;
      setShareUrl(fullUrl);
    } catch (err) {
      console.error('Share error:', err);
      setError(labels.error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy error:', err);
    }
  };

  const handleClose = () => {
    setShareUrl(null);
    setError(null);
    setCopied(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{labels.title}</h2>
            <p className="text-sm text-gray-500">{labels.subtitle}</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {!shareUrl ? (
          <div className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <Button
              variant="primary"
              className="w-full gap-2"
              onClick={handleCreateShare}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {labels.creating}
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4" />
                  {labels.createButton}
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Share URL Input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-700 truncate"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="shrink-0 gap-1"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" />
                    {labels.copied}
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    {labels.copyButton}
                  </>
                )}
              </Button>
            </div>

            {/* Open Link Button */}
            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              {labels.openLink}
            </a>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <Button
            variant="ghost"
            className="w-full"
            onClick={handleClose}
          >
            {labels.close}
          </Button>
        </div>
      </div>
    </div>
  );
}
