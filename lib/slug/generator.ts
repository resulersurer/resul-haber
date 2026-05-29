import { db } from '@/db';
import { articleDrafts, publishedArticles } from '@/db/schema';
import { eq, or } from 'drizzle-orm';

export function slugify(text: string): string {
  let str = text.trim().toLowerCase();

  // Turkish character mapping
  const turkishChars: { [key: string]: string } = {
    'ç': 'c', 'ğ': 'g', 'ı': 'i', 'i': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u',
    'Ç': 'c', 'Ğ': 'g', 'İ': 'i', 'Ö': 'o', 'Ş': 's', 'Ü': 'u'
  };

  for (const char in turkishChars) {
    str = str.replace(new RegExp(char, 'g'), turkishChars[char]);
  }

  // Replace non-alphanumeric characters with hyphen
  str = str
    .replace(/[^a-z0-9 -]/g, '') // remove invalid chars
    .replace(/\s+/g, '-')        // collapse whitespace and replace by -
    .replace(/-+/g, '-');        // collapse dashes

  // Trim leading/trailing dashes
  return str.replace(/^-+|-+$/g, '');
}

export async function generateUniqueSlug(title: string): Promise<string> {
  const baseSlug = slugify(title);
  let slug = baseSlug;
  let counter = 1;
  let isUnique = false;

  while (!isUnique) {
    // Check if slug exists in drafts or published
    const draftMatch = await db
      .select({ id: articleDrafts.id })
      .from(articleDrafts)
      .where(eq(articleDrafts.slug, slug))
      .limit(1);

    const publishedMatch = await db
      .select({ id: publishedArticles.id })
      .from(publishedArticles)
      .where(eq(publishedArticles.slug, slug))
      .limit(1);

    if (draftMatch.length === 0 && publishedMatch.length === 0) {
      isUnique = true;
    } else {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  return slug;
}
