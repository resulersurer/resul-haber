import React from 'react';
import Link from 'next/link';
import { db } from '@/db';
import { publishedArticles } from '@/db/schema';
import { desc } from 'drizzle-orm';
import PublicHeader from '@/components/news/PublicHeader';
import PublicFooter from '@/components/news/PublicFooter';
import { Calendar, ArrowRight } from 'lucide-react';
import ArticleImage from '@/components/news/ArticleImage';

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
    <div className="flex flex-col min-h-screen bg-bg-custom text-text-custom">
      <PublicHeader />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-12">
        {/* Intro Banner */}
        <div className="max-w-2xl mb-12">
          <span className="text-xs font-bold text-accent uppercase tracking-widest block mb-2">
            ersurer.com Haber Akışı
          </span>
          <h1 className="text-4xl font-extrabold text-primary tracking-tight leading-tight">
            Güncel Teknoloji, Dijital Dünya ve Yaşam Analizleri
          </h1>
          <p className="text-slate-600 mt-4 leading-relaxed text-sm">
            Yapay zeka, internet kültürü, bilim, inovasyon ve dijital yaşama dair herkes için hazırlanmış güncel gelişmeler ve özgün haber incelemeleri.
          </p>
        </div>

        {/* Categories Bar */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2.5 pb-6 border-b border-slate-200 mb-10 items-center">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mr-2">Kategoriler:</span>
            <Link
              href="/news"
              className="px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/20 text-accent text-xs font-bold transition-all shadow-sm"
            >
              Tümü
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat}
                href={`/category/${encodeURIComponent(cat.toLowerCase())}`}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-primary hover:border-slate-400 transition-all text-xs font-semibold shadow-sm"
              >
                {cat}
              </Link>
            ))}
          </div>
        )}

        {/* Empty States */}
        {isDbUninitialized ? (
          <div className="text-center py-20 bg-white border border-slate-200 rounded-3xl shadow-sm">
            <h3 className="text-slate-700 font-bold">Sistem Yapılandırılıyor</h3>
            <p className="text-slate-500 text-xs mt-1">
              Veritabanı tabloları veya içerikler henüz yüklenmemiş. Lütfen daha sonra tekrar deneyin.
            </p>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-24 bg-white border border-slate-200 rounded-3xl shadow-sm">
            <h3 className="text-slate-700 font-bold">Henüz yayınlanmış bir makale yok</h3>
            <p className="text-slate-500 text-xs mt-1">
              Admin panelinden AI taslaklarınızı onaylayarak ilk yayınlarınızı yapabilirsiniz.
            </p>
          </div>
        ) : (
          /* Articles Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article) => (
              <article key={article.id} className="group flex flex-col bg-white border border-slate-200 hover:border-accent hover:shadow-xl rounded-2xl overflow-hidden transition-all duration-300 hover:translate-y-[-4px] relative shadow-sm">
                {/* Featured Image */}
                <div className="aspect-video overflow-hidden bg-slate-100 border-b border-slate-100 relative">
                  <ArticleImage
                    src={article.featuredImageUrl}
                    alt={article.title}
                    category={article.category}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>

                {/* Card Content */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    {/* Category & Source Metadata */}
                    <div className="flex items-center space-x-2 text-[10px] font-bold text-accent uppercase tracking-widest">
                      <span>{article.category}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-400">{article.sourceName}</span>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-primary leading-snug group-hover:text-link transition-colors line-clamp-2">
                      <Link href={`/news/${article.slug}`}>
                        {article.title}
                      </Link>
                    </h3>

                    {/* Excerpt */}
                    <p className="text-slate-600 text-xs leading-relaxed line-clamp-3">
                      {article.excerpt}
                    </p>
                  </div>

                  {/* Read More link & Date */}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-6">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1.5 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-accent" />
                      {new Date(article.publishedAt).toLocaleDateString('tr-TR')}
                    </span>
                    <Link
                      href={`/news/${article.slug}`}
                      className="text-xs text-link group-hover:text-accent font-bold flex items-center space-x-1.5 transition-colors"
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
