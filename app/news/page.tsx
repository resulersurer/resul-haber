import React from 'react';
import Link from 'next/link';
import { db } from '@/db';
import { publishedArticles } from '@/db/schema';
import { desc, sql } from 'drizzle-orm';
import PublicHeader from '@/components/news/PublicHeader';
import PublicFooter from '@/components/news/PublicFooter';
import { Calendar, Tag, ArrowRight } from 'lucide-react';

export const revalidate = 60; // Cache and revalidate public news listing page every 60 seconds

export default async function PublicNewsListingPage() {
  let articles: any[] = [];
  let categories: string[] = [];
  let isDbUninitialized = false;

  try {
    // 1. Fetch articles sorted by publishing date
    articles = await db
      .select({
        id: publishedArticles.id,
        title: publishedArticles.title,
        slug: publishedArticles.slug,
        excerpt: publishedArticles.excerpt,
        category: publishedArticles.category,
        featuredImageUrl: publishedArticles.featuredImageUrl,
        publishedAt: publishedArticles.publishedAt,
        sourceName: publishedArticles.sourceName,
      })
      .from(publishedArticles)
      .orderBy(desc(publishedArticles.publishedAt));

    // 2. Fetch distinct categories
    const categoryRows = await db
      .select({ category: publishedArticles.category })
      .from(publishedArticles)
      .groupBy(publishedArticles.category);
      
    categories = categoryRows.map(c => c.category);
  } catch (error) {
    console.error('Database connection or query failed on public news index:', error);
    isDbUninitialized = true;
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      <PublicHeader />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-12">
        {/* Intro Banner */}
        <div className="max-w-2xl mb-12">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest block mb-2">
            ersurer.com Haber Akışı
          </span>
          <h1 className="text-4xl font-extrabold text-slate-150 tracking-tight leading-tight">
            Güncel Teknoloji, Dijital Dünya ve Yaşam Analizleri
          </h1>
          <p className="text-slate-400 mt-4 leading-relaxed text-sm">
            Yapay zeka, internet kültürü, bilim, inovasyon ve dijital yaşama dair herkes için hazırlanmış güncel gelişmeler ve özgün haber incelemeleri.
          </p>
        </div>

        {/* Categories Bar */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2.5 pb-6 border-b border-slate-900 mb-10 items-center">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider mr-2">Kategoriler:</span>
            <Link
              href="/news"
              className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium"
            >
              Tümü
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat}
                href={`/category/${encodeURIComponent(cat.toLowerCase())}`}
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-350 hover:text-slate-100 hover:border-slate-700 transition-all text-xs font-medium"
              >
                {cat}
              </Link>
            ))}
          </div>
        )}

        {/* Empty States */}
        {isDbUninitialized ? (
          <div className="text-center py-20 bg-slate-900/10 border border-slate-900 rounded-3xl">
            <h3 className="text-slate-400 font-semibold">Sistem Yapılandırılıyor</h3>
            <p className="text-slate-500 text-xs mt-1">
              Veritabanı tabloları veya içerikler henüz yüklenmemiş. Lütfen daha sonra tekrar deneyin.
            </p>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-24 bg-slate-900/10 border border-slate-900 rounded-3xl">
            <h3 className="text-slate-400 font-semibold">Henüz yayınlanmış bir makale yok</h3>
            <p className="text-slate-500 text-xs mt-1">
              Admin panelinden AI taslaklarınızı onaylayarak ilk yayınlarınızı yapabilirsiniz.
            </p>
          </div>
        ) : (
          /* Articles Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article) => (
              <article key={article.id} className="group flex flex-col bg-slate-900/20 border border-slate-900 hover:border-slate-800 rounded-2xl overflow-hidden transition-all hover:translate-y-[-3px] relative shadow-lg">
                {/* Featured Image */}
                {article.featuredImageUrl ? (
                  <div className="aspect-video overflow-hidden bg-slate-950 border-b border-slate-900 relative">
                    <img
                      src={article.featuredImageUrl}
                      alt={article.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-slate-950 border-b border-slate-900 flex items-center justify-center text-slate-800">
                    <Tag className="w-10 h-10 opacity-30" />
                  </div>
                )}

                {/* Card Content */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    {/* Category & Source Metadata */}
                    <div className="flex items-center space-x-2 text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                      <span>{article.category}</span>
                      <span className="text-slate-700">•</span>
                      <span className="text-slate-500">{article.sourceName}</span>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-slate-150 leading-snug group-hover:text-emerald-400 transition-colors line-clamp-2">
                      <Link href={`/news/${article.slug}`}>
                        {article.title}
                      </Link>
                    </h3>

                    {/* Excerpt */}
                    <p className="text-slate-400 text-xs leading-relaxed line-clamp-3">
                      {article.excerpt}
                    </p>
                  </div>

                  {/* Read More link & Date */}
                  <div className="flex items-center justify-between border-t border-slate-900/60 pt-4 mt-6">
                    <span className="text-[10px] text-slate-500 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(article.publishedAt).toLocaleDateString('tr-TR')}
                    </span>
                    <Link
                      href={`/news/${article.slug}`}
                      className="text-xs text-slate-300 group-hover:text-emerald-400 font-semibold flex items-center space-x-1.5 transition-colors"
                    >
                      <span>Devamını Oku</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
