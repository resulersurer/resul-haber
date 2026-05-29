'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { 
  FileCode, 
  Wand2, 
  ExternalLink, 
  ArrowLeft, 
  Check, 
  Save, 
  Globe, 
  Image as ImageIcon,
  AlertCircle,
  HelpCircle,
  Eye,
  Edit2
} from 'lucide-react';

interface RawNewsDetail {
  id: string;
  title: string;
  summary: string | null;
  content: string | null;
  imageUrl: string | null;
  externalUrl: string;
  status: 'new' | 'ignored' | 'draft_created' | 'published';
  publishedAt: string | null;
  source: {
    id: string;
    name: string;
    category: string;
    defaultPrompt: string | null;
  };
  draft?: Draft | null;
}

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

export default function RawNewsDetailPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };

  const [item, setItem] = useState<RawNewsDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [prompt, setPrompt] = useState('');
  
  // AI State
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiRejected, setAiRejected] = useState(false);
  const [aiRejectReason, setAiRejectReason] = useState('');

  // Draft Editing State
  const [draft, setDraft] = useState<Draft | null>(null);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [confirmImage, setConfirmImage] = useState(true);

  // Form fields for draft
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

  const loadData = async () => {
    try {
      const res = await fetch(`/api/admin/raw-news/${id}`);
      if (!res.ok) throw new Error('Haber detayı yüklenemedi.');
      const data = await res.json();
      setItem(data);
      
      // Load prompt defaults
      if (data.source?.defaultPrompt) {
        setPrompt(data.source.defaultPrompt);
      } else {
        // Fetch global prompt
        const settingsRes = await fetch('/api/admin/settings');
        if (settingsRes.ok) {
          const settings = await settingsRes.json();
          setPrompt(settings.global_default_prompt);
        }
      }

      // If draft already exists, load draft fields
      if (data.draft) {
        populateDraft(data.draft);
      }
    } catch (e) {
      toast.error('Haber yüklenirken bir hata oluştu.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const populateDraft = (d: Draft) => {
    setDraft(d);
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
    setConfirmImage(!!d.featuredImageUrl);
  };

  const handleLoadDefaultPrompt = async () => {
    try {
      const settingsRes = await fetch('/api/admin/settings');
      if (settingsRes.ok) {
        const settings = await settingsRes.json();
        setPrompt(settings.global_default_prompt);
        toast.success('Küresel varsayılan prompt yüklendi.');
      }
    } catch (e) {
      toast.error('Varsayılan prompt yüklenemedi.');
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setAiRejected(false);
    setAiRejectReason('');

    try {
      const res = await fetch('/api/admin/generate-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawNewsItemId: id,
          prompt,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Taslak üretimi başarısız oldu.');

      if (!data.should_publish) {
        setAiRejected(true);
        setAiRejectReason(data.reason || 'Kriterlere uygun görülmedi.');
        toast.warning('Haber AI tarafından yayınlanmaya uygun görülmedi.');
      } else {
        toast.success('AI Taslağı başarıyla oluşturuldu!');
        populateDraft(data.draft);
        // Refresh item state to update status to 'draft_created'
        loadData();
      }
    } catch (error: any) {
      toast.error(error.message || 'Bir hata oluştu.');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveDraft = async (statusOverride?: 'draft' | 'ready') => {
    if (!draft) return;
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
      status: statusOverride || draft.status,
    };

    try {
      const res = await fetch(`/api/admin/article-drafts/${draft.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Taslak kaydedilemedi.');
      }

      toast.success(statusOverride === 'ready' ? 'Taslak yayına hazır yapıldı!' : 'Taslak başarıyla kaydedildi!');
      const updatedDraft = await res.json();
      populateDraft(updatedDraft);
    } catch (error: any) {
      toast.error(error.message || 'Kaydetme hatası.');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!draft) return;
    
    // First save the current editor edits
    await handleSaveDraft();

    setIsPublishing(true);
    try {
      const res = await fetch(`/api/admin/article-drafts/${draft.id}/publish`, {
        method: 'POST',
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Yayınlama başarısız.');
      }

      toast.success('Makale başarıyla web sitesinde yayınlandı!');
      router.push('/admin/published-articles');
    } catch (error: any) {
      toast.error(error.message || 'Yayınlama sırasında hata.');
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

  if (!item) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-300">Haber bulunamadı.</h2>
        <button onClick={() => router.back()} className="text-emerald-400 mt-4 hover:underline">
          Geri Dön
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top breadcrumb navigation */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
        <button
          onClick={() => router.back()}
          className="flex items-center space-x-2 text-slate-400 hover:text-slate-100 transition-colors text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Ham Haberlere Dön</span>
        </button>
        <span className="text-xs text-slate-500">
          Haber Durumu: <span className="text-slate-300 font-semibold uppercase">{item.status}</span>
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LEFT COLUMN: Raw News Details */}
        <div className="space-y-6 bg-slate-900/10 border border-slate-900 rounded-2xl p-6 h-fit">
          <div>
            <span className="bg-slate-800 text-slate-400 border border-slate-700/40 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded">
              {item.source.category}
            </span>
            <h2 className="text-xl font-bold text-slate-100 mt-3 leading-relaxed">
              {item.title}
            </h2>
            <div className="flex items-center space-x-4 text-xs text-slate-500 mt-2">
              <span>Kaynak: {item.source.name}</span>
              {item.publishedAt && (
                <span>Tarih: {new Date(item.publishedAt).toLocaleString('tr-TR')}</span>
              )}
            </div>
          </div>

          {item.imageUrl && (
            <div className="rounded-xl overflow-hidden border border-slate-800/60 aspect-video relative max-h-60 bg-slate-950">
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {item.summary && (
            <div className="bg-slate-950/40 border border-slate-800/40 rounded-xl p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Haber Özeti</h3>
              <p className="text-slate-300 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: item.summary }} />
            </div>
          )}

          {item.content && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Haber Detayı</h3>
              <div 
                className="text-slate-300 text-sm leading-relaxed space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin"
                dangerouslySetInnerHTML={{ __html: item.content }}
              />
            </div>
          )}

          <div className="pt-4 border-t border-slate-850 flex items-center justify-between">
            <a
              href={item.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 font-semibold"
            >
              <span>Orijinal Kaynağı Görüntüle</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* RIGHT COLUMN: AI Generation and Editor Panel */}
        <div className="space-y-6">
          
          {/* AI Generator Block */}
          {!draft && (
            <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-6 space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                  <Wand2 className="text-emerald-400 w-5 h-5" />
                  AI Analiz Yazısı Üret
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Prompt düzenleyerek haberi Resul Ersürer’in tonunda bir makaleye dönüştürün.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Kullanılacak Prompt
                  </label>
                  <button
                    onClick={handleLoadDefaultPrompt}
                    className="text-[10px] text-slate-400 hover:text-emerald-400 transition-colors"
                  >
                    Varsayılan Promptu Yükle
                  </button>
                </div>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full h-44 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm resize-none"
                  placeholder="Prompt girin..."
                  disabled={isGenerating}
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-emerald-500/10 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center space-x-2 text-sm"
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-slate-955 border-t-transparent rounded-full animate-spin"></div>
                    <span>Makale Taslağı Hazırlanıyor...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    <span>AI ile Taslak Oluştur</span>
                  </>
                )}
              </button>

              {aiRejected && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Yayınlama Kriteri Reddi</h4>
                    <p className="text-slate-350 text-xs mt-1 leading-relaxed">{aiRejectReason}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Draft Inline Editor (Rendered when draft is ready/loaded) */}
          {draft && (
            <div className="bg-slate-900/30 border border-slate-900 rounded-2xl overflow-hidden shadow-xl flex flex-col">
              {/* Tab selector */}
              <div className="bg-slate-900/60 border-b border-slate-850 px-6 py-3 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Düzenleyici & Yayınlama
                </span>
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

              {/* Edit Form Tab */}
              {activeTab === 'edit' ? (
                <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto pr-2 scrollbar-thin">
                  {/* Title */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
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
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
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
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
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
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Makale İçeriği (Markdown)
                    </label>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="w-full h-80 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm font-mono"
                    />
                  </div>

                  {/* Category and Tags */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
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
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        Etiketler (Virgülle ayırın)
                      </label>
                      <input
                        type="text"
                        value={tagsInput}
                        onChange={(e) => setTagsInput(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
                        placeholder="ai, otomasyon, nextjs"
                      />
                    </div>
                  </div>

                  {/* Featured Image Review & Approval */}
                  <div className="border border-slate-800 bg-slate-950/20 rounded-xl p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                        Görsel İncelemesi
                      </span>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="confirmImage"
                          checked={confirmImage}
                          onChange={(e) => setConfirmImage(e.target.checked)}
                          className="rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-emerald-500/50 w-3.5 h-3.5 cursor-pointer"
                        />
                        <label htmlFor="confirmImage" className="text-xs font-semibold text-slate-400 select-none cursor-pointer">
                          Görseli Onayla
                        </label>
                      </div>
                    </div>

                    <div>
                      <input
                        type="url"
                        value={featuredImageUrl}
                        onChange={(e) => setFeaturedImageUrl(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-xs font-mono"
                        placeholder="Görsel URL..."
                      />
                    </div>

                    {confirmImage && featuredImageUrl && (
                      <div className="rounded-lg overflow-hidden border border-slate-850 aspect-video relative max-h-40 bg-slate-950 shadow-inner">
                        <img
                          src={featuredImageUrl}
                          alt="Görsel Önizleme"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>

                  {/* SEO fields */}
                  <div className="border-t border-slate-800/60 pt-4 space-y-4">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      SEO Ayarları
                    </span>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        SEO Başlığı
                      </label>
                      <input
                        type="text"
                        value={seoTitle}
                        onChange={(e) => setSeoTitle(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        SEO Açıklaması
                      </label>
                      <textarea
                        value={seoDescription}
                        onChange={(e) => setSeoDescription(e.target.value)}
                        className="w-full h-20 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm resize-none"
                      />
                    </div>
                  </div>

                  {/* Source metadata details */}
                  <div className="border-t border-slate-800/60 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        Kaynak Adı
                      </label>
                      <input
                        type="text"
                        value={sourceName}
                        onChange={(e) => setSourceName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-350 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        Kaynak Bağlantısı (URL)
                      </label>
                      <input
                        type="url"
                        value={sourceUrl}
                        onChange={(e) => setSourceUrl(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-350 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Safe Markdown Preview Tab */
                <div className="p-6 max-h-[70vh] overflow-y-auto pr-2 scrollbar-thin bg-slate-950/30">
                  <div className="prose prose-invert max-w-none text-slate-300 text-sm space-y-4">
                    <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
                      {content}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

              {/* Action Buttons Footer */}
              <div className="p-6 border-t border-slate-850 bg-slate-950/50 flex flex-wrap gap-3 items-center justify-between">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleSaveDraft('draft')}
                    disabled={isSaving}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-4 py-2.5 rounded-xl transition-all text-xs flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Taslak Kaydet</span>
                  </button>
                  <button
                    onClick={() => handleSaveDraft('ready')}
                    disabled={isSaving}
                    className="bg-slate-800/80 hover:bg-blue-900/20 text-blue-400 hover:text-blue-300 font-semibold px-4 py-2.5 rounded-xl transition-all text-xs border border-transparent hover:border-blue-500/25 flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Yayına Hazır</span>
                  </button>
                </div>
                
                <button
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-955 font-bold px-6 py-2.5 rounded-xl transition-all text-xs shadow-lg shadow-emerald-500/10 flex items-center space-x-1.5 cursor-pointer"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Yayınla</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
