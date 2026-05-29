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

    // 1. Get the article details to find the draftId
    const articleRes = await db
      .select({ draftId: publishedArticles.draftId })
      .from(publishedArticles)
      .where(eq(publishedArticles.id, id))
      .limit(1);

    if (articleRes.length === 0) {
      return NextResponse.json({ error: 'Published article not found' }, { status: 404 });
    }

    const { draftId } = articleRes[0];

    // 2. Perform unpublish inside transaction
    await db.transaction(async (tx) => {
      // 2a. Delete from published_articles
      await tx.delete(publishedArticles).where(eq(publishedArticles.id, id));

      // 2b. Revert article_drafts status to 'ready'
      await tx
        .update(articleDrafts)
        .set({
          status: 'ready',
          publishedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(articleDrafts.id, draftId));

      // 2c. Get draft's rawNewsItemId to revert its status to 'draft_created'
      const draftDetails = await tx
        .select({ rawNewsItemId: articleDrafts.rawNewsItemId })
        .from(articleDrafts)
        .where(eq(articleDrafts.id, draftId))
        .limit(1);

      if (draftDetails.length > 0 && draftDetails[0].rawNewsItemId) {
        await tx
          .update(rawNewsItems)
          .set({ status: 'draft_created' })
          .where(eq(rawNewsItems.id, draftDetails[0].rawNewsItemId));
      }
    });

    return NextResponse.json({ message: 'Article unpublished successfully' });
  } catch (error) {
    console.error('Failed to unpublish article:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
