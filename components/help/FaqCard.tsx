'use client';

import { useState } from 'react';
import { ChevronDown, ThumbsUp } from 'lucide-react';

interface FaqCardProps {
  id: string;
  title: string;
  content: string;
  locale: string;
  isExpanded?: boolean;
  onHelpful?: (id: string) => void;
}

export function FaqCard({
  id,
  title,
  content,
  locale,
  isExpanded: defaultExpanded = false,
  onHelpful,
}: FaqCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [markedHelpful, setMarkedHelpful] = useState(false);

  const handleHelpful = () => {
    if (markedHelpful) return;
    setMarkedHelpful(true);
    onHelpful?.(id);
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium text-gray-900 pr-4">{title}</span>
        <ChevronDown
          className={`w-5 h-5 text-gray-500 shrink-0 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <div
            className="prose prose-sm max-w-none pt-4 text-gray-600"
            dangerouslySetInnerHTML={{ __html: content }}
          />

          {/* Helpful feedback */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              {locale === 'tr' ? 'Bu yardımcı oldu mu?' : 'Was this helpful?'}
            </span>
            <button
              onClick={handleHelpful}
              disabled={markedHelpful}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                markedHelpful
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <ThumbsUp className="w-4 h-4" />
              {markedHelpful
                ? locale === 'tr'
                  ? 'Teşekkürler!'
                  : 'Thanks!'
                : locale === 'tr'
                ? 'Evet'
                : 'Yes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
