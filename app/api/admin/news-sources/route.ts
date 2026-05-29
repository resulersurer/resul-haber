import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { db } from '@/db';
import { newsSources } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { z } from 'zod';

const createSourceSchema = z.object({
  name: z.string().min(1, 'Kaynak adı zorunludur'),
  type: z.enum(['rss', 'api']),
  url: z.string().url('Geçerli bir URL girilmelidir'),
  category: z.string().min(1, 'Kategori zorunludur'),
  isActive: z.boolean().default(true),
  defaultPrompt: z.string().optional().nullable(),
  fetchIntervalMinutes: z.number().int().min(5, 'En az 5 dakika olmalıdır').default(60),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sources = await db
      .select()
      .from(newsSources)
      .orderBy(desc(newsSources.createdAt));
    return NextResponse.json(sources);
  } catch (error) {
    console.error('Failed to list news sources:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validation = createSourceSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    const newSource = await db.insert(newsSources).values({
      name: validation.data.name,
      type: validation.data.type,
      url: validation.data.url,
      category: validation.data.category,
      isActive: validation.data.isActive,
      defaultPrompt: validation.data.defaultPrompt,
      fetchIntervalMinutes: validation.data.fetchIntervalMinutes,
      updatedAt: new Date(),
    }).returning();

    return NextResponse.json(newSource[0], { status: 201 });
  } catch (error) {
    console.error('Failed to create news source:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
