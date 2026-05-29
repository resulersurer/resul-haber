import React from 'react';
import Link from 'next/link';
import { db } from '@/db';
import { count, eq, desc } from 'drizzle-orm';
import { newsSources, rawNewsItems, articleDrafts, publishedArticles } from '@/db/schema';
import { 
  Rss, 
  FileCode, 
  FileText, 
  Globe, 
  Activity, 
  Database,
  ArrowRight,
  Plus
} from 'lucide-react';

export const revalidate = 0; // Disable server component caching to ensure live stats on page refresh

export default async function AdminDashboardPage() {
  let stats = {
    totalSources: 0,
    activeSources: 0,
    newRawNews: 0,
    totalDrafts: 0,
    publishedArticles: 0,
  };
  
  interface RecentRawItem {
    id: string;
    title: string;
    status: string;
    createdAt: Date;
  }
  
  interface RecentDraftItem {
    id: string;
    title: string;
    status: string;
    createdAt: Date;
  }
  
  let recentRawNews: RecentRawItem[] = [];
  let recentDrafts: RecentDraftItem[] = [];
  let isDbUninitialized = false;

  try {
    const [tSources] = await db.select({ count: count() }).from(newsSources);
    const [aSources] = await db.select({ count: count() }).from(newsSources).where(eq(newsSources.isActive, true));
    const [nRaw] = await db.select({ count: count() }).from(rawNewsItems).where(eq(rawNewsItems.status, 'new'));
    const [tDrafts] = await db.select({ count: count() }).from(articleDrafts);
    const [pArticles] = await db.select({ count: count() }).from(publishedArticles);

    stats = {
      totalSources: tSources.count,
      activeSources: aSources.count,
      newRawNews: nRaw.count,
      totalDrafts: tDrafts.count,
      publishedArticles: pArticles.count,
    };

    const rawRes = await db
      .select({
        id: rawNewsItems.id,
        title: rawNewsItems.title,
        status: rawNewsItems.status,
        createdAt: rawNewsItems.createdAt,
      })
      .from(rawNewsItems)
      .orderBy(desc(rawNewsItems.createdAt))
      .limit(5);
    recentRawNews = rawRes;

    const draftRes = await db
      .select({
        id: articleDrafts.id,
        title: articleDrafts.title,
        status: articleDrafts.status,
        createdAt: articleDrafts.createdAt,
      })
      .from(articleDrafts)
      .orderBy(desc(articleDrafts.createdAt))
      .limit(5);
    recentDrafts = draftRes;
  } catch (error) {
    console.error('Database query error on dashboard page init:', error);
    isDbUninitialized = true;
  }

  const statCards = [
    {
      title: 'Haber Kaynakları',
      value: stats.totalSources,
      description: `${stats.activeSources} aktif kaynak`,
      icon: Rss,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      href: '/admin/news-sources'
    },
    {
      title: 'Yeni Ham Haberler',
      value: stats.newRawNews,
      description: 'Taslak bekleyen',
      icon: FileCode,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      href: '/admin/raw-news'
    },
    {
      title: 'AI Taslakları',
      value: stats.totalDrafts,
      description: 'Düzenlenebilir makale',
      icon: FileText,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      href: '/admin/article-drafts'
    },
    {
      title: 'Yayınlanan Haberler',
      value: stats.publishedArticles,
      description: 'Yayındaki içerik',
      icon: Globe,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      href: '/admin/published-articles'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-100">Yönetim Paneli</h1>
          <p className="text-slate-400 text-sm mt-1">
            İçerik sisteminin genel durumu, bağlantı durumları ve son hareketler.
          </p>
        </div>
        <div className="flex space-x-3">
          <Link
            href="/admin/news-sources"
            className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-4 py-2 rounded-xl transition-all text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Kaynak Ekle</span>
          </Link>
        </div>
      </div>

      {/* Migration setup warning box */}
      {isDbUninitialized && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="p-3 bg-red-500/20 rounded-xl text-red-400">
            <Database className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-red-400">Veritabanı Şeması Bulunamadı veya Bağlantı Başarısız</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Neon PostgreSQL veritabanı şeması henüz oluşturulmamış olabilir ya da DATABASE_URL bağlantısı eksik. 
              Geliştirme makinenizde <code className="bg-slate-950 px-1.5 py-0.5 rounded text-red-400 border border-red-500/10">npx drizzle-kit push</code> komutunu çalıştırarak tabloları oluşturun veya Vercel panelinden çevresel değişkenlerinizi doğrulayın.
            </p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Link key={i} href={card.href} className="group block">
              <div className="bg-slate-900/40 backdrop-blur border border-slate-800 hover:border-slate-700/60 rounded-2xl p-6 transition-all hover:translate-y-[-2px] relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-400">{card.title}</span>
                  <div className={`p-2.5 rounded-xl border ${card.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-3xl font-extrabold text-slate-100 group-hover:text-emerald-400 transition-colors">
                    {card.value}
                  </span>
                  <p className="text-xs text-slate-500 mt-1">{card.description}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Dynamic Activity Lists */}
      {!isDbUninitialized && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10">
          {/* Recent Raw News */}
          <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800/60">
              <h2 className="text-lg font-bold text-slate-200">Son Çekilen Ham Haberler</h2>
              <Link href="/admin/raw-news" className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center space-x-1">
                <span>Tümü</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            
            {recentRawNews.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-slate-500 text-sm">Çekilmiş ham haber bulunamadı.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentRawNews.map((item) => (
                  <Link href={`/admin/raw-news/${item.id}`} key={item.id} className="block group">
                    <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-900/50 transition-colors border border-transparent hover:border-slate-800/40">
                      <div className="flex-1 min-w-0 pr-4">
                        <p className="text-sm font-medium text-slate-300 group-hover:text-emerald-400 transition-colors truncate">
                          {item.title}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1">
                          {new Date(item.createdAt).toLocaleString('tr-TR')}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                        item.status === 'new' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        item.status === 'ignored' ? 'bg-slate-800 text-slate-400' :
                        'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {item.status === 'new' ? 'Yeni' :
                         item.status === 'ignored' ? 'Yok Sayıldı' :
                         item.status === 'draft_created' ? 'Taslak' : 'Yayında'}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recent Drafts */}
          <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800/60">
              <h2 className="text-lg font-bold text-slate-200">Son AI Taslakları</h2>
              <Link href="/admin/article-drafts" className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center space-x-1">
                <span>Tümü</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentDrafts.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-slate-500 text-sm">Üretilmiş AI taslağı bulunamadı.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentDrafts.map((item) => (
                  <Link href={`/admin/article-drafts/${item.id}`} key={item.id} className="block group">
                    <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-900/50 transition-colors border border-transparent hover:border-slate-800/40">
                      <div className="flex-1 min-w-0 pr-4">
                        <p className="text-sm font-medium text-slate-300 group-hover:text-emerald-400 transition-colors truncate">
                          {item.title}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1">
                          {new Date(item.createdAt).toLocaleString('tr-TR')}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                        item.status === 'draft' ? 'bg-slate-800 text-slate-400 border border-slate-700/50' :
                        item.status === 'ready' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {item.status === 'draft' ? 'Taslak' :
                         item.status === 'ready' ? 'Hazır' : 'Yayında'}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
