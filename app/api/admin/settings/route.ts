import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { db } from '@/db';
import { systemSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const patchSettingsSchema = z.object({
  global_default_prompt: z.string().min(1, 'Prompt boş olamaz').optional(),
  openai_model: z.string().min(1).optional(),
  content_length_preference: z.enum(['short', 'medium', 'long']).optional(),
  publishing_mode: z.enum(['manual', 'automatic']).optional(),
});

const DEFAULT_SETTINGS = {
  global_default_prompt: 'Bu kaynak haberi, genel okuyucu kitlesine hitap edecek şekilde özgün bir haber analizine dönüştür. Haberi kopyalama. Gelişmenin günlük hayata, teknoloji algısına ve geleceğe olan etkilerini açıkla. Sade, akıcı bir Türkçe kullan. Ağır teknik terimlerden kaçın ve terimleri açıkla. Başlık dikkat çekici ama dürüst, SEO uyumlu bir başlık olsun.',
  openai_model: 'gemini-1.5-flash',
  content_length_preference: 'medium',
  publishing_mode: 'manual',
};

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const settingsList = await db.select().from(systemSettings);
    
    // Map list to key-value object
    const settingsObj: Record<string, string> = {};
    settingsList.forEach(s => {
      settingsObj[s.key] = s.value;
    });

    // Populate missing settings with defaults
    const finalSettings = {
      global_default_prompt: settingsObj['global_default_prompt'] || DEFAULT_SETTINGS.global_default_prompt,
      openai_model: settingsObj['openai_model'] || DEFAULT_SETTINGS.openai_model,
      content_length_preference: settingsObj['content_length_preference'] || DEFAULT_SETTINGS.content_length_preference,
      publishing_mode: settingsObj['publishing_mode'] || DEFAULT_SETTINGS.publishing_mode,
    };

    return NextResponse.json(finalSettings);
  } catch (error) {
    console.error('Failed to get system settings:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validation = patchSettingsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    const updates = validation.data;
    
    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined) continue;

      await db
        .insert(systemSettings)
        .values({
          key,
          value,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: systemSettings.key,
          set: {
            value,
            updatedAt: new Date(),
          }
        });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update system settings:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
