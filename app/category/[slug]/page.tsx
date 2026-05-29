import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/db';
import { publishedArticles } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { slugify } from '@/lib/slug/generator';
import PublicHeader from '@/components/news/PublicHeader';
import PublicFooter from '@/components/news/PublicFooter';
import { Calendar, Tag, ArrowRight, ArrowLeft } from 'lucide-react';

export const revalidate = 60; // Cache and revalidate category pages every 60 seconds

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  
  let articles: any[] = [];
  let matchingCategoryName = '';
  let categories: string[] = [];

  try {
    // 1. Fetch all articles
    const allArticles = await db
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

    // 2. Filter by category slug
    articles = allArticles.filter(art => slugify(art.category) === slug);

    if (articles.length > 0) {
      matchingCategoryName = articles[0].category;
    } else {
      // Find matching category case if empty
      matchingCategoryName = slug.charAt(0).toUpperCase() + slug.slice(1);
    }

    // 3. Get distinct categories
    const categoryRows = await db
      .select({ category: publishedArticles.category })
      .from(publishedArticles)
      .groupBy(publishedArticles.category);
    
    categories = categoryRows.map(c => c.category);

  } catch (e) {
    console.error('Failed to query category articles:', e);
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      <PublicHeader />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-12">
        {/* Back Link */}
        <Link
          href="/news"
          className="flex items-center space-x-2 text-slate-500 hover:text-emerald-400 transition-colors text-xs font-semibold mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:translate-x-[-2px]" />
          <span>Tüm Haberlere Dön</span>
        </Link>

        {/* Dynamic header */}
        <div className="max-w-2xl mb-12">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest block mb-2">
            Kategori Filtresi
          </span>
          <h1 className="text-4xl font-extrabold text-slate-150 tracking-tight leading-tight">
            "{matchingCategoryName}" Kategorisindeki Analizler
          </h1>
        </div>

        {/* Categories Bar */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2.5 pb-6 border-b border-slate-900 mb-10 items-center">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider mr-2">Kategoriler:</span>
            <Link
              href="/news"
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-350 hover:text-slate-100 transition-all text-xs font-medium"
            >
              Tümü
            </Link>
            {categories.map((cat) => {
              const catSlug = slugify(cat);
              const isCurrent = catSlug === slug;
              return (
                <Link
                  key={cat}
                  href={`/category/${catSlug}`}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isCurrent
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                      : 'bg-slate-900 border border-slate-800 text-slate-350 hover:text-slate-100 hover:border-slate-700'
                  }`}
                >
                  {cat}
                </Link>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {articles.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/10 border border-slate-900 rounded-3xl">
            <Tag className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <h3 className="text-slate-400 font-semibold">Bu kategoride makale bulunmuyor.</h3>
            <p className="text-slate-500 text-xs mt-1">
              Diğer kategorilere göz atabilir veya ana sayfa üzerinden tüm haberleri okuyabilirsiniz.
            </p>
          </div>
        ) : (
          /* Grid list */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article) => (
              <article key={article.id} className="group flex flex-col bg-slate-900/20 border border-slate-900 hover:border-slate-800 rounded-2xl overflow-hidden transition-all hover:translate-y-[-3px] relative shadow-lg">
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

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                      <span>{article.category}</span>
                      <span className="text-slate-700">•</span>
                      <span className="text-slate-500">{article.sourceName}</span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-150 leading-snug group-hover:text-emerald-400 transition-colors line-clamp-2">
                      <Link href={`/news/${article.slug}`}>
                        {article.title}
                      </Link>
                    </h3>

                    <p className="text-slate-400 text-xs leading-relaxed line-clamp-3">
                      {article.excerpt}
                    </p>
                  </div>

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
