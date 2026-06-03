import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { db } from '@/db';
import { articleDrafts, rawNewsItems } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const updateDraftSchema = z.object({
  title: z.string().min(1, 'Başlık boş olamaz').optional(),
  slug: z.string().min(1, 'Slug boş olamaz').optional(),
  excerpt: z.string().min(1, 'Özet boş olamaz').optional(),
  content: z.string().min(1, 'İçerik boş olamaz').optional(),
  category: z.string().min(1, 'Kategori boş olamaz').optional(),
  tags: z.array(z.string()).optional(),
  seoTitle: z.string().min(1, 'SEO başlığı boş olamaz').optional(),
  seoDescription: z.string().min(1, 'SEO açıklaması boş olamaz').optional(),
  featuredImageUrl: z
    .string()
    .refine(
      (val) => !val || val.startsWith('http://') || val.startsWith('https://') || val.startsWith('data:image/'),
      {
        message: 'Geçerli bir URL veya görsel verisi (Base64) olmalıdır',
      }
    )
    .optional()
    .nullable(),
  sourceName: z.string().min(1, 'Kaynak adı boş olamaz').optional(),
  sourceUrl: z.string().url('Geçerli bir URL olmalıdır').optional(),
  status: z.enum(['draft', 'ready', 'published']).optional(),
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
    const drafts = await db
      .select()
      .from(articleDrafts)
      .where(eq(articleDrafts.id, id))
      .limit(1);

    if (drafts.length === 0) {
      return NextResponse.json({ error: 'Article draft not found' }, { status: 404 });
    }

    return NextResponse.json(drafts[0]);
  } catch (error) {
    console.error('Failed to get article draft details:', error);
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
    const validation = updateDraftSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    const updated = await db
      .update(articleDrafts)
      .set({
        ...validation.data,
        updatedAt: new Date(),
      })
      .where(eq(articleDrafts.id, id))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Article draft not found' }, { status: 404 });
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('Failed to update article draft:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

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
    
    // Get the draft to check rawNewsItemId
    const draftRes = await db
      .select({ rawNewsItemId: articleDrafts.rawNewsItemId })
      .from(articleDrafts)
      .where(eq(articleDrafts.id, id))
      .limit(1);

    if (draftRes.length === 0) {
      return NextResponse.json({ error: 'Article draft not found' }, { status: 404 });
    }

    const rawNewsItemId = draftRes[0].rawNewsItemId;

    // Delete the draft
    await db.delete(articleDrafts).where(eq(articleDrafts.id, id));

    // If there was a raw news item, revert its status to 'new'
    if (rawNewsItemId) {
      await db
        .update(rawNewsItems)
        .set({ status: 'new' })
        .where(eq(rawNewsItems.id, rawNewsItemId));
    }

    return NextResponse.json({ message: 'Article draft deleted successfully' });
  } catch (error) {
    console.error('Failed to delete article draft:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
