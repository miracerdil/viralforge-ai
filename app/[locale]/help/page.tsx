'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { HelpCircle, MessageCircle, Bug, ArrowRight } from 'lucide-react';
import { FaqCard, HelpSearch, CategoryFilter } from '@/components/help';
import { Spinner } from '@/components/ui/spinner';

interface HelpCategory {
  id: string;
  name_tr: string;
  name_en: string;
  description_tr: string;
  description_en: string;
  icon: string;
}

interface HelpArticle {
  id: string;
  category: string;
  slug: string;
  title_tr: string;
  title_en: string;
  content_md_tr: string;
  content_md_en: string;
  is_featured: boolean;
}

export default function HelpPage() {
  const params = useParams();
  const locale = params.locale as string;

  const [categories, setCategories] = useState<HelpCategory[]>([]);
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHelp();
  }, [selectedCategory, searchQuery, locale]);

  const fetchHelp = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ locale });
      if (selectedCategory) params.set('category', selectedCategory);
      if (searchQuery) params.set('q', searchQuery);

      const response = await fetch(`/api/help?${params}`);
      const data = await response.json();

      setCategories(data.categories || []);
      setArticles(data.articles || []);
    } catch (error) {
      console.error('Error fetching help:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleHelpful = async (articleId: string) => {
    try {
      await fetch('/api/help', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId, action: 'helpful' }),
      });
    } catch (error) {
      console.error('Error marking helpful:', error);
    }
  };

  const t = {
    title: locale === 'tr' ? 'Yardım Merkezi' : 'Help Center',
    subtitle: locale === 'tr' ? 'Size nasıl yardımcı olabiliriz?' : 'How can we help you?',
    searchPlaceholder: locale === 'tr' ? 'Soru veya konu ara...' : 'Search for a question or topic...',
    noResults: locale === 'tr' ? 'Sonuç bulunamadı' : 'No results found',
    contactSupport: locale === 'tr' ? 'Destek İletişimi' : 'Contact Support',
    bugReport: locale === 'tr' ? 'Hata Bildir' : 'Report a Bug',
    feedback: locale === 'tr' ? 'Geri Bildirim' : 'Feedback',
    stillNeedHelp: locale === 'tr' ? 'Hala yardıma mı ihtiyacınız var?' : 'Still need help?',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary-600 to-primary-700 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <HelpCircle className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold mb-2">{t.title}</h1>
          <p className="text-primary-100 mb-8">{t.subtitle}</p>

          <div className="max-w-xl mx-auto">
            <HelpSearch
              locale={locale}
              onSearch={setSearchQuery}
              placeholder={t.searchPlaceholder}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Category Filter */}
        <div className="mb-8">
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            locale={locale}
          />
        </div>

        {/* Articles */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-12">
            <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">{t.noResults}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {articles.map((article) => (
              <FaqCard
                key={article.id}
                id={article.id}
                title={locale === 'tr' ? article.title_tr : article.title_en}
                content={locale === 'tr' ? article.content_md_tr : article.content_md_en}
                locale={locale}
                onHelpful={handleHelpful}
              />
            ))}
          </div>
        )}

        {/* Contact Support Section */}
        <div className="mt-16 p-8 bg-white rounded-xl border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t.stillNeedHelp}</h2>
          <p className="text-gray-600 mb-6">
            {locale === 'tr'
              ? 'Sorularınız için bize ulaşın veya hata bildirin.'
              : 'Reach out to us with your questions or report issues.'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href={`/${locale}/support/bug-report`}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <Bug className="w-5 h-5 text-red-600" />
                </div>
                <span className="font-medium text-gray-900">{t.bugReport}</span>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href={`/${locale}/support/feedback`}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-blue-600" />
                </div>
                <span className="font-medium text-gray-900">{t.feedback}</span>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
