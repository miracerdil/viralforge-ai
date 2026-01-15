'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const params = useParams();
  const locale = params.locale as string;
  const isTurkish = locale === 'tr';

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {isTurkish ? 'Bir hata oluştu' : 'Something went wrong'}
        </h2>
        <p className="text-gray-600 mb-6">
          {isTurkish ? 'Beklenmeyen bir hata meydana geldi.' : 'An unexpected error occurred.'}
        </p>
        <Button onClick={() => reset()}>
          {isTurkish ? 'Tekrar Dene' : 'Try Again'}
        </Button>
      </div>
    </div>
  );
}
