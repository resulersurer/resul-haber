'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { 
  FileCode, 
  Search, 
  Filter, 
  Trash, 
  Eye, 
  Wand2, 
  ExternalLink,
  Calendar,
  AlertCircle
} from 'lucide-react';

interface NewsSource {
  id: string;
  name: string;
}

interface RawNewsItem {
  id: string;
  title: string;
  summary: string | null;
  externalUrl: string;
  imageUrl: string | null;
  author: string | null;
  status: 'new' | 'ignored' | 'draft_created' | 'published';
  publishedAt: string | null;
  createdAt: string;
  source: {
    id: string;
    name: string;
    category: string;
  };
}

export default function RawNewsPage() {
  const [items, setItems] = useState<RawNewsItem[]>([]);
  const [sources, setSources] = useState<NewsSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters State
  const [sourceId, setSourceId] = useState('');
  const [status, setStatus] = useState('new'); // Defaults to list "new" items
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');

  const fetchSources = async () => {
    try {
      const res = await fetch('/api/admin/news-sources');
      if (res.ok) {
        const data = await res.json();
        setSources(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (sourceId) queryParams.append('sourceId', sourceId);
      if (status && status !== 'all') queryParams.append('status', status);
      if (category) queryParams.append('category', category);
      if (date) queryParams.append('date', date);

      const res = await fetch(`/api/admin/raw-news?${queryParams.toString()}`);
      if (!res.ok) throw new Error('Haberler çekilemedi.');
      const data = await res.json();
      setItems(data);
    } catch (error) {
      toast.error('Ham haber akışı yüklenirken hata oluştu.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  useEffect(() => {
    fetchItems();
  }, [sourceId, status, category, date]);

  const handleIgnore = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/raw-news/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ignored' }),
      });

      if (!res.ok) throw new Error('Yok sayma işlemi başarısız.');
      toast.success('Haber yok sayıldı.');
      fetchItems();
    } catch (error) {
      toast.error('Hata oluştu.');
      console.error(error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-3">
            <FileCode className="text-amber-400 w-8 h-8" />
            Ham Haber Havuzu
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            RSS/API akışlarından gelen ham haberleri listeleyin, filtreleyin ve AI ile özgün makaleye dönüştürün.
          </p>
        </div>
      </div>

      {/* Filters Dashboard */}
      <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Source Filter */}
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Haber Kaynağı
          </label>
          <select
            value={sourceId}
            onChange={(e) => setSourceId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-xs"
          >
            <option value="">Tüm Kaynaklar</option>
            {sources.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
            İşlem Durumu
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-xs"
          >
            <option value="all">Tümü</option>
            <option value="new">Yeni</option>
            <option value="ignored">Yok Sayılanlar</option>
            <option value="draft_created">Taslak Oluşturulanlar</option>
            <option value="published">Yayınlananlar</option>
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Kategori
          </label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-xs"
            placeholder="Kategori ara..."
          />
        </div>

        {/* Date Filter */}
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Çekilme Tarihi
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-xs"
          />
        </div>
      </div>

      {/* Main List */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/10 border border-slate-900 rounded-2xl animate-fadeIn">
          <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-slate-400 font-medium">Aranan kriterde ham haber bulunamadı.</h3>
          <p className="text-slate-500 text-xs mt-1">
            Filtrelerinizi değiştirmeyi deneyebilir veya haber kaynaklarınızı güncelleyebilirsiniz.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900/20 border border-slate-900 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="p-4 pl-6">Haber Detayları</th>
                  <th className="p-4">Akış Kaynağı</th>
                  <th className="p-4">Yayın Tarihi</th>
                  <th className="p-4">Durum</th>
                  <th className="p-4 pr-6 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-slate-300 text-sm">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/20 transition-colors">
                    {/* Title and External URL Link */}
                    <td className="p-4 pl-6 max-w-md">
                      <div className="font-semibold text-slate-200 line-clamp-2 leading-relaxed">{item.title}</div>
                      <div className="flex items-center space-x-2 mt-1.5">
                        <a
                          href={item.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-slate-500 hover:text-emerald-400 flex items-center space-x-1"
                        >
                          <span>Kaynak Bağlantısı</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </td>

                    {/* Source & Category */}
                    <td className="p-4">
                      <div className="font-medium text-slate-300">{item.source.name}</div>
                      <div className="text-xs text-slate-500 mt-1">{item.source.category}</div>
                    </td>

                    {/* Date */}
                    <td className="p-4 text-xs text-slate-400">
                      {item.publishedAt 
                        ? new Date(item.publishedAt).toLocaleString('tr-TR')
                        : 'Belirtilmemiş'}
                    </td>

                    {/* Status Badge */}
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        item.status === 'new' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        item.status === 'ignored' ? 'bg-slate-800 text-slate-500 border-slate-700/50' :
                        item.status === 'draft_created' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                        {item.status === 'new' ? 'Yeni' :
                         item.status === 'ignored' ? 'Yok Sayıldı' :
                         item.status === 'draft_created' ? 'Taslak Hazır' : 'Yayında'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-4 pr-6 text-right space-x-2 whitespace-nowrap">
                      <Link
                        href={`/admin/raw-news/${item.id}`}
                        className="p-2 bg-slate-850 hover:bg-emerald-500/10 text-emerald-400 hover:text-emerald-350 rounded-xl transition-all border border-slate-850 hover:border-emerald-500/20 text-xs font-semibold inline-flex items-center space-x-1.5"
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>AI Taslak</span>
                      </Link>
                      
                      {item.status === 'new' && (
                        <button
                          onClick={() => handleIgnore(item.id)}
                          className="p-2 bg-slate-850 hover:bg-rose-500/10 text-rose-400 hover:text-rose-350 rounded-xl transition-all border border-slate-850 hover:border-rose-500/20 text-xs font-semibold inline-flex items-center"
                          title="Yok Say"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
