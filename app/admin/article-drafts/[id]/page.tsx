'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { 
  FileText, 
  ArrowLeft, 
  Check, 
  Save, 
  Globe, 
  Image as ImageIcon,
  AlertCircle,
  Eye,
  Edit2
} from 'lucide-react';

interface Draft {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  featuredImageUrl: string | null;
  sourceName: string;
  sourceUrl: string;
  status: 'draft' | 'ready' | 'published';
}

export default function ArticleDraftEditorPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  
  // Submit loadings
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [confirmImage, setConfirmImage] = useState(true);

  // Form Fields
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [featuredImageUrl, setFeaturedImageUrl] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [draftStatus, setDraftStatus] = useState<'draft' | 'ready' | 'published'>('draft');

  const fetchDraftDetails = async () => {
    try {
      const res = await fetch(`/api/admin/article-drafts/${id}`);
      if (!res.ok) throw new Error('Taslak detayı yüklenemedi.');
      const d: Draft = await res.json();
      
      setTitle(d.title);
      setSlug(d.slug);
      setExcerpt(d.excerpt);
      setContent(d.content);
      setCategory(d.category);
      setTagsInput(d.tags.join(', '));
      setSeoTitle(d.seoTitle);
      setSeoDescription(d.seoDescription);
      setFeaturedImageUrl(d.featuredImageUrl || '');
      setSourceName(d.sourceName);
      setSourceUrl(d.sourceUrl);
      setDraftStatus(d.status);
      setConfirmImage(!!d.featuredImageUrl);
    } catch (e) {
      toast.error('Taslak yüklenirken hata oluştu.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDraftDetails();
  }, [id]);

  const handleSave = async (statusOverride?: 'draft' | 'ready') => {
    setIsSaving(true);
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const payload = {
      title,
      slug,
      excerpt,
      content,
      category,
      tags,
      seoTitle,
      seoDescription,
      featuredImageUrl: confirmImage ? (featuredImageUrl || null) : null,
      sourceName,
      sourceUrl,
      status: statusOverride || draftStatus,
    };

    try {
      const res = await fetch(`/api/admin/article-drafts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Kaydetme başarısız.');
      }

      toast.success(statusOverride === 'ready' ? 'Taslak yayına hazır yapıldı!' : 'Değişiklikler kaydedildi.');
      const updated: Draft = await res.json();
      setDraftStatus(updated.status);
    } catch (error: any) {
      toast.error(error.message || 'Hata oluştu.');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    // Save draft first
    await handleSave();

    setIsPublishing(true);
    try {
      const res = await fetch(`/api/admin/article-drafts/${id}/publish`, {
        method: 'POST',
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Yayınlama başarısız.');
      }

      toast.success('Makale başarıyla web sitesinde yayınlandı!');
      router.push('/admin/published-articles');
    } catch (error: any) {
      toast.error(error.message || 'Yayınlama hatası.');
      console.error(error);
    } finally {
      setIsPublishing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-40">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
        <button
          onClick={() => router.push('/admin/article-drafts')}
          className="flex items-center space-x-2 text-slate-400 hover:text-slate-100 transition-colors text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Taslaklara Geri Dön</span>
        </button>
        <span className="text-xs text-slate-500">
          Taslak Durumu: <span className="text-slate-350 font-bold uppercase">{draftStatus}</span>
        </span>
      </div>

      {/* Editor Panel Card */}
      <div className="bg-slate-900/20 border border-slate-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Editor Tabs */}
        <div className="bg-slate-900/60 border-b border-slate-850 px-6 py-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-200 flex items-center gap-2">
            <FileText className="text-emerald-400 w-5 h-5" />
            Makale Düzenle
          </h2>
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab('edit')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'edit'
                  ? 'bg-slate-800 text-emerald-400 shadow-inner'
                  : 'text-slate-500 hover:text-slate-200'
              }`}
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Düzenle</span>
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'preview'
                  ? 'bg-slate-800 text-emerald-400 shadow-inner'
                  : 'text-slate-500 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Önizle</span>
            </button>
          </div>
        </div>

        {activeTab === 'edit' ? (
          <div className="p-6 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Makale Başlığı
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                URL (Slug)
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-xs font-mono"
              />
            </div>

            {/* Excerpt */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Özet (Excerpt)
              </label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                className="w-full h-20 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm resize-none"
              />
            </div>

            {/* Content Body Markdown */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Makale İçeriği (Markdown)
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-[32rem] bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm font-mono"
              />
            </div>

            {/* Category & Tags */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Kategori
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Etiketler (Virgülle ayırın)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
                  placeholder="ai, otomasyon, saas"
                />
              </div>
            </div>

            {/* Featured Image Review & Approval */}
            <div className="border border-slate-800 bg-slate-950/20 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-slate-400" />
                  Görsel İncelemesi
                </span>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="confirmImage"
                    checked={confirmImage}
                    onChange={(e) => setConfirmImage(e.target.checked)}
                    className="rounded bg-slate-955 border-slate-800 text-emerald-500 focus:ring-emerald-500/50 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="confirmImage" className="text-xs font-semibold text-slate-400 select-none cursor-pointer">
                    Görseli Onayla ve Öne Çıkar
                  </label>
                </div>
              </div>

              <div>
                <input
                  type="url"
                  value={featuredImageUrl}
                  onChange={(e) => setFeaturedImageUrl(e.target.value)}
                  className="w-full bg-slate-955 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-xs font-mono"
                  placeholder="Görsel URL..."
                />
              </div>

              {confirmImage && featuredImageUrl && (
                <div className="rounded-xl overflow-hidden border border-slate-850 aspect-video relative max-h-56 bg-slate-950 shadow-xl">
                  <img
                    src={featuredImageUrl}
                    alt="Öne Çıkan Görsel"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>

            {/* SEO Settings */}
            <div className="border-t border-slate-800/60 pt-6 space-y-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                SEO Ayarları
              </span>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  SEO Başlığı
                </label>
                <input
                  type="text"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  className="w-full bg-slate-955 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  SEO Açıklaması
                </label>
                <textarea
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  className="w-full h-20 bg-slate-955 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm resize-none"
                />
              </div>
            </div>

            {/* Source Origin */}
            <div className="border-t border-slate-800/60 pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Kaynak Adı
                </label>
                <input
                  type="text"
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  className="w-full bg-slate-955 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-350 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Kaynak Bağlantısı (URL)
                </label>
                <input
                  type="url"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  className="w-full bg-slate-955 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-350 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-xs font-mono"
                />
              </div>
            </div>
          </div>
        ) : (
          /* Safe preview using rehype-sanitize */
          <div className="p-8 bg-slate-950/20 max-h-[75vh] overflow-y-auto pr-2 scrollbar-thin">
            <div className="prose prose-invert max-w-none text-slate-200 space-y-4">
              <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
                {content}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {/* Footer buttons */}
        <div className="p-6 border-t border-slate-850 bg-slate-950/60 flex flex-wrap gap-3 items-center justify-between">
          <div className="flex space-x-2">
            <button
              onClick={() => handleSave('draft')}
              disabled={isSaving}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-5 py-2.5 rounded-xl transition-all text-xs flex items-center space-x-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Kaydet</span>
            </button>
            <button
              onClick={() => handleSave('ready')}
              disabled={isSaving}
              className="bg-slate-805 hover:bg-blue-900/20 text-blue-400 hover:text-blue-300 font-semibold px-5 py-2.5 rounded-xl transition-all text-xs border border-transparent hover:border-blue-500/25 flex items-center space-x-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Yayına Hazır Yap</span>
            </button>
          </div>

          {draftStatus !== 'published' && (
            <button
              onClick={handlePublish}
              disabled={isPublishing}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-955 font-bold px-6 py-2.5 rounded-xl transition-all text-xs shadow-lg shadow-emerald-500/10 flex items-center space-x-1.5 cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Yayınla</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
