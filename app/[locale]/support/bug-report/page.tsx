'use client';

import { useParams, useRouter } from 'next/navigation';
import { Bug, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { BugReportForm } from '@/components/support';

export default function BugReportPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;

  const t = {
    title: locale === 'tr' ? 'Hata Bildir' : 'Report a Bug',
    subtitle: locale === 'tr' ? 'Karşılaştığınız sorunu bize bildirin' : 'Let us know about any issues you encounter',
    back: locale === 'tr' ? 'Yardım Merkezine Dön' : 'Back to Help Center',
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link
          href={`/${locale}/help`}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.back}
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Bug className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
          <p className="text-gray-600 mt-1">{t.subtitle}</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8">
          <BugReportForm
            locale={locale}
            onSuccess={() => {
              // Optionally redirect after success
            }}
          />
        </div>
      </div>
    </div>
  );
}
