'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  Rss, 
  Plus, 
  Trash2, 
  Edit3, 
  RefreshCw, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Play
} from 'lucide-react';

interface NewsSource {
  id: string;
  name: string;
  type: 'rss' | 'api';
  url: string;
  category: string;
  isActive: boolean;
  defaultPrompt: string | null;
  fetchIntervalMinutes: number;
  lastFetchedAt: string | null;
  lastFetchStatus: 'success' | 'error' | null;
  lastFetchError: string | null;
}

export default function NewsSourcesPage() {
  const [sources, setSources] = useState<NewsSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [isFetchingId, setIsFetchingId] = useState<string | null>(null);

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [editingSource, setEditingSource] = useState<NewsSource | null>(null);
  
  const [name, setName] = useState('');
  const [type, setType] = useState<'rss' | 'api'>('rss');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [defaultPrompt, setDefaultPrompt] = useState('');
  const [fetchIntervalMinutes, setFetchIntervalMinutes] = useState(60);

  const fetchSources = async () => {
    try {
      const res = await fetch('/api/admin/news-sources');
      if (!res.ok) throw new Error('Kaynaklar yüklenemedi.');
      const data = await res.json();
      setSources(data);
    } catch (error) {
      toast.error('Haber kaynakları yüklenirken hata oluştu.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  const resetForm = () => {
    setName('');
    setType('rss');
    setUrl('');
    setCategory('');
    setIsActive(true);
    setDefaultPrompt('');
    setFetchIntervalMinutes(60);
    setEditingSource(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEditModal = (source: NewsSource) => {
    setEditingSource(source);
    setName(source.name);
    setType(source.type);
    setUrl(source.url);
    setCategory(source.category);
    setIsActive(source.isActive);
    setDefaultPrompt(source.defaultPrompt || '');
    setFetchIntervalMinutes(source.fetchIntervalMinutes);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !url || !category) {
      toast.error('Lütfen tüm zorunlu alanları doldurun.');
      return;
    }

    setIsSubmitLoading(true);
    const payload = {
      name,
      type,
      url,
      category,
      isActive,
      defaultPrompt: defaultPrompt || null,
      fetchIntervalMinutes: Number(fetchIntervalMinutes),
    };

    try {
      let res;
      if (editingSource) {
        res = await fetch(`/api/admin/news-sources/${editingSource.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/admin/news-sources', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) throw new Error('Kayıt başarısız.');
      
      toast.success(editingSource ? 'Kaynak güncellendi!' : 'Yeni kaynak eklendi!');
      setShowModal(false);
      resetForm();
      fetchSources();
    } catch (error) {
      toast.error('İşlem sırasında hata oluştu.');
      console.error(error);
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu kaynağı silmek istediğinize emin misiniz? Tüm ilişkili ham haberler de silinecektir.')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/news-sources/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Silme işlemi başarısız.');
      toast.success('Kaynak silindi.');
      fetchSources();
    } catch (error) {
      toast.error('Kaynak silinirken hata oluştu.');
      console.error(error);
    }
  };

  const handleToggleActive = async (source: NewsSource) => {
    try {
      const res = await fetch(`/api/admin/news-sources/${source.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !source.isActive }),
      });
      if (!res.ok) throw new Error('Güncelleme başarısız.');
      toast.success(source.isActive ? 'Kaynak devre dışı bırakıldı.' : 'Kaynak etkinleştirildi.');
      fetchSources();
    } catch (error) {
      toast.error('Durum güncellenirken hata oluştu.');
      console.error(error);
    }
  };

  const handleFetchSource = async (id: string) => {
    setIsFetchingId(id);
    toast.info('Haberler çekiliyor, lütfen bekleyin...');
    try {
      const res = await fetch(`/api/admin/fetch-source/${id}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Çekme başarısız.');
      toast.success(`Haberler başarıyla çekildi! Eklenen yeni haber: ${data.addedCount || 0}`);
      fetchSources();
    } catch (error: any) {
      toast.error(`Haber çekme hatası: ${error.message || 'Bilinmeyen hata'}`);
      fetchSources();
    } finally {
      setIsFetchingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-3">
            <Rss className="text-emerald-400 w-8 h-8" />
            Haber Kaynakları
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            RSS veya REST API haber akışlarını yönetin, aktiflik durumlarını ve sağlık kayıtlarını inceleyin.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-4 py-2.5 rounded-xl transition-all text-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Kaynak Ekle</span>
        </button>
      </div>

      {/* Main List Table */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : sources.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/10 border border-slate-900 rounded-2xl">
          <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-slate-400 font-medium">Kayıtlı haber kaynağı bulunmuyor.</h3>
          <p className="text-slate-500 text-xs mt-1">
            Sağ üstteki butona tıklayarak ilk haber kaynağınızı ekleyebilirsiniz.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900/20 border border-slate-900 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="p-4 pl-6">Kaynak Bilgisi</th>
                  <th className="p-4">Kategori / Tip</th>
                  <th className="p-4">Son Çekim / Durum</th>
                  <th className="p-4 text-center">Aktif</th>
                  <th className="p-4 pr-6 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-slate-300 text-sm">
                {sources.map((source) => (
                  <tr key={source.id} className="hover:bg-slate-900/20 transition-colors">
                    {/* Name and URL */}
                    <td className="p-4 pl-6 max-w-xs">
                      <div className="font-semibold text-slate-200">{source.name}</div>
                      <div className="text-xs text-slate-500 truncate mt-1 max-w-[280px]">
                        {source.url}
                      </div>
                    </td>

                    {/* Category & Type */}
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-xs font-medium border border-slate-700/50">
                          {source.category}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          source.type === 'rss' 
                            ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' 
                            : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        }`}>
                          {source.type}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        Sıklık: {source.fetchIntervalMinutes} dk
                      </div>
                    </td>

                    {/* Last fetched info and status indicator */}
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        {/* Status Dot */}
                        {source.lastFetchStatus === 'success' ? (
                          <div className="relative group cursor-help">
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                            <div className="absolute hidden group-hover:block bg-slate-950 text-emerald-400 text-[10px] border border-emerald-500/20 p-2 rounded-lg -top-10 left-0 whitespace-nowrap shadow-xl z-20">
                              Bağlantı başarılı
                            </div>
                          </div>
                        ) : source.lastFetchStatus === 'error' ? (
                          <div className="relative group cursor-help">
                            <XCircle className="w-4 h-4 text-rose-500" />
                            <div className="absolute hidden group-hover:block bg-slate-950 text-rose-400 text-[10px] border border-rose-500/20 p-2.5 rounded-lg -top-12 left-0 whitespace-normal max-w-xs shadow-xl z-20">
                              Hata: {source.lastFetchError || 'Bağlantı hatası'}
                            </div>
                          </div>
                        ) : (
                          <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
                        )}
                        
                        <span className="text-xs text-slate-400">
                          {source.lastFetchedAt 
                            ? new Date(source.lastFetchedAt).toLocaleString('tr-TR')
                            : 'Hiç çekilmedi'}
                        </span>
                      </div>
                    </td>

                    {/* Active toggle */}
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleToggleActive(source)}
                        className={`w-9 h-5 rounded-full p-0.5 transition-all focus:outline-none relative ${
                          source.isActive ? 'bg-emerald-500' : 'bg-slate-800'
                        }`}
                      >
                        <div className={`w-4 h-4 bg-slate-950 rounded-full shadow transition-all ${
                          source.isActive ? 'translate-x-4' : 'translate-x-0'
                        }`}></div>
                      </button>
                    </td>

                    {/* Action buttons */}
                    <td className="p-4 pr-6 text-right space-x-2">
                      <button
                        onClick={() => handleFetchSource(source.id)}
                        disabled={isFetchingId !== null || !source.isActive}
                        className="p-2 bg-slate-850 hover:bg-emerald-500/10 text-emerald-400 hover:text-emerald-300 rounded-xl transition-all border border-slate-800 hover:border-emerald-500/20 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                        title="Şimdi Haberleri Çek"
                      >
                        <Play className={`w-3.5 h-3.5 ${isFetchingId === source.id ? 'animate-spin' : ''}`} />
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(source)}
                        className="p-2 bg-slate-850 hover:bg-blue-500/10 text-blue-400 hover:text-blue-300 rounded-xl transition-all border border-slate-800 hover:border-blue-500/20 cursor-pointer"
                        title="Düzenle"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(source.id)}
                        className="p-2 bg-slate-850 hover:bg-rose-500/10 text-rose-400 hover:text-rose-350 rounded-xl transition-all border border-slate-800 hover:border-rose-500/20 cursor-pointer"
                        title="Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Rss className="text-emerald-400 w-5 h-5" />
                {editingSource ? 'Kaynağı Düzenle' : 'Yeni Haber Kaynağı Ekle'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-100 text-sm font-semibold transition-colors"
              >
                Kapat
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Kaynak Adı <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
                    placeholder="Webrazzi RSS"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Kaynak Tipi <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as 'rss' | 'api')}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
                  >
                    <option value="rss">RSS Feed</option>
                    <option value="api">REST API</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Kaynak URL <span className="text-rose-500">*</span>
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
                  placeholder="https://webrazzi.com/feed"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Varsayılan Kategori <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
                    placeholder="Teknoloji"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Çekim Aralığı (Dakika) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="5"
                    value={fetchIntervalMinutes}
                    onChange={(e) => setFetchIntervalMinutes(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Kaynağa Özel AI Promptu (Varsayılanı ezmek için, boş bırakabilirsiniz)
                </label>
                <textarea
                  value={defaultPrompt}
                  onChange={(e) => setDefaultPrompt(e.target.value)}
                  className="w-full h-28 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm resize-none"
                  placeholder="Bu kaynaktan gelen haberleri SaaS ve KOBİ odaklı yorumlarken..."
                />
              </div>

              <div className="flex items-center space-x-3 bg-slate-950/40 p-4 border border-slate-800/50 rounded-xl">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-850 text-emerald-500 focus:ring-emerald-500/50 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-slate-350 select-none cursor-pointer">
                  Bu kaynak etkinleştirilsin ve haber çekimleri yapılsın.
                </label>
              </div>

              {/* Modal Footer Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-6 border-t border-slate-800/60 mt-8">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-4 py-2.5 rounded-xl transition-all text-xs"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={isSubmitLoading}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-955 font-bold px-6 py-2.5 rounded-xl transition-all text-xs shadow-lg shadow-emerald-500/10 flex items-center justify-center"
                >
                  {isSubmitLoading ? (
                    <div className="w-5 h-5 border-2 border-slate-955 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Kaydet'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
