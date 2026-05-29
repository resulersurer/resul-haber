import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { db } from '@/db';
import { publishedArticles } from '@/db/schema';
import { desc, eq, and } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');

    const conditions = [];
    if (category) {
      conditions.push(eq(publishedArticles.category, category));
    }

    const query = db
      .select({
        id: publishedArticles.id,
        draftId: publishedArticles.draftId,
        title: publishedArticles.title,
        slug: publishedArticles.slug,
        category: publishedArticles.category,
        publishedAt: publishedArticles.publishedAt,
        sourceName: publishedArticles.sourceName,
      })
      .from(publishedArticles)
      .orderBy(desc(publishedArticles.publishedAt));

    if (conditions.length > 0) {
      query.where(and(...conditions));
    }

    const items = await query;
    return NextResponse.json(items);
  } catch (error) {
    console.error('Failed to list published articles:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
