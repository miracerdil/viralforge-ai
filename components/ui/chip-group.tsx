'use client';

import { cn } from '@/lib/utils/cn';

interface ChipOption<T extends string> {
  value: T;
  label: string;
}

interface ChipGroupProps<T extends string> {
  options: ChipOption<T>[];
  value: T | T[] | undefined;
  onChange: (value: T) => void;
  multiple?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md';
  variant?: 'default' | 'outline';
  className?: string;
}

export function ChipGroup<T extends string>({
  options,
  value,
  onChange,
  multiple = false,
  disabled = false,
  size = 'md',
  variant = 'default',
  className,
}: ChipGroupProps<T>) {
  const isSelected = (optionValue: T) => {
    if (multiple && Array.isArray(value)) {
      return value.includes(optionValue);
    }
    return value === optionValue;
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
  };

  return (
    <div className={cn('w-full min-w-0', className)}>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => !disabled && onChange(option.value)}
            disabled={disabled}
            className={cn(
              'rounded-lg border transition-colors max-w-full truncate shrink-0',
              sizeClasses[size],
              isSelected(option.value)
                ? variant === 'outline'
                  ? 'bg-primary-50 text-primary-700 border-primary-500'
                  : 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-gray-700 border-gray-300 hover:border-primary-400',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// Scrollable variant for horizontal scroll on mobile, wrap on desktop
interface ScrollableChipGroupProps<T extends string> extends ChipGroupProps<T> {
  scrollable?: boolean;
}

export function ScrollableChipGroup<T extends string>({
  options,
  value,
  onChange,
  multiple = false,
  disabled = false,
  size = 'md',
  variant = 'default',
  className,
}: ScrollableChipGroupProps<T>) {
  const isSelected = (optionValue: T) => {
    if (multiple && Array.isArray(value)) {
      return value.includes(optionValue);
    }
    return value === optionValue;
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
  };

  return (
    <div className={cn('w-full min-w-0', className)}>
      {/* Mobile: horizontal scroll, Desktop: wrap */}
      <div className="overflow-x-auto md:overflow-visible scrollbar-hide">
        <div className="flex gap-2 md:flex-wrap">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => !disabled && onChange(option.value)}
              disabled={disabled}
              className={cn(
                'rounded-lg border transition-colors shrink-0 md:shrink whitespace-nowrap',
                sizeClasses[size],
                isSelected(option.value)
                  ? variant === 'outline'
                    ? 'bg-primary-50 text-primary-700 border-primary-500'
                    : 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-primary-400',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
