'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { HelpCircle, Plus, Edit, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';

interface HelpArticle {
  id: string;
  category: string;
  slug: string;
  title_tr: string;
  title_en: string;
  content_md_tr: string;
  content_md_en: string;
  is_published: boolean;
  is_featured: boolean;
  view_count: number;
  helpful_count: number;
  sort_order: number;
}

interface HelpCategory {
  id: string;
  name_tr: string;
  name_en: string;
}

export default function AdminHelpPage() {
  const params = useParams();
  const locale = params.locale as string;
  const supabase = createClient();

  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [categories, setCategories] = useState<HelpCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingArticle, setEditingArticle] = useState<HelpArticle | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    category: '',
    slug: '',
    title_tr: '',
    title_en: '',
    content_md_tr: '',
    content_md_en: '',
    is_published: false,
    is_featured: false,
    sort_order: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [articlesRes, categoriesRes] = await Promise.all([
      supabase.from('help_articles').select('*').order('sort_order'),
      supabase.from('help_categories').select('*').order('sort_order'),
    ]);

    setArticles(articlesRes.data || []);
    setCategories(categoriesRes.data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingArticle) {
        // Update
        const { error } = await supabase
          .from('help_articles')
          .update({ ...formData, updated_at: new Date().toISOString() })
          .eq('id', editingArticle.id);

        if (!error) {
          setArticles((prev) =>
            prev.map((a) => (a.id === editingArticle.id ? { ...a, ...formData } : a))
          );
        }
      } else {
        // Create
        const { data, error } = await supabase
          .from('help_articles')
          .insert(formData)
          .select()
          .single();

        if (!error && data) {
          setArticles((prev) => [...prev, data]);
        }
      }

      setShowForm(false);
      setEditingArticle(null);
      resetForm();
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (article: HelpArticle) => {
    setEditingArticle(article);
    setFormData({
      category: article.category,
      slug: article.slug,
      title_tr: article.title_tr,
      title_en: article.title_en,
      content_md_tr: article.content_md_tr,
      content_md_en: article.content_md_en,
      is_published: article.is_published,
      is_featured: article.is_featured,
      sort_order: article.sort_order,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(locale === 'tr' ? 'Bu makaleyi silmek istediğinize emin misiniz?' : 'Are you sure you want to delete this article?')) {
      return;
    }

    const { error } = await supabase.from('help_articles').delete().eq('id', id);
    if (!error) {
      setArticles((prev) => prev.filter((a) => a.id !== id));
    }
  };

  const togglePublish = async (article: HelpArticle) => {
    const { error } = await supabase
      .from('help_articles')
      .update({ is_published: !article.is_published })
      .eq('id', article.id);

    if (!error) {
      setArticles((prev) =>
        prev.map((a) => (a.id === article.id ? { ...a, is_published: !a.is_published } : a))
      );
    }
  };

  const resetForm = () => {
    setFormData({
      category: '',
      slug: '',
      title_tr: '',
      title_en: '',
      content_md_tr: '',
      content_md_en: '',
      is_published: false,
      is_featured: false,
      sort_order: 0,
    });
  };

  const t = {
    title: locale === 'tr' ? 'Yardım Merkezi Yönetimi' : 'Help Center Management',
    subtitle: locale === 'tr' ? 'FAQ makalelerini yönetin' : 'Manage FAQ articles',
    addNew: locale === 'tr' ? 'Yeni Makale' : 'New Article',
    edit: locale === 'tr' ? 'Düzenle' : 'Edit',
    cancel: locale === 'tr' ? 'İptal' : 'Cancel',
    save: locale === 'tr' ? 'Kaydet' : 'Save',
    saving: locale === 'tr' ? 'Kaydediliyor...' : 'Saving...',
    noArticles: locale === 'tr' ? 'Makale yok' : 'No articles',
    form: {
      category: locale === 'tr' ? 'Kategori' : 'Category',
      slug: 'Slug',
      titleTr: locale === 'tr' ? 'Başlık (TR)' : 'Title (TR)',
      titleEn: locale === 'tr' ? 'Başlık (EN)' : 'Title (EN)',
      contentTr: locale === 'tr' ? 'İçerik (TR)' : 'Content (TR)',
      contentEn: locale === 'tr' ? 'İçerik (EN)' : 'Content (EN)',
      published: locale === 'tr' ? 'Yayınlandı' : 'Published',
      featured: locale === 'tr' ? 'Öne Çıkan' : 'Featured',
      sortOrder: locale === 'tr' ? 'Sıra' : 'Sort Order',
    },
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <HelpCircle className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
            <p className="text-gray-500">{t.subtitle}</p>
          </div>
        </div>

        <Button
          variant="primary"
          onClick={() => {
            setEditingArticle(null);
            resetForm();
            setShowForm(true);
          }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          {t.addNew}
        </Button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <h2 className="text-xl font-semibold">
                {editingArticle ? t.edit : t.addNew}
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t.form.category}</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  >
                    <option value="">Select...</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {locale === 'tr' ? cat.name_tr : cat.name_en}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t.form.slug}</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t.form.titleTr}</label>
                  <input
                    type="text"
                    value={formData.title_tr}
                    onChange={(e) => setFormData({ ...formData, title_tr: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t.form.titleEn}</label>
                  <input
                    type="text"
                    value={formData.title_en}
                    onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{t.form.contentTr}</label>
                <textarea
                  value={formData.content_md_tr}
                  onChange={(e) => setFormData({ ...formData, content_md_tr: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg h-32"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{t.form.contentEn}</label>
                <textarea
                  value={formData.content_md_en}
                  onChange={(e) => setFormData({ ...formData, content_md_en: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg h-32"
                  required
                />
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_published}
                    onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                  />
                  {t.form.published}
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  />
                  {t.form.featured}
                </label>
                <div className="flex items-center gap-2">
                  <label>{t.form.sortOrder}</label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                    className="w-20 px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  {t.cancel}
                </Button>
                <Button type="submit" variant="primary" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      {t.saving}
                    </>
                  ) : (
                    t.save
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Articles List */}
      {articles.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">{t.noArticles}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {locale === 'tr' ? 'Başlık' : 'Title'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {locale === 'tr' ? 'Kategori' : 'Category'}
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  {locale === 'tr' ? 'Görüntüleme' : 'Views'}
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  {locale === 'tr' ? 'Durum' : 'Status'}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  {locale === 'tr' ? 'İşlemler' : 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {articles.map((article) => (
                <tr key={article.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-900">
                      {locale === 'tr' ? article.title_tr : article.title_en}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{article.category}</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-500">{article.view_count}</td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => togglePublish(article)}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        article.is_published
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {article.is_published ? (
                        <>
                          <Eye className="w-3 h-3" />
                          {locale === 'tr' ? 'Yayında' : 'Published'}
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3" />
                          {locale === 'tr' ? 'Taslak' : 'Draft'}
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(article)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(article.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
