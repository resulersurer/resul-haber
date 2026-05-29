'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { 
  FileText, 
  Trash2, 
  Edit3, 
  Globe, 
  ExternalLink,
  AlertCircle,
  Clock
} from 'lucide-react';

interface DraftItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  status: 'draft' | 'ready' | 'published';
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  sourceName: string;
}

export default function ArticleDraftsPage() {
  const [drafts, setDrafts] = useState<DraftItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchDrafts = async () => {
    setIsLoading(true);
    try {
      const url = statusFilter !== 'all' 
        ? `/api/admin/article-drafts?status=${statusFilter}`
        : '/api/admin/article-drafts';
      
      const res = await fetch(url);
      if (!res.ok) throw new Error('Taslaklar yüklenemedi.');
      const data = await res.json();
      setDrafts(data);
    } catch (e) {
      toast.error('AI taslakları yüklenirken hata oluştu.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDrafts();
  }, [statusFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm('Bu taslağı silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/article-drafts/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Silme işlemi başarısız.');
      toast.success('Taslak başarıyla silindi.');
      fetchDrafts();
    } catch (e) {
      toast.error('Taslak silinirken hata oluştu.');
      console.error(e);
    }
  };

  const handlePublish = async (id: string) => {
    toast.info('Makale yayınlanıyor...');
    try {
      const res = await fetch(`/api/admin/article-drafts/${id}/publish`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Yayınlama başarısız.');
      toast.success('Makale başarıyla web sitesinde yayınlandı!');
      fetchDrafts();
    } catch (error: any) {
      toast.error(error.message || 'Hata oluştu.');
      console.error(error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-3">
            <FileText className="text-emerald-400 w-8 h-8" />
            AI Makale Taslakları
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            AI tarafından üretilmiş özgün içerik taslaklarını düzenleyin, durumlarını ayarlayın ve web sitenizde yayınlayın.
          </p>
        </div>
      </div>

      {/* Filter and stats segment */}
      <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-2">Filtrele:</span>
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                statusFilter === 'all'
                  ? 'bg-slate-800 text-emerald-400 shadow-inner'
                  : 'text-slate-500 hover:text-slate-200'
              }`}
            >
              Tümü
            </button>
            <button
              onClick={() => setStatusFilter('draft')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                statusFilter === 'draft'
                  ? 'bg-slate-800 text-emerald-400 shadow-inner'
                  : 'text-slate-500 hover:text-slate-200'
              }`}
            >
              Taslak
            </button>
            <button
              onClick={() => setStatusFilter('ready')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                statusFilter === 'ready'
                  ? 'bg-slate-800 text-emerald-400 shadow-inner'
                  : 'text-slate-500 hover:text-slate-200'
              }`}
            >
              Yayına Hazır
            </button>
            <button
              onClick={() => setStatusFilter('published')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                statusFilter === 'published'
                  ? 'bg-slate-800 text-emerald-400 shadow-inner'
                  : 'text-slate-500 hover:text-slate-200'
              }`}
            >
              Yayınlananlar
            </button>
          </div>
        </div>
      </div>

      {/* Main List */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : drafts.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/10 border border-slate-900 rounded-2xl">
          <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-slate-400 font-medium">Taslak bulunamadı.</h3>
          <p className="text-slate-500 text-xs mt-1">
            Ham Haberler sekmesine giderek dilediğiniz bir haberi AI ile taslağa dönüştürebilirsiniz.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900/20 border border-slate-900 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="p-4 pl-6">İçerik Başlığı</th>
                  <th className="p-4">Kategori / Kaynak</th>
                  <th className="p-4">Oluşturulma / Güncelleme</th>
                  <th className="p-4">Durum</th>
                  <th className="p-4 pr-6 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-slate-300 text-sm">
                {drafts.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-900/20 transition-colors">
                    {/* Title */}
                    <td className="p-4 pl-6 max-w-sm">
                      <div className="font-semibold text-slate-200 line-clamp-2 leading-relaxed">{d.title}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-1 select-all">/{d.slug}</div>
                    </td>

                    {/* Category & source name */}
                    <td className="p-4">
                      <span className="bg-slate-800 text-slate-350 px-2 py-0.5 rounded text-xs border border-slate-700/40">
                        {d.category}
                      </span>
                      <div className="text-xs text-slate-500 mt-1.5">Kaynak: {d.sourceName}</div>
                    </td>

                    {/* Timestamps */}
                    <td className="p-4 text-xs text-slate-400">
                      <div className="flex items-center space-x-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-550" />
                        <span>{new Date(d.createdAt).toLocaleDateString('tr-TR')}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">Güncelleme: {new Date(d.updatedAt).toLocaleDateString('tr-TR')}</div>
                    </td>

                    {/* Status Badge */}
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        d.status === 'draft' ? 'bg-slate-800 text-slate-400 border-slate-700/50' :
                        d.status === 'ready' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                        {d.status === 'draft' ? 'Taslak' :
                         d.status === 'ready' ? 'Yayına Hazır' : 'Yayınlandı'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-4 pr-6 text-right space-x-2 whitespace-nowrap">
                      {/* Navigate to generation page editing since it has the detailed inline editor */}
                      <Link
                        href={`/admin/article-drafts/${d.id}`}
                        className="p-2 bg-slate-850 hover:bg-blue-500/10 text-blue-400 hover:text-blue-300 rounded-xl transition-all border border-slate-850 hover:border-blue-500/20 text-xs font-semibold inline-flex items-center space-x-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Düzenle</span>
                      </Link>

                      {d.status !== 'published' && (
                        <button
                          onClick={() => handlePublish(d.id)}
                          className="p-2 bg-slate-850 hover:bg-emerald-500/10 text-emerald-400 hover:text-emerald-300 rounded-xl transition-all border border-slate-850 hover:border-emerald-500/20 text-xs font-semibold inline-flex items-center space-x-1 cursor-pointer"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          <span>Yayınla</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(d.id)}
                        className="p-2 bg-slate-850 hover:bg-rose-500/10 text-rose-400 hover:text-rose-350 rounded-xl transition-all border border-slate-850 hover:border-rose-500/20 text-xs font-semibold inline-flex"
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
    </div>
  );
}
