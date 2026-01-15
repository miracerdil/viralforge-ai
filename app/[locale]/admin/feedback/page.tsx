'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { MessageSquare, ThumbsUp, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Spinner } from '@/components/ui/spinner';

interface FeedbackItem {
  id: string;
  title: string;
  description: string;
  category: string;
  importance: string;
  status: string;
  vote_count: number;
  admin_response: string | null;
  created_at: string;
  user_id: string;
  profiles?: { email: string };
}

type KanbanColumn = 'new' | 'under_review' | 'planned' | 'in_progress' | 'shipped' | 'rejected';

export default function AdminFeedbackPage() {
  const params = useParams();
  const locale = params.locale as string;
  const supabase = createClient();

  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  const columns: KanbanColumn[] = ['new', 'under_review', 'planned', 'in_progress', 'shipped', 'rejected'];

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    // First get feedback
    const { data: feedbackData, error } = await supabase
      .from('feedback_requests')
      .select('*')
      .order('vote_count', { ascending: false });

    if (error) {
      console.error('Error fetching feedback:', error);
      setLoading(false);
      return;
    }

    // Then get user emails for each feedback
    if (feedbackData && feedbackData.length > 0) {
      const userIds = [...new Set(feedbackData.filter(f => f.user_id).map(f => f.user_id))];

      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, email')
          .in('id', userIds);

        const profileMap = new Map(profilesData?.map(p => [p.id, p.email]) || []);

        const feedbackWithProfiles = feedbackData.map(item => ({
          ...item,
          profiles: item.user_id ? { email: profileMap.get(item.user_id) || null } : null
        }));

        setFeedback(feedbackWithProfiles);
      } else {
        setFeedback(feedbackData);
      }
    } else {
      setFeedback([]);
    }

    setLoading(false);
  };

  const updateStatus = async (feedbackId: string, newStatus: string) => {
    const { error } = await supabase
      .from('feedback_requests')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', feedbackId);

    if (!error) {
      setFeedback((prev) =>
        prev.map((item) => (item.id === feedbackId ? { ...item, status: newStatus } : item))
      );
    }
  };

  const handleDragStart = (feedbackId: string) => {
    setDraggedItem(feedbackId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (status: string) => {
    if (draggedItem) {
      updateStatus(draggedItem, status);
      setDraggedItem(null);
    }
  };

  const deleteFeedback = async (feedbackId: string) => {
    const confirmText = locale === 'tr' ? 'Bu geri bildirimi silmek istediğinize emin misiniz?' : 'Are you sure you want to delete this feedback?';
    if (!confirm(confirmText)) return;

    // Önce feedback_votes'ları sil (foreign key constraint)
    await supabase
      .from('feedback_votes')
      .delete()
      .eq('feedback_id', feedbackId);

    const { error, count } = await supabase
      .from('feedback_requests')
      .delete()
      .eq('id', feedbackId)
      .select();

    console.log('Delete result:', { error, count, feedbackId });

    if (!error) {
      setFeedback((prev) => prev.filter((item) => item.id !== feedbackId));
    } else {
      console.error('Error deleting feedback:', error);
      alert(`Silme hatası: ${error.message} (${error.code})`);
    }
  };

  const t = {
    title: locale === 'tr' ? 'Geri Bildirim Yönetimi' : 'Feedback Management',
    subtitle: locale === 'tr' ? 'Kullanıcı önerilerini yönetin' : 'Manage user suggestions',
    columns: {
      new: locale === 'tr' ? 'Yeni' : 'New',
      under_review: locale === 'tr' ? 'İnceleniyor' : 'Under Review',
      planned: locale === 'tr' ? 'Planlandı' : 'Planned',
      in_progress: locale === 'tr' ? 'Yapılıyor' : 'In Progress',
      shipped: locale === 'tr' ? 'Tamamlandı' : 'Shipped',
      rejected: locale === 'tr' ? 'Reddedildi' : 'Rejected',
    },
    noItems: locale === 'tr' ? 'Öğe yok' : 'No items',
    votes: locale === 'tr' ? 'oy' : 'votes',
  };

  const getColumnColor = (column: KanbanColumn) => {
    switch (column) {
      case 'shipped':
        return 'border-green-300 bg-green-50';
      case 'in_progress':
        return 'border-blue-300 bg-blue-50';
      case 'planned':
        return 'border-purple-300 bg-purple-50';
      case 'under_review':
        return 'border-yellow-300 bg-yellow-50';
      case 'rejected':
        return 'border-red-300 bg-red-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
          <p className="text-gray-500">{t.subtitle}</p>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-6 gap-4 overflow-x-auto pb-4">
        {columns.map((column) => {
          const items = feedback.filter((item) => item.status === column);

          return (
            <div
              key={column}
              className={`min-w-[220px] rounded-lg border-2 ${getColumnColor(column)}`}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(column)}
            >
              {/* Column Header */}
              <div className="p-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900 text-sm">
                    {t.columns[column]}
                  </span>
                  <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full">
                    {items.length}
                  </span>
                </div>
              </div>

              {/* Column Items */}
              <div className="p-2 space-y-2 min-h-[300px]">
                {items.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">
                    {t.noItems}
                  </p>
                ) : (
                  items.map((item) => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={() => handleDragStart(item.id)}
                      className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 cursor-move hover:shadow-md transition-shadow group relative"
                    >
                      {/* Delete button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteFeedback(item.id);
                        }}
                        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        title={locale === 'tr' ? 'Sil' : 'Delete'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <h4 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2 pr-6">
                        {item.title}
                      </h4>
                      <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                        {item.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          {(item.profiles as any)?.email?.split('@')[0] || 'User'}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-amber-600">
                          <ThumbsUp className="w-3 h-3" />
                          {item.vote_count}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
