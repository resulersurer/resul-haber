import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { db } from '@/db';
import { articleDrafts, newsSources } from '@/db/schema';
import { desc, eq, and } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status'); // 'draft' | 'ready' | 'published'
    const sourceId = searchParams.get('sourceId');

    const conditions = [];

    if (status) {
      conditions.push(eq(articleDrafts.status, status as any));
    }
    if (sourceId) {
      conditions.push(eq(articleDrafts.sourceId, sourceId));
    }

    const query = db
      .select({
        id: articleDrafts.id,
        title: articleDrafts.title,
        slug: articleDrafts.slug,
        category: articleDrafts.category,
        status: articleDrafts.status,
        createdAt: articleDrafts.createdAt,
        updatedAt: articleDrafts.updatedAt,
        publishedAt: articleDrafts.publishedAt,
        sourceName: articleDrafts.sourceName,
      })
      .from(articleDrafts)
      .orderBy(desc(articleDrafts.createdAt));

    if (conditions.length > 0) {
      query.where(and(...conditions));
    }

    const items = await query;
    return NextResponse.json(items);
  } catch (error) {
    console.error('Failed to list article drafts:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
