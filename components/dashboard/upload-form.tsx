'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, X, Video } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { PlatformSelector } from '@/components/ui/platform-selector';
import { CategorySelector } from '@/components/category';
import { useFrameExtractor } from './video-frame-extractor';
import { useCategories } from '@/hooks/use-categories';
import type { Dictionary } from '@/lib/i18n/getDictionary';
import type { Platform } from '@/lib/types/platform';
import { DEFAULT_PLATFORM } from '@/lib/types/platform';
import type { CategorySelection } from '@/lib/types/category';
import { DEFAULT_CATEGORY } from '@/lib/types/category';

interface UploadFormProps {
  dictionary: Dictionary;
  locale: string;
  userId: string;
  quotaReached: boolean;
}

export function UploadForm({ dictionary, locale, userId, quotaReached }: UploadFormProps) {
  const [platform, setPlatform] = useState<Platform>(DEFAULT_PLATFORM);
  const [category, setCategory] = useState<CategorySelection>(DEFAULT_CATEGORY);
  const [file, setFile] = useState<File | null>(null);
  const [transcript, setTranscript] = useState('');
  const [duration, setDuration] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();
  const { extractFrames, getVideoDuration } = useFrameExtractor();
  const { categories, loading: categoriesLoading } = useCategories();
  const t = dictionary;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const validTypes = ['video/mp4', 'video/quicktime', 'video/mov'];
    if (!validTypes.includes(selectedFile.type)) {
      setError('Invalid file type. Please upload MP4 or MOV.');
      return;
    }

    // Validate file size (100MB max)
    if (selectedFile.size > 100 * 1024 * 1024) {
      setError('File too large. Maximum size is 100MB.');
      return;
    }

    setFile(selectedFile);
    setError('');

    // Auto-detect duration
    try {
      const videoDuration = await getVideoDuration(selectedFile);
      setDuration(videoDuration.toString());
    } catch (err) {
      console.error('Failed to get video duration:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || quotaReached) return;

    setLoading(true);
    setError('');

    try {
      // Step 1: Extract frames
      setStatus(t.dashboard.extractingFrames);
      const frames = await extractFrames(file);

      // Step 2: Upload video
      setStatus(t.dashboard.uploadingVideo);
      const videoPath = `${userId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(videoPath, file);

      if (uploadError) throw uploadError;

      // Step 3: Create analysis record
      setStatus(t.dashboard.creatingAnalysis);
      const { data: analysis, error: analysisError } = await supabase
        .from('analyses')
        .insert({
          user_id: userId,
          video_path: videoPath,
          platform,
          category_group: category.group,
          category_slug: category.slug,
          transcript: transcript || null,
          duration_sec: duration ? parseInt(duration, 10) : null,
          status: 'queued',
        })
        .select()
        .single();

      if (analysisError) throw analysisError;

      // Step 4: Upload frames
      for (let i = 0; i < frames.length; i++) {
        const frame = frames[i];
        const framePath = `${userId}/${analysis.id}/frame_${i}_${frame.timestamp}s.png`;

        const { error: frameUploadError } = await supabase.storage
          .from('frames')
          .upload(framePath, frame.blob);

        if (frameUploadError) {
          console.error('Failed to upload frame:', frameUploadError);
          continue;
        }

        await supabase.from('analysis_frames').insert({
          analysis_id: analysis.id,
          frame_path: framePath,
        });
      }

      // Step 5: Trigger analysis
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisId: analysis.id,
          locale,
          platform,
          categoryGroup: category.group,
          categorySlug: category.slug,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMsg = errorData.details
          ? `${errorData.error}: ${errorData.details}`
          : errorData.error || 'Analysis failed';
        throw new Error(errorMsg);
      }

      // Redirect to analysis page
      router.push(`/${locale}/analysis/${analysis.id}`);
      router.refresh();
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : t.common.error);
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  const clearFile = () => {
    setFile(null);
    setDuration('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.dashboard.uploadTitle}</CardTitle>
        <CardDescription>{t.dashboard.uploadDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        {quotaReached ? (
          <div className="text-center py-8">
            <div className="text-amber-500 mb-4">
              <svg
                className="w-12 h-12 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t.dashboard.quotaReached}
            </h3>
            <p className="text-gray-600 mb-4">{t.dashboard.quotaReachedDescription}</p>
            <Button onClick={() => router.push(`/${locale}/pricing`)}>
              {t.dashboard.upgradeToPro}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>
            )}

            {status && (
              <div className="p-3 bg-blue-50 text-blue-600 text-sm rounded-lg flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                {status}
              </div>
            )}

            {/* Category Selector */}
            {!categoriesLoading && categories.length > 0 && (
              <CategorySelector
                locale={locale}
                dictionary={dictionary}
                value={category}
                onChange={setCategory}
                categories={categories}
                disabled={loading}
              />
            )}

            {/* Platform Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.platforms.title}
              </label>
              <PlatformSelector
                value={platform}
                onChange={setPlatform}
                dictionary={dictionary}
                disabled={loading}
                variant="cards"
              />
            </div>

            {/* File Upload */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/quicktime,video/mov"
                onChange={handleFileChange}
                className="hidden"
                id="video-upload"
              />
              {!file ? (
                <label
                  htmlFor="video-upload"
                  className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <Upload className="w-10 h-10 text-gray-400 mb-2" />
                  <span className="text-sm font-medium text-gray-700">
                    {t.dashboard.selectVideo}
                  </span>
                  <span className="text-xs text-gray-500 mt-1">{t.dashboard.dragDrop}</span>
                  <span className="text-xs text-gray-400 mt-2">
                    {t.dashboard.supportedFormats}
                  </span>
                </label>
              ) : (
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Video className="w-6 h-6 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={clearFile}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {/* Duration */}
            <Input
              label={t.dashboard.duration}
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder={t.dashboard.durationPlaceholder}
              min="1"
              max="600"
            />

            {/* Transcript */}
            <Textarea
              label={t.dashboard.transcript}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder={t.dashboard.transcriptPlaceholder}
              rows={4}
            />

            {/* Submit */}
            <Button type="submit" className="w-full" disabled={!file || loading} isLoading={loading}>
              {loading ? t.dashboard.analyzing : t.dashboard.analyze}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
