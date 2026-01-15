'use client';

import { useState } from 'react';
import { MessageSquare, Copy, Check, Image, Type } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface CaptionsSectionProps {
  captions: string[];
  title: string;
  copyText: string;
  copiedText: string;
}

export function CaptionsSection({ captions, title, copyText, copiedText }: CaptionsSectionProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (captions.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary-500" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {captions.map((caption, index) => (
            <div
              key={index}
              className="flex items-start justify-between gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100"
            >
              <p className="text-gray-700 flex-1">{caption}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(caption, index)}
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

interface TextSectionProps {
  items: string[];
  title: string;
  icon: 'text' | 'image';
  copyText: string;
  copiedText: string;
}

export function TextSection({ items, title, icon, copyText, copiedText }: TextSectionProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (items.length === 0) return null;

  const Icon = icon === 'image' ? Image : Type;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-primary-500" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex items-start justify-between gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100"
            >
              <p className="text-gray-700 flex-1">{item}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(item, index)}
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
