import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { db } from '@/db';
import { publishedArticles, articleDrafts, rawNewsItems } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    // 1. Get the article + draft details in one query
    const articleRes = await db
      .select({
        draftId: publishedArticles.draftId,
      })
      .from(publishedArticles)
      .where(eq(publishedArticles.id, id))
      .limit(1);

    if (articleRes.length === 0) {
      return NextResponse.json({ error: 'Published article not found' }, { status: 404 });
    }

    const { draftId } = articleRes[0];

    // Get draft's rawNewsItemId before deleting
    const draftDetails = await db
      .select({ rawNewsItemId: articleDrafts.rawNewsItemId })
      .from(articleDrafts)
      .where(eq(articleDrafts.id, draftId))
      .limit(1);

    // 2. Delete from published_articles
    // neon-http driver transaction desteklemiyor — sıralı sorgular kullanıyoruz
    await db.delete(publishedArticles).where(eq(publishedArticles.id, id));

    // 3. Revert article_drafts status to 'ready'
    await db
      .update(articleDrafts)
      .set({
        status: 'ready',
        publishedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(articleDrafts.id, draftId));

    // 4. Revert raw_news_items status to 'draft_created'
    if (draftDetails.length > 0 && draftDetails[0].rawNewsItemId) {
      await db
        .update(rawNewsItems)
        .set({ status: 'draft_created' })
        .where(eq(rawNewsItems.id, draftDetails[0].rawNewsItemId));
    }

    return NextResponse.json({ message: 'Article unpublished successfully' });
  } catch (error) {
    console.error('Failed to unpublish article:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
