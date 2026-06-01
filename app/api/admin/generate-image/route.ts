import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { title, category } = await req.json();
    if (!title) {
      return NextResponse.json({ error: 'title gerekli' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY ayarlanmamış' }, { status: 500 });
    }

    // 1. Gemini ile İngilizce arama anahtar kelimeleri üret
    const prompt = `Aşağıdaki haber başlığı için Unsplash'ta arama yapmak üzere 3 İngilizce anahtar kelime üret.
Sadece kelimeleri virgülle ayırarak döndür, başka hiçbir şey yazma.
Soyut veya genel kelimeler değil, görselde ne olduğunu net anlatan kelimeler seç.

Haber Başlığı: ${title}
Kategori: ${category || ''}

Örnek çıktı: artificial intelligence, robot, technology`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 50 },
        }),
      }
    );

    if (!geminiRes.ok) {
      throw new Error(`Gemini API hatası: ${geminiRes.status}`);
    }

    const geminiData = await geminiRes.json();
    const keywords = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text
      ?.trim()
      ?.replace(/\n/g, ',')
      ?.split(',')
      ?.map((k: string) => k.trim().toLowerCase().replace(/\s+/g, '-'))
      ?.filter(Boolean)
      ?.slice(0, 3)
      ?.join(',') || 'technology,news';

    // 2. Unsplash source URL'sini resolve et → gerçek resim URL'sini al
    const unsplashSourceUrl = `https://source.unsplash.com/1280x720/?${encodeURIComponent(keywords)}`;

    let finalImageUrl = unsplashSourceUrl;
    try {
      const imgRes = await fetch(unsplashSourceUrl, {
        method: 'GET',
        redirect: 'follow',
      });
      // Redirect sonrası gerçek URL'yi al
      finalImageUrl = imgRes.url || unsplashSourceUrl;
    } catch {
      // Redirect takip edilemezse source URL'yi kullan
      finalImageUrl = unsplashSourceUrl;
    }

    return NextResponse.json({
      imageUrl: finalImageUrl,
      keywords,
    });
  } catch (error: any) {
    console.error('generate-image error:', error);
    return NextResponse.json({ error: error.message || 'Görsel üretilemedi' }, { status: 500 });
  }
}
