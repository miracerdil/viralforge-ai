'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MessageCircle, ArrowLeft, ThumbsUp, Plus } from 'lucide-react';
import { FeedbackForm } from '@/components/support';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

interface FeedbackItem {
  id: string;
  title: string;
  description: string;
  category: string;
  importance: string;
  status: string;
  vote_count: number;
  has_voted: boolean;
  created_at: string;
}

export default function FeedbackPage() {
  const params = useParams();
  const locale = params.locale as string;

  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      const response = await fetch('/api/support/feedback');
      const data = await response.json();
      setFeedback(data.feedback || []);
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (feedbackId: string) => {
    try {
      const response = await fetch('/api/support/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'vote', feedbackId }),
      });

      const data = await response.json();

      if (data.success) {
        setFeedback((prev) =>
          prev.map((item) =>
            item.id === feedbackId
              ? {
                  ...item,
                  has_voted: data.voted,
                  vote_count: item.vote_count + (data.voted ? 1 : -1),
                }
              : item
          )
        );
      }
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const t = {
    title: locale === 'tr' ? 'Geri Bildirim' : 'Feedback',
    subtitle: locale === 'tr' ? 'Önerilerinizi paylaşın ve başkalarının önerilerine oy verin' : 'Share your suggestions and vote on others',
    back: locale === 'tr' ? 'Yardım Merkezine Dön' : 'Back to Help Center',
    newFeedback: locale === 'tr' ? 'Yeni Öneri' : 'New Suggestion',
    noFeedback: locale === 'tr' ? 'Henüz öneri yok' : 'No suggestions yet',
    statusLabels: {
      new: locale === 'tr' ? 'Yeni' : 'New',
      under_review: locale === 'tr' ? 'İnceleniyor' : 'Under Review',
      planned: locale === 'tr' ? 'Planlandı' : 'Planned',
      in_progress: locale === 'tr' ? 'Yapılıyor' : 'In Progress',
      shipped: locale === 'tr' ? 'Tamamlandı' : 'Shipped',
      rejected: locale === 'tr' ? 'Reddedildi' : 'Rejected',
    },
    categoryLabels: {
      feature: locale === 'tr' ? 'Yeni Özellik' : 'New Feature',
      improvement: locale === 'tr' ? 'İyileştirme' : 'Improvement',
      integration: locale === 'tr' ? 'Entegrasyon' : 'Integration',
      other: locale === 'tr' ? 'Diğer' : 'Other',
    },
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'shipped':
        return 'bg-green-100 text-green-700';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700';
      case 'planned':
        return 'bg-purple-100 text-purple-700';
      case 'under_review':
        return 'bg-yellow-100 text-yellow-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link
          href={`/${locale}/help`}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.back}
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
            </div>
            <p className="text-gray-600">{t.subtitle}</p>
          </div>

          <Button
            variant="primary"
            onClick={() => setShowForm(!showForm)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            {t.newFeedback}
          </Button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
            <FeedbackForm
              locale={locale}
              onSuccess={() => {
                setShowForm(false);
                fetchFeedback();
              }}
            />
          </div>
        )}

        {/* Feedback List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : feedback.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">{t.noFeedback}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {feedback.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-gray-200 p-6"
              >
                <div className="flex items-start gap-4">
                  {/* Vote button */}
                  <button
                    onClick={() => handleVote(item.id)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                      item.has_voted
                        ? 'bg-primary-100 text-primary-600'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <ThumbsUp className={`w-5 h-5 ${item.has_voted ? 'fill-current' : ''}`} />
                    <span className="text-sm font-medium">{item.vote_count}</span>
                  </button>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{item.title}</h3>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                        {t.statusLabels[item.status as keyof typeof t.statusLabels] || item.status}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{item.description}</p>
                    <span className="text-xs text-gray-400">
                      {t.categoryLabels[item.category as keyof typeof t.categoryLabels] || item.category}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
