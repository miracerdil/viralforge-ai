export function formatDistanceToNow(date: Date, locale: string): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  const intervals = {
    tr: {
      year: 'yıl',
      month: 'ay',
      week: 'hafta',
      day: 'gün',
      hour: 'saat',
      minute: 'dakika',
      second: 'saniye',
      ago: 'önce',
      justNow: 'az önce',
    },
    en: {
      year: 'year',
      month: 'month',
      week: 'week',
      day: 'day',
      hour: 'hour',
      minute: 'minute',
      second: 'second',
      ago: 'ago',
      justNow: 'just now',
    },
  };

  const t = intervals[locale as keyof typeof intervals] || intervals.en;

  if (diffInSeconds < 30) {
    return t.justNow;
  }

  const units = [
    { name: t.year, seconds: 31536000 },
    { name: t.month, seconds: 2592000 },
    { name: t.week, seconds: 604800 },
    { name: t.day, seconds: 86400 },
    { name: t.hour, seconds: 3600 },
    { name: t.minute, seconds: 60 },
    { name: t.second, seconds: 1 },
  ];

  for (const unit of units) {
    const interval = Math.floor(diffInSeconds / unit.seconds);
    if (interval >= 1) {
      const plural = interval > 1 && locale === 'en' ? 's' : '';
      return `${interval} ${unit.name}${plural} ${t.ago}`;
    }
  }

  return t.justNow;
}

export function formatDate(date: Date, locale: string): string {
  return date.toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
