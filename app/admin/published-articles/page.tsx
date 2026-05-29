'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { 
  Globe, 
  Trash2, 
  ExternalLink,
  Calendar,
  AlertCircle
} from 'lucide-react';

interface PublishedItem {
  id: string;
  draftId: string;
  title: string;
  slug: string;
  category: string;
  publishedAt: string;
  sourceName: string;
}

export default function PublishedArticlesPage() {
  const [articles, setArticles] = useState<PublishedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchArticles = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/published-articles');
      if (!res.ok) throw new Error('Yayınlanan haberler yüklenemedi.');
      const data = await res.json();
      setArticles(data);
    } catch (e) {
      toast.error('Yayınlanan haber listesi yüklenirken hata oluştu.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const handleUnpublish = async (id: string) => {
    if (!confirm('Bu makaleyi yayından kaldırmak istediğinizden emin misiniz? Makale taslağı silinmeyecek, düzenlenebilir duruma geri dönecektir.')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/published-articles/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('İşlem başarısız.');
      
      toast.success('Makale yayından kaldırıldı ve taslağa geri döndürüldü.');
      fetchArticles();
    } catch (e) {
      toast.error('Yayından kaldırılırken hata oluştu.');
      console.error(e);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-3">
            <Globe className="text-emerald-400 w-8 h-8" />
            Yayınlanan Haberler
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Web sitesinde yayında olan makalelerin listesi. Buradan yayından kaldırabilir veya canlı linkleri görüntüleyebilirsiniz.
          </p>
        </div>
      </div>

      {/* Main List */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/10 border border-slate-900 rounded-2xl">
          <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-slate-400 font-medium">Yayınlanmış haber bulunmuyor.</h3>
          <p className="text-slate-500 text-xs mt-1">
            AI Taslakları sekmesine giderek dilediğiniz bir makaleyi yayına alabilirsiniz.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900/20 border border-slate-900 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="p-4 pl-6">Haber Başlığı</th>
                  <th className="p-4">Kategori / Akış Kaynağı</th>
                  <th className="p-4">Yayınlanma Tarihi</th>
                  <th className="p-4 pr-6 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-slate-300 text-sm">
                {articles.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/20 transition-colors">
                    {/* Title & Path */}
                    <td className="p-4 pl-6 max-w-sm">
                      <div className="font-semibold text-slate-200 line-clamp-2 leading-relaxed">{item.title}</div>
                      <div className="text-[10px] text-slate-550 font-mono mt-1 select-all">/news/{item.slug}</div>
                    </td>

                    {/* Category & source name */}
                    <td className="p-4">
                      <span className="bg-emerald-950/20 text-emerald-400 px-2 py-0.5 rounded text-xs border border-emerald-500/10">
                        {item.category}
                      </span>
                      <div className="text-xs text-slate-500 mt-1.5">Kaynak: {item.sourceName}</div>
                    </td>

                    {/* Date */}
                    <td className="p-4 text-xs text-slate-400">
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{new Date(item.publishedAt).toLocaleString('tr-TR')}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="p-4 pr-6 text-right space-x-2 whitespace-nowrap">
                      <a
                        href={`/news/${item.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-slate-850 hover:bg-emerald-500/10 text-emerald-400 hover:text-emerald-300 rounded-xl transition-all border border-slate-850 hover:border-emerald-500/20 text-xs font-semibold inline-flex items-center space-x-1.5 cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Görüntüle</span>
                      </a>
                      <button
                        onClick={() => handleUnpublish(item.id)}
                        className="p-2 bg-slate-850 hover:bg-rose-500/10 text-rose-400 hover:text-rose-350 rounded-xl transition-all border border-slate-850 hover:border-rose-500/20 text-xs font-semibold inline-flex items-center space-x-1 cursor-pointer"
                        title="Yayından Kaldır"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Kaldır</span>
                      </button>
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
