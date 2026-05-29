import Parser from 'rss-parser';
import sanitizeHtml from 'sanitize-html';

const parser = new Parser();

export async function fetchAndParseFeed(url: string, timeoutMs: number = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'haber.ersurer.com RSS Parser/1.0',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
      next: { revalidate: 0 } // Bypass Next.js fetch caching
    });
    
    clearTimeout(id);

    if (!response.ok) {
      throw new Error(`HTTP hatası! Durum: ${response.status}`);
    }

    const xml = await response.text();
    const feed = await parser.parseString(xml);
    return feed;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

export function extractImageUrl(item: any): string | null {
  // 1. Check enclosure
  if (item.enclosure?.url) {
    return item.enclosure.url;
  }

  // 2. Check media:content / media:thumbnail
  const mediaContent = item['media:content'] || item['media:thumbnail'] || item['content:encoded'];
  if (mediaContent) {
    if (Array.isArray(mediaContent) && mediaContent[0]?.$.url) {
      return mediaContent[0].$.url;
    }
    if (mediaContent.$?.url) {
      return mediaContent.$.url;
    }
  }

  // 3. Search inline HTML for image tags
  const searchHtml = `${item.content || ''}${item['content:encoded'] || ''}${item.contentSnippet || ''}`;
  const imgRegex = /<img[^>]+src="([^">]+)"/i;
  const match = searchHtml.match(imgRegex);
  if (match && match[1]) {
    // If it is a relative path or protocol-less, keep it or skip it, let's return it
    return match[1];
  }

  return null;
}

export function cleanHtml(html: string | undefined): string {
  if (!html) return '';
  return sanitizeHtml(html, {
    allowedTags: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
      'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div',
      'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'img'
    ],
    allowedAttributes: {
      a: ['href', 'name', 'target'],
      img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
      '*': ['class']
    },
    allowedSchemes: ['http', 'https', 'mailto']
  });
}
