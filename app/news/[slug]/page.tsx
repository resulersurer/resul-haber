import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { db } from '@/db';
import { publishedArticles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import PublicHeader from '@/components/news/PublicHeader';
import PublicFooter from '@/components/news/PublicFooter';
import { Calendar, Tag, ExternalLink, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const revalidate = 60; // Cache and revalidate public news detail page every 60 seconds

async function getArticleBySlug(slug: string) {
  try {
    const results = await db
      .select()
      .from(publishedArticles)
      .where(eq(publishedArticles.slug, slug))
      .limit(1);
    return results.length > 0 ? results[0] : null;
  } catch (e) {
    console.error('Error fetching article inside details page:', e);
    return null;
  }
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  
  if (!article) {
    return {
      title: 'Haber Bulunamadı',
      description: 'Aradığınız haber sistemde kayıtlı görünmüyor.',
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://haber.ersurer.com';

  return {
    title: `${article.seoTitle} | ersurer.com`,
    description: article.seoDescription,
    alternates: {
      canonical: `${siteUrl}/news/${slug}`,
    },
    openGraph: {
      title: article.seoTitle,
      description: article.seoDescription,
      url: `${siteUrl}/news/${slug}`,
      siteName: 'ersurer.com',
      images: article.featuredImageUrl
        ? [{ url: article.featuredImageUrl, width: 1200, height: 630, alt: article.title }]
        : [],
      type: 'article',
      publishedTime: article.publishedAt.toISOString(),
    },
    twitter: {
      card: 'summary_large_image',
      title: article.seoTitle,
      description: article.seoDescription,
      images: article.featuredImageUrl ? [article.featuredImageUrl] : [],
    }
  };
}

export default async function PublicNewsDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      <PublicHeader />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-12">
        {/* Back Link */}
        <Link
          href="/news"
          className="flex items-center space-x-2 text-slate-500 hover:text-emerald-400 transition-colors text-xs font-semibold mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:translate-x-[-2px]" />
          <span>Tüm Haberlere Dön</span>
        </Link>

        {/* Article Meta */}
        <div className="space-y-4 mb-8">
          <span className="bg-slate-900 border border-slate-800 text-slate-400 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded">
            {article.category}
          </span>
          
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-150 tracking-tight leading-tight">
            {article.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2 border-b border-slate-900/60 pb-4">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(article.publishedAt).toLocaleDateString('tr-TR')}
            </span>
            <span>•</span>
            <span>Editör: Resul Ersürer AI</span>
          </div>
        </div>

        {/* Featured Image */}
        {article.featuredImageUrl && (
          <div className="rounded-2xl overflow-hidden border border-slate-900 aspect-video relative bg-slate-950 mb-10 shadow-lg">
            <img
              src={article.featuredImageUrl}
              alt={article.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Article Body (Markdown rendered safely) */}
        <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed text-sm space-y-6">
          <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
            {article.content}
          </ReactMarkdown>
        </div>

        {/* Tags Block */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2.5 mt-10 pt-6 border-t border-slate-900">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 bg-slate-900 border border-slate-800/80 rounded-lg text-slate-400 text-xs font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Source attribution footer */}
        <div className="mt-12 bg-slate-900/10 border border-slate-900 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <p className="text-xs font-bold text-slate-400">İçerik Kaynağı</p>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Bu içerik, {article.sourceName} kaynağından çekilen ham haberin AI ile analizidir.
            </p>
          </div>
          <a
            href={article.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 bg-slate-950 border border-slate-850 hover:border-emerald-500/20 text-slate-350 hover:text-emerald-400 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all"
          >
            <span>Orijinal Haberi Oku</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
