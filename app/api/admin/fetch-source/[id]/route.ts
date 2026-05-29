import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { db } from '@/db';
import { newsSources, rawNewsItems, fetchLogs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { fetchAndParseFeed, extractImageUrl, cleanHtml } from '@/lib/rss/parser';
import { generateContentHash } from '@/lib/hash/generator';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  
  // 1. Get the source details
  const sourceList = await db
    .select()
    .from(newsSources)
    .where(eq(newsSources.id, id))
    .limit(1);

  if (sourceList.length === 0) {
    return NextResponse.json({ error: 'News source not found' }, { status: 404 });
  }

  const source = sourceList[0];
  let itemsAdded = 0;
  
  try {
    // 2. Fetch and parse feed
    const feed = await fetchAndParseFeed(source.url);
    
    // 3. Process each item
    for (const item of feed.items) {
      const title = item.title || 'Başlıksız Haber';
      const link = item.link || item.guid || '';
      if (!link) continue; // Skip if no link is provided
      
      const pubDate = item.pubDate || item.isoDate ? new Date(item.pubDate || item.isoDate || '') : new Date();
      const contentHash = generateContentHash(title, link, pubDate);

      // Check if hash already exists in DB
      const existing = await db
        .select({ id: rawNewsItems.id })
        .from(rawNewsItems)
        .where(eq(rawNewsItems.contentHash, contentHash))
        .limit(1);

      if (existing.length > 0) {
        continue; // Skip duplicates
      }

      const imageUrl = extractImageUrl(item);
      const summary = cleanHtml(item.contentSnippet || item.summary);
      const content = cleanHtml(item.content || item['content:encoded']);

      // Save to raw_news_items
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

    // 4. Update news source with success stats
    await db
      .update(newsSources)
      .set({
        lastFetchedAt: new Date(),
        lastFetchStatus: 'success',
        lastFetchError: null,
        updatedAt: new Date(),
      })
      .where(eq(newsSources.id, source.id));

    // 5. Add to fetch logs
    await db.insert(fetchLogs).values({
      sourceId: source.id,
      status: 'success',
      itemsFetched: itemsAdded,
      errorMessage: null,
    });

    return NextResponse.json({ success: true, addedCount: itemsAdded });
  } catch (error: any) {
    console.error(`Error fetching source ${source.name}:`, error);

    // Update news source with error stats
    const errorMsg = error.message || 'Bilinmeyen bağlantı hatası';
    await db
      .update(newsSources)
      .set({
        lastFetchedAt: new Date(),
        lastFetchStatus: 'error',
        lastFetchError: errorMsg,
        updatedAt: new Date(),
      })
      .where(eq(newsSources.id, source.id));

    // Add to fetch logs
    await db.insert(fetchLogs).values({
      sourceId: source.id,
      status: 'error',
      itemsFetched: 0,
      errorMessage: errorMsg,
    });

    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
