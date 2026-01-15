'use client';

import { useState } from 'react';
import { Download, FileJson, FileSpreadsheet, Loader2 } from 'lucide-react';

interface ExportButtonProps {
  type: 'hooks' | 'analyses' | 'planners' | 'ab_tests';
  locale: string;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md';
}

export function ExportButton({
  type,
  locale,
  disabled = false,
  variant = 'outline',
  size = 'sm',
}: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState<'json' | 'csv' | null>(null);

  const labels = {
    button: locale === 'tr' ? 'Dışa Aktar' : 'Export',
    json: 'JSON',
    csv: 'CSV',
    exporting: locale === 'tr' ? 'İndiriliyor...' : 'Downloading...',
  };

  const handleExport = async (format: 'json' | 'csv') => {
    setIsLoading(format);
    try {
      const response = await fetch(`/api/export?type=${type}&format=${format}`);

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition?.split('filename="')[1]?.replace('"', '') ||
        `export-${type}.${format}`;

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setIsOpen(false);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsLoading(null);
    }
  };

  const baseClasses = 'relative inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

  const variantClasses = {
    default: 'bg-purple-600 text-white hover:bg-purple-700',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
    ghost: 'text-gray-700 hover:bg-gray-100',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm rounded-md gap-1.5',
    md: 'px-4 py-2 text-base rounded-lg gap-2',
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || isLoading !== null}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        <span>{isLoading ? labels.exporting : labels.button}</span>
      </button>

      {isOpen && !isLoading && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
            <button
              onClick={() => handleExport('json')}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <FileJson className="w-4 h-4 text-blue-500" />
              <span>{labels.json}</span>
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-100"
            >
              <FileSpreadsheet className="w-4 h-4 text-green-500" />
              <span>{labels.csv}</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
