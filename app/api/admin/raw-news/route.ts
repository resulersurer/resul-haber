import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { db } from '@/db';
import { rawNewsItems, newsSources } from '@/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const sourceId = searchParams.get('sourceId');
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const date = searchParams.get('date'); // YYYY-MM-DD

    const conditions = [];

    if (sourceId) {
      conditions.push(eq(rawNewsItems.sourceId, sourceId));
    }
    
    if (status) {
      conditions.push(eq(rawNewsItems.status, status as any));
    }

    if (category) {
      conditions.push(eq(newsSources.category, category));
    }

    if (date) {
      conditions.push(
        sql`DATE(${rawNewsItems.publishedAt}) = ${date}`
      );
    }

    const query = db
      .select({
        id: rawNewsItems.id,
        title: rawNewsItems.title,
        summary: rawNewsItems.summary,
        externalUrl: rawNewsItems.externalUrl,
        imageUrl: rawNewsItems.imageUrl,
        author: rawNewsItems.author,
        status: rawNewsItems.status,
        publishedAt: rawNewsItems.publishedAt,
        createdAt: rawNewsItems.createdAt,
        source: {
          id: newsSources.id,
          name: newsSources.name,
          category: newsSources.category,
        }
      })
      .from(rawNewsItems)
      .innerJoin(newsSources, eq(rawNewsItems.sourceId, newsSources.id))
      .orderBy(desc(rawNewsItems.createdAt));

    if (conditions.length > 0) {
      query.where(and(...conditions));
    }

    const items = await query;
    return NextResponse.json(items);
  } catch (error) {
    console.error('Failed to query raw news items:', error);
    return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
  }
}
