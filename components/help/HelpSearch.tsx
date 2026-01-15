'use client';

import { useState, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { useDebounce } from '@/lib/hooks/useDebounce';

interface HelpSearchProps {
  locale: string;
  onSearch: (query: string) => void;
  placeholder?: string;
}

export function HelpSearch({ locale, onSearch, placeholder }: HelpSearchProps) {
  const [query, setQuery] = useState('');

  const debouncedSearch = useDebounce((value: string) => {
    onSearch(value);
  }, 300);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  const defaultPlaceholder =
    locale === 'tr' ? 'Yardım makalelerinde ara...' : 'Search help articles...';

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="w-5 h-5 text-gray-400" />
      </div>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder={placeholder || defaultPlaceholder}
        className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
      />
      {query && (
        <button
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-3 flex items-center"
        >
          <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
        </button>
      )}
    </div>
  );
}
