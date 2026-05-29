import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { db } from '@/db';
import { newsSources } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const updateSourceSchema = z.object({
  name: z.string().min(1, 'Kaynak adı zorunludur').optional(),
  type: z.enum(['rss', 'api']).optional(),
  url: z.string().url('Geçerli bir URL girilmelidir').optional(),
  category: z.string().min(1, 'Kategori zorunludur').optional(),
  isActive: z.boolean().optional(),
  defaultPrompt: z.string().optional().nullable(),
  fetchIntervalMinutes: z.number().int().min(5, 'En az 5 dakika olmalıdır').optional(),
});

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
    const validation = updateSourceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    const updatedSource = await db
      .update(newsSources)
      .set({
        ...validation.data,
        updatedAt: new Date(),
      })
      .where(eq(newsSources.id, id))
      .returning();

    if (updatedSource.length === 0) {
      return NextResponse.json({ error: 'News source not found' }, { status: 404 });
    }

    return NextResponse.json(updatedSource[0]);
  } catch (error) {
    console.error('Failed to update news source:', error);
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
    const deletedSource = await db
      .delete(newsSources)
      .where(eq(newsSources.id, id))
      .returning();

    if (deletedSource.length === 0) {
      return NextResponse.json({ error: 'News source not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'News source deleted successfully' });
  } catch (error) {
    console.error('Failed to delete news source:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
