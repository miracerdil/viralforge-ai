'use client';

import { useState } from 'react';
import { X, BarChart3, Eye, Heart, MessageCircle, Share2, Bookmark, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlatformSelector } from '@/components/ui/platform-selector';
import type { Dictionary } from '@/lib/i18n/getDictionary';
import type { Platform } from '@/lib/types/platform';
import type { ContentType, ContentResultInput } from '@/lib/types/performance';

interface ResultInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ContentResultInput) => Promise<void>;
  dictionary: Dictionary;
  locale: string;
  generationId?: string;
  contentPreview?: string;
  platform?: Platform;
  contentType?: ContentType;
}

export function ResultInputModal({
  isOpen,
  onClose,
  onSubmit,
  dictionary,
  locale,
  generationId,
  contentPreview,
  platform: initialPlatform = 'tiktok',
  contentType = 'hook',
}: ResultInputModalProps) {
  const [loading, setLoading] = useState(false);
  const [platform, setPlatform] = useState<Platform>(initialPlatform);
  const [views, setViews] = useState('');
  const [likes, setLikes] = useState('');
  const [comments, setComments] = useState('');
  const [shares, setShares] = useState('');
  const [saves, setSaves] = useState('');
  const [followersGained, setFollowersGained] = useState('');

  const t = dictionary.performance || {
    addResult: 'Add Result',
    trackPerformance: 'Track Performance',
    subtitle: 'Enter your content metrics to improve future AI suggestions',
    views: 'Views',
    likes: 'Likes',
    comments: 'Comments',
    shares: 'Shares',
    saves: 'Saves',
    followersGained: 'Followers Gained',
    submit: 'Save Result',
    contentPreview: 'Content',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit({
        generation_id: generationId,
        platform,
        content_type: contentType,
        content_preview: contentPreview,
        views: parseInt(views) || 0,
        likes: parseInt(likes) || 0,
        comments: parseInt(comments) || 0,
        shares: parseInt(shares) || 0,
        saves: parseInt(saves) || 0,
        followers_gained: parseInt(followersGained) || 0,
        posted_at: new Date().toISOString(),
      });
      onClose();
      // Reset form
      setViews('');
      setLikes('');
      setComments('');
      setShares('');
      setSaves('');
      setFollowersGained('');
    } catch (error) {
      console.error('Error submitting result:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-teal-600 px-6 py-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-white/20 rounded-full mb-3">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white mb-1">{t.trackPerformance}</h2>
          <p className="text-white/80 text-sm">{t.subtitle}</p>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
          {/* Content Preview */}
          {contentPreview && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">{t.contentPreview}</p>
              <p className="text-sm text-gray-700 line-clamp-2">{contentPreview}</p>
            </div>
          )}

          {/* Platform */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {dictionary.platforms.title}
            </label>
            <PlatformSelector
              value={platform}
              onChange={setPlatform}
              dictionary={dictionary}
              variant="dropdown"
              size="md"
            />
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Views */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1">
                <Eye className="w-4 h-4 text-blue-500" />
                {t.views}
              </label>
              <input
                type="number"
                value={views}
                onChange={(e) => setViews(e.target.value)}
                placeholder="0"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            {/* Likes */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1">
                <Heart className="w-4 h-4 text-red-500" />
                {t.likes}
              </label>
              <input
                type="number"
                value={likes}
                onChange={(e) => setLikes(e.target.value)}
                placeholder="0"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            {/* Comments */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1">
                <MessageCircle className="w-4 h-4 text-purple-500" />
                {t.comments}
              </label>
              <input
                type="number"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="0"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            {/* Shares */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1">
                <Share2 className="w-4 h-4 text-green-500" />
                {t.shares}
              </label>
              <input
                type="number"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                placeholder="0"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            {/* Saves */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1">
                <Bookmark className="w-4 h-4 text-amber-500" />
                {t.saves}
              </label>
              <input
                type="number"
                value={saves}
                onChange={(e) => setSaves(e.target.value)}
                placeholder="0"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            {/* Followers Gained */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1">
                <Users className="w-4 h-4 text-indigo-500" />
                {t.followersGained}
              </label>
              <input
                type="number"
                value={followersGained}
                onChange={(e) => setFollowersGained(e.target.value)}
                placeholder="0"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            isLoading={loading}
            className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            {t.submit}
          </Button>
        </form>
      </div>
    </div>
  );
}
