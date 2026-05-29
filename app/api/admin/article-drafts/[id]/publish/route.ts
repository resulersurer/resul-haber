import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { db } from '@/db';
import { articleDrafts, publishedArticles, rawNewsItems } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    // 1. Get the draft details
    const draftRes = await db
      .select()
      .from(articleDrafts)
      .where(eq(articleDrafts.id, id))
      .limit(1);

    if (draftRes.length === 0) {
      return NextResponse.json({ error: 'Article draft not found' }, { status: 404 });
    }

    const draft = draftRes[0];

    if (draft.status === 'published') {
      return NextResponse.json({ error: 'Bu taslak zaten yayınlanmış.' }, { status: 400 });
    }

    // 2. Insert into published_articles
    // neon-http driver transaction desteklemiyor — sıralı sorgular kullanıyoruz
    const [newArticle] = await db
      .insert(publishedArticles)
      .values({
        draftId: draft.id,
        title: draft.title,
        slug: draft.slug,
        excerpt: draft.excerpt,
        content: draft.content,
        category: draft.category,
        tags: draft.tags,
        seoTitle: draft.seoTitle,
        seoDescription: draft.seoDescription,
        featuredImageUrl: draft.featuredImageUrl,
        sourceName: draft.sourceName,
        sourceUrl: draft.sourceUrl,
        publishedAt: new Date(),
      })
      .returning();

    // 3. Update article_drafts status to published
    await db
      .update(articleDrafts)
      .set({
        status: 'published',
        publishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(articleDrafts.id, draft.id));

    // 4. Update raw_news_items status to published
    if (draft.rawNewsItemId) {
      await db
        .update(rawNewsItems)
        .set({ status: 'published' })
        .where(eq(rawNewsItems.id, draft.rawNewsItemId));
    }

    return NextResponse.json(newArticle);
  } catch (error: any) {
    console.error('Failed to publish article:', error);

    // Unique constraint ihlali (slug veya draftId çakışması)
    if (error.code === '23505') {
      return NextResponse.json({
        error: 'Slug çakışması veya bu taslak daha önce yayınlanmış (Unique index ihlali).',
      }, { status: 409 });
    }

    return NextResponse.json({
      error: `Yayınlama başarısız oldu: ${error.message || 'Veritabanı hatası'}`,
    }, { status: 500 });
  }
}
