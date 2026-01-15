'use client';

import { useState } from 'react';
import { Trophy, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import type { ABTestResult } from '@/lib/types/database';
import type { Dictionary } from '@/lib/i18n/getDictionary';

interface ABTestFormProps {
  dictionary: Dictionary;
  locale: string;
}

export function ABTestForm({ dictionary, locale }: ABTestFormProps) {
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [type, setType] = useState<'hook' | 'caption' | 'cover'>('hook');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ABTestResult | null>(null);
  const t = dictionary;

  const typeOptions = [
    { value: 'hook', label: t.abtest.typeHook },
    { value: 'caption', label: t.abtest.typeCaption },
    { value: 'cover', label: t.abtest.typeCover },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!optionA.trim() || !optionB.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/abtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          optionA,
          optionB,
          type,
          locale,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'A/B test failed');
      }

      const data = await response.json();
      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t.abtest.title}</CardTitle>
          <CardDescription>{t.abtest.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>
            )}

            <Select
              label={t.abtest.type}
              value={type}
              onChange={(e) => setType(e.target.value as 'hook' | 'caption' | 'cover')}
              options={typeOptions}
            />

            <div className="grid md:grid-cols-2 gap-4">
              <Textarea
                label={t.abtest.optionA}
                value={optionA}
                onChange={(e) => setOptionA(e.target.value)}
                placeholder={t.abtest.optionPlaceholder}
                rows={4}
                required
              />
              <Textarea
                label={t.abtest.optionB}
                value={optionB}
                onChange={(e) => setOptionB(e.target.value)}
                placeholder={t.abtest.optionPlaceholder}
                rows={4}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={!optionA.trim() || !optionB.trim() || loading}
              isLoading={loading}
            >
              {loading ? t.abtest.comparing : t.abtest.compare}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <Card className="border-primary-200 bg-primary-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary-600" />
              {t.abtest.result}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Winner */}
            <div className="flex items-center gap-4">
              <span className="text-gray-600 font-medium">{t.abtest.winner}:</span>
              <span className="text-2xl font-bold text-primary-600">
                {t.abtest.optionA.replace('A', '')} {result.winner}
              </span>
            </div>

            {/* Reasoning */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">{t.abtest.reasoning}</h4>
              <p className="text-gray-700 bg-white rounded-lg p-4 border border-gray-200">
                {result.reasoning}
              </p>
            </div>

            {/* Improvements */}
            {result.improvements.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  {t.abtest.improvements}
                </h4>
                <ul className="space-y-2">
                  {result.improvements.map((improvement, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-gray-700 bg-white rounded-lg p-3 border border-gray-200"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                      <span>{improvement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
