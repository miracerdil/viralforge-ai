'use client';

import { useState } from 'react';
import { Sparkles, Copy, Check } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface HooksSectionProps {
  hooks: string[];
  title: string;
  copyText: string;
  copiedText: string;
}

export function HooksSection({ hooks, title, copyText, copiedText }: HooksSectionProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (hooks.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary-500" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {hooks.map((hook, index) => (
            <div
              key={index}
              className="flex items-start justify-between gap-3 p-3 bg-primary-50 rounded-lg border border-primary-100"
            >
              <p className="text-gray-700 flex-1">{hook}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(hook, index)}
                className="flex-shrink-0"
              >
                {copiedIndex === index ? (
                  <>
                    <Check className="w-4 h-4 mr-1 text-green-500" />
                    {copiedText}
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1" />
                    {copyText}
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
