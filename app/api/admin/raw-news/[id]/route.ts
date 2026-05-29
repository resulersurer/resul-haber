import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { db } from '@/db';
import { rawNewsItems, newsSources, articleDrafts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const patchSchema = z.object({
  status: z.enum(['new', 'ignored', 'draft_created', 'published']),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const items = await db
      .select({
        id: rawNewsItems.id,
        sourceId: rawNewsItems.sourceId,
        externalId: rawNewsItems.externalId,
        externalUrl: rawNewsItems.externalUrl,
        title: rawNewsItems.title,
        summary: rawNewsItems.summary,
        content: rawNewsItems.content,
        imageUrl: rawNewsItems.imageUrl,
        author: rawNewsItems.author,
        status: rawNewsItems.status,
        publishedAt: rawNewsItems.publishedAt,
        createdAt: rawNewsItems.createdAt,
        source: {
          id: newsSources.id,
          name: newsSources.name,
          category: newsSources.category,
          defaultPrompt: newsSources.defaultPrompt,
        }
      })
      .from(rawNewsItems)
      .innerJoin(newsSources, eq(rawNewsItems.sourceId, newsSources.id))
      .where(eq(rawNewsItems.id, id))
      .limit(1);

    if (items.length === 0) {
      return NextResponse.json({ error: 'Raw news item not found' }, { status: 404 });
    }

    // Query matching draft if exists
    const drafts = await db
      .select()
      .from(articleDrafts)
      .where(eq(articleDrafts.rawNewsItemId, id))
      .limit(1);
    
    const draft = drafts.length > 0 ? drafts[0] : null;

    return NextResponse.json({
      ...items[0],
      draft,
    });
  } catch (error) {
    console.error('Failed to get raw news item details:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const validation = patchSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    const updated = await db
      .update(rawNewsItems)
      .set({
        status: validation.data.status,
      })
      .where(eq(rawNewsItems.id, id))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Raw news item not found' }, { status: 404 });
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('Failed to update raw news status:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
