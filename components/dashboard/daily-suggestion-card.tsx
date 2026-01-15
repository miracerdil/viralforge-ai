'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Lightbulb, ArrowRight, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SuggestionDisplay } from '@/lib/types/daily-suggestions';

interface DailySuggestionCardProps {
  locale: string;
}

export function DailySuggestionCard({ locale }: DailySuggestionCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestionDisplay[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [canGenerate, setCanGenerate] = useState(false);

  const fetchSuggestions = async () => {
    try {
      const res = await fetch(`/api/daily-suggestions?locale=${locale}`);
      const data = await res.json();
      if (data.success) {
        setSuggestions(data.suggestions);
        setCanGenerate(data.canGenerate);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, [locale]);

  const generateSuggestions = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/daily-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale }),
      });
      const data = await res.json();
      if (data.success) {
        setSuggestions(data.suggestions);
        setCanGenerate(false);
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleSuggestionClick = async (suggestion: SuggestionDisplay) => {
    // Mark as used
    await fetch('/api/daily-suggestions/use', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ suggestionId: suggestion.id }),
    });

    // Navigate to generator with prefilled data
    const params = new URLSearchParams({
      platform: suggestion.platform,
      tone: suggestion.tone,
      format: suggestion.format,
      suggestion: suggestion.hookIdea,
    });

    router.push(`/${locale}/app/generator?${params.toString()}`);
  };

  const currentSuggestion = suggestions[currentIndex];

  const labels = {
    title: locale === 'tr' ? "Bugünün İçerik Önerisi" : "Today's Content Suggestion",
    empty: locale === 'tr' ? 'Henüz öneri yok' : 'No suggestions yet',
    generate: locale === 'tr' ? 'Öneri Oluştur' : 'Generate Suggestion',
    use: locale === 'tr' ? 'Bu içerikle başla' : 'Start with this',
    exploration: locale === 'tr' ? 'Keşif' : 'Exploration',
    platform: locale === 'tr' ? 'Platform' : 'Platform',
    tone: locale === 'tr' ? 'Ton' : 'Tone',
    format: locale === 'tr' ? 'Format' : 'Format',
    reason: locale === 'tr' ? 'Neden?' : 'Why?',
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-6 border border-primary-200">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-6 border border-primary-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary-600 rounded-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h3 className="font-semibold text-gray-900">{labels.title}</h3>
        </div>
        {suggestions.length > 1 && (
          <div className="flex items-center gap-1">
            {suggestions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentIndex ? 'bg-primary-600' : 'bg-primary-300'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      {!currentSuggestion ? (
        <div className="text-center py-6">
          <Lightbulb className="w-10 h-10 text-primary-300 mx-auto mb-3" />
          <p className="text-gray-600 mb-4">{labels.empty}</p>
          {canGenerate && (
            <Button
              onClick={generateSuggestions}
              isLoading={generating}
              className="bg-primary-600 hover:bg-primary-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {labels.generate}
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Hook Idea */}
          <div className="bg-white/80 rounded-lg p-4">
            <p className="text-lg font-medium text-gray-900">
              "{currentSuggestion.hookIdea}"
            </p>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-white rounded-full text-sm font-medium text-gray-700">
              {currentSuggestion.platformLabel}
            </span>
            <span className="px-3 py-1 bg-white rounded-full text-sm font-medium text-gray-700">
              {currentSuggestion.tone}
            </span>
            <span className="px-3 py-1 bg-white rounded-full text-sm font-medium text-gray-700">
              {currentSuggestion.format}
            </span>
            {currentSuggestion.isExploration && (
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                {labels.exploration}
              </span>
            )}
          </div>

          {/* Reason */}
          <div className="text-sm text-gray-600">
            <span className="font-medium">{labels.reason}</span> {currentSuggestion.reason}
          </div>

          {/* CTA */}
          <Button
            onClick={() => handleSuggestionClick(currentSuggestion)}
            className="w-full bg-primary-600 hover:bg-primary-700"
          >
            {labels.use}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}
