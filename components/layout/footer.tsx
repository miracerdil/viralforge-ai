'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Zap, Bug, Lightbulb, X } from 'lucide-react';
import { BugReportForm } from '@/components/support/BugReportForm';
import { FeedbackForm } from '@/components/support/FeedbackForm';
import type { Dictionary } from '@/lib/i18n/getDictionary';

interface FooterProps {
  dictionary: Dictionary;
  locale: string;
}

export function Footer({ dictionary, locale }: FooterProps) {
  const t = dictionary;
  const currentYear = new Date().getFullYear();
  const [showBugModal, setShowBugModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const supportText = {
    bugReport: locale === 'tr' ? 'Hata Bildir' : 'Report Bug',
    feedback: locale === 'tr' ? 'Öneri Gönder' : 'Send Feedback',
  };

  return (
    <>
      <footer className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            {/* Logo and Copyright */}
            <div className="flex flex-col items-center md:items-start gap-2">
              <Link href={`/${locale}`} className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg text-gray-900">{t.common.appName}</span>
              </Link>
              <p className="text-sm text-gray-500">
                &copy; {currentYear} {t.common.appName}. {t.footer.rights}
              </p>
            </div>

            {/* Support Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowBugModal(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Bug className="w-4 h-4" />
                {supportText.bugReport}
              </button>
              <button
                onClick={() => setShowFeedbackModal(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
              >
                <Lightbulb className="w-4 h-4" />
                {supportText.feedback}
              </button>
            </div>

            {/* Links */}
            <div className="flex items-center gap-6">
              <Link
                href={`/${locale}/pricing`}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                {t.nav.pricing}
              </Link>
              <Link
                href="#"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                {t.footer.privacy}
              </Link>
              <Link
                href="#"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                {t.footer.terms}
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Bug Report Modal */}
      {showBugModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowBugModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <Bug className="w-5 h-5 text-red-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {locale === 'tr' ? 'Hata Bildir' : 'Report a Bug'}
                </h2>
              </div>
              <button
                onClick={() => setShowBugModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <BugReportForm
                locale={locale}
                onSuccess={() => setTimeout(() => setShowBugModal(false), 2000)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowFeedbackModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Lightbulb className="w-5 h-5 text-amber-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {locale === 'tr' ? 'Öneri Gönder' : 'Send Feedback'}
                </h2>
              </div>
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <FeedbackForm
                locale={locale}
                onSuccess={() => setTimeout(() => setShowFeedbackModal(false), 2000)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
