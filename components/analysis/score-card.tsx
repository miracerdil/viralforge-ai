import { cn } from '@/lib/utils/cn';

interface ScoreCardProps {
  label: string;
  value: number;
  maxValue?: number;
  color?: 'primary' | 'green' | 'yellow' | 'red';
}

export function ScoreCard({ label, value, maxValue = 100, color = 'primary' }: ScoreCardProps) {
  const percentage = (value / maxValue) * 100;

  const getColor = () => {
    if (color !== 'primary') {
      const colors = {
        green: 'bg-green-500',
        yellow: 'bg-yellow-500',
        red: 'bg-red-500',
      };
      return colors[color];
    }

    if (percentage >= 70) return 'bg-green-500';
    if (percentage >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getTextColor = () => {
    if (color !== 'primary') {
      const colors = {
        green: 'text-green-600',
        yellow: 'text-yellow-600',
        red: 'text-red-600',
      };
      return colors[color];
    }

    if (percentage >= 70) return 'text-green-600';
    if (percentage >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-sm text-gray-500 mb-2">{label}</p>
      <div className="flex items-end gap-2">
        <span className={cn('text-3xl font-bold', getTextColor())}>{value}</span>
        <span className="text-sm text-gray-400 mb-1">/ {maxValue}</span>
      </div>
      <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', getColor())}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
