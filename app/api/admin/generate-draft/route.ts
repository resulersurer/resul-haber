import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { db } from '@/db';
import { rawNewsItems, newsSources, articleDrafts, aiGenerationLogs, systemSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { generateArticleDraft } from '@/lib/ai/openai';
import { generateUniqueSlug } from '@/lib/slug/generator';
import { z } from 'zod';

const generateDraftSchema = z.object({
  rawNewsItemId: z.string().uuid('Geçerli bir UUID olmalıdır'),
  prompt: z.string().min(1, 'Prompt boş bırakılamaz'),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validation = generateDraftSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    const { rawNewsItemId, prompt } = validation.data;

    // 1. Get raw news details
    const rawItems = await db
      .select({
        id: rawNewsItems.id,
        title: rawNewsItems.title,
        content: rawNewsItems.content,
        summary: rawNewsItems.summary,
        imageUrl: rawNewsItems.imageUrl,
        externalUrl: rawNewsItems.externalUrl,
        sourceId: rawNewsItems.sourceId,
        source: {
          id: newsSources.id,
          name: newsSources.name,
          category: newsSources.category,
        }
      })
      .from(rawNewsItems)
      .innerJoin(newsSources, eq(rawNewsItems.sourceId, newsSources.id))
      .where(eq(rawNewsItems.id, rawNewsItemId))
      .limit(1);

    if (rawItems.length === 0) {
      return NextResponse.json({ error: 'Raw news item not found' }, { status: 404 });
    }

    const rawItem = rawItems[0];
    const newsContent = rawItem.content || rawItem.summary || '';

    // 2. Fetch the model to use from settings
    const settings = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, 'openai_model'))
      .limit(1);
    
    const modelUsed = settings.length > 0 ? settings[0].value : 'gemini-2.5-flash-lite';

    // 3. Generate article draft using OpenAI
    const result = await generateArticleDraft(
      rawItem.title,
      newsContent,
      prompt,
      modelUsed
    );

    // 4. Log AI Generation attempt
    await db.insert(aiGenerationLogs).values({
      rawNewsItemId: rawItem.id,
      status: result.data ? 'success' : 'error',
      prompt,
      responseText: result.rawResponse,
      errorMessage: result.error || null,
      tokensUsed: result.tokensUsed,
      modelUsed: result.modelUsed,
    });

    if (!result.data) {
      return NextResponse.json({ 
        error: `AI üretimi başarısız oldu: ${result.error || 'Zod validation hatası'}` 
      }, { status: 500 });
    }

    const aiOutput = result.data;

    // 5. If AI decides it shouldn't publish
    if (!aiOutput.should_publish) {
      return NextResponse.json({
        should_publish: false,
        reason: aiOutput.reason,
        rawOutput: aiOutput
      });
    }

    // 6. Generate a unique slug
    const uniqueSlug = await generateUniqueSlug(aiOutput.title);

    // 7. Save draft in database (inside a database write context)
    const newDraft = await db.insert(articleDrafts).values({
      rawNewsItemId: rawItem.id,
      sourceId: rawItem.sourceId,
      aiPrompt: prompt,
      title: aiOutput.title,
      slug: uniqueSlug,
      excerpt: aiOutput.excerpt,
      content: aiOutput.content,
      category: aiOutput.category || rawItem.source.category,
      tags: aiOutput.tags || [],
      seoTitle: aiOutput.seo_title || aiOutput.title,
      seoDescription: aiOutput.seo_description || aiOutput.excerpt,
      // Source image URL is set, but will be reviewed/confirmed in UI
      featuredImageUrl: rawItem.imageUrl || null, 
      sourceName: aiOutput.source_name || rawItem.source.name,
      sourceUrl: aiOutput.source_url || rawItem.externalUrl,
      status: 'draft',
      aiModel: modelUsed,
      updatedAt: new Date(),
    }).returning();

    // 8. Update raw news status to 'draft_created'
    await db
      .update(rawNewsItems)
      .set({ status: 'draft_created' })
      .where(eq(rawNewsItems.id, rawItem.id));

    return NextResponse.json({
      should_publish: true,
      draft: newDraft[0]
    });
  } catch (error: any) {
    console.error('API generate-draft handler error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
