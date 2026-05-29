import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { newsSources, rawNewsItems, fetchLogs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { fetchAndParseFeed, extractImageUrl, cleanHtml } from '@/lib/rss/parser';
import { generateContentHash } from '@/lib/hash/generator';

export async function POST(req: NextRequest) {
  // 1. Verify CRON_SECRET
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Fetch all active sources
  const activeSources = await db
    .select()
    .from(newsSources)
    .where(eq(newsSources.isActive, true));

  const results = [];

  // 3. Process each source independently
  for (const source of activeSources) {
    let itemsAdded = 0;
    try {
      const feed = await fetchAndParseFeed(source.url);
      
      for (const item of feed.items) {
        const title = item.title || 'Başlıksız Haber';
        const link = item.link || item.guid || '';
        if (!link) continue;
        
        const pubDate = item.pubDate || item.isoDate ? new Date(item.pubDate || item.isoDate || '') : new Date();
        const contentHash = generateContentHash(title, link, pubDate);

        // Deduplication
        const existing = await db
          .select({ id: rawNewsItems.id })
          .from(rawNewsItems)
          .where(eq(rawNewsItems.contentHash, contentHash))
          .limit(1);

        if (existing.length > 0) continue;

        const imageUrl = extractImageUrl(item);
        const summary = cleanHtml(item.contentSnippet || item.summary);
        const content = cleanHtml(item.content || item['content:encoded']);

        await db.insert(rawNewsItems).values({
          sourceId: source.id,
          externalId: item.guid || null,
          externalUrl: link,
          title,
          summary,
          content,
          imageUrl,
          author: item.creator || item.author || null,
          publishedAt: pubDate,
          rawPayload: item,
          contentHash,
          status: 'new',
        });

        itemsAdded++;
      }

      // Update success metadata
      await db
        .update(newsSources)
        .set({
          lastFetchedAt: new Date(),
          lastFetchStatus: 'success',
          lastFetchError: null,
          updatedAt: new Date(),
        })
        .where(eq(newsSources.id, source.id));

      await db.insert(fetchLogs).values({
        sourceId: source.id,
        status: 'success',
        itemsFetched: itemsAdded,
      });

      results.push({ sourceId: source.id, status: 'success', added: itemsAdded });
    } catch (error: any) {
      console.error(`Cron error fetching source ${source.name}:`, error);
      const errorMsg = error.message || 'Cron bağlantı hatası';

      // Update failure metadata
      await db
        .update(newsSources)
        .set({
          lastFetchedAt: new Date(),
          lastFetchStatus: 'error',
          lastFetchError: errorMsg,
          updatedAt: new Date(),
        })
        .where(eq(newsSources.id, source.id));

      await db.insert(fetchLogs).values({
        sourceId: source.id,
        status: 'error',
        itemsFetched: 0,
        errorMessage: errorMsg,
      });

      results.push({ sourceId: source.id, status: 'error', error: errorMsg });
    }
  }

  return NextResponse.json({ success: true, processedSources: results.length, details: results });
}

// Next.js config to allow both GET and POST for Cron trigger testing
export async function GET(req: NextRequest) {
  // Support GET only if the cron secret is passed in URL query for manual browser testing
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get('secret');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || secret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Trigger POST handler behavior
  const fakeRequest = new NextRequest(req.url, {
    method: 'POST',
    headers: new Headers({
      'Authorization': `Bearer ${cronSecret}`
    })
  });
  return POST(fakeRequest);
}
