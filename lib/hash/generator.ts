import crypto from 'crypto';

export function generateContentHash(title: string, externalUrl: string, publishedAt: string | Date | null): string {
  const dateStr = publishedAt 
    ? (publishedAt instanceof Date ? publishedAt.toISOString() : String(publishedAt)) 
    : '';
  const rawString = `${title.trim()}|${externalUrl.trim()}|${dateStr}`;
  return crypto.createHash('md5').update(rawString).digest('hex');
}
