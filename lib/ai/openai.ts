import { z } from 'zod';

// Zod Schema to validate AI output
export const aiResponseSchema = z.object({
  should_publish: z.boolean(),
  reason: z.string(),
  title: z.string(),
  slug: z.string(),
  excerpt: z.string(),
  content: z.string(),
  category: z.string(),
  tags: z.array(z.string()),
  seo_title: z.string(),
  seo_description: z.string(),
  source_name: z.string(),
  source_url: z.string(),
});

export type AIResponse = z.infer<typeof aiResponseSchema>;

const SYSTEM_PROMPT = `Sen haber.ersurer.com için çalışan bir AI editörsün.

Görevin, kaynaklardan gelen haberleri birebir kopyalamadan; genel okuyucu kitlesine hitap eden, özgün, sade, anlaşılır, bilgilendirici ve merak uyandırıcı içeriklere dönüştürmektir.

Yazım tarzı:
* Türkçe yaz.
* Sade, net, akıcı ve profesyonel ol.
* Aşırı akademik veya ağır teknik jargon kullanma.
* Samimi, tarafsız ve merak uyandıran bir ton kullan.
* Clickbait başlık kullanma, ilgi çekici ama dürüst başlıklar üret.
* Haberi kopyalama, özgün cümlelerle yeniden yorumla.

İçerik formatı (content alanı içinde tam olarak bu markdown şablonunu kullan):
# Başlık

## Kısa Özet
Haberde ne olduğunu 3-4 anlaşılır cümlede anlat.

## Neden Önemli?
Bu gelişmenin neden önemli olduğunu açıkla.

## Günlük Hayata ve Geleceğe Etkisi
Bu gelişmenin insanların günlük yaşantısına etkilerini anlat.

## Editörün Yorumu
Gelişmeye yönelik kısa, nesnel ve vizyoner bir bakış açısı ekle.

## Bilinmesi Gerekenler & İpuçları
Okuyucu için faydalı 3-5 önemli detay yaz.

## Kaynak
Orijinal kaynak adını ve bağlantısını belirt.

Yayınlama kriterleri:
* Teknoloji, bilim, yapay zeka, internet, oyunlar, dijital yaşam, inovasyon, uzay, ekonomi alanları yayınlanabilir.
* Alakasız siyasi tartışmalar, suç haberleri, magazin veya spam içerik yayınlanmamalıdır.
* Uygun değilse should_publish: false dön.

ÇIKTI FORMATI - Sadece geçerli JSON döndür, başında/sonunda \`\`\`json KULLANMA:
{
  "should_publish": boolean,
  "reason": "string",
  "title": "string",
  "slug": "string",
  "excerpt": "string",
  "content": "string",
  "category": "string",
  "tags": ["string"],
  "seo_title": "string",
  "seo_description": "string",
  "source_name": "string",
  "source_url": "string"
}`;

interface GenerateResult {
  data: AIResponse | null;
  rawResponse: string | null;
  tokensUsed: number | null;
  modelUsed: string;
  error?: string;
}

export async function generateArticleDraft(
  newsTitle: string,
  newsContent: string,
  userPrompt: string,
  modelName: string = 'gemini-2.5-flash-lite'
): Promise<GenerateResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      data: null, rawResponse: null, tokensUsed: null,
      modelUsed: modelName,
      error: 'GEMINI_API_KEY ortam değişkeni ayarlanmamış.',
    };
  }

  // Bu API anahtarıyla çalışan model: gemini-2.5-flash-lite
  // gemini-1.5-flash bu anahtarda mevcut değil
  // gemini-2.0-flash ve gemini-2.0-flash-lite kota limit=0 (ücretsiz tier)
  const WORKING_MODEL = 'gemini-2.5-flash-lite';
  let resolvedModel = modelName;
  if (!resolvedModel.startsWith('gemini-2.5-flash-lite')) {
    resolvedModel = WORKING_MODEL;
  }

  const prompt = `${SYSTEM_PROMPT}

---

Aşağıdaki kaynak haberi özgün bir makaleye dönüştür.

KULLANICI TALİMATI: "${userPrompt}"

HABER BAŞLIĞI: ${newsTitle}

HABER İÇERİĞİ:
${newsContent}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${resolvedModel}:generateContent?key=${apiKey}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Gemini API hatası: ${res.status} ${res.statusText}. ${errText}`);
    }

    const json = await res.json();
    const rawResponse: string = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const tokensUsed: number | null = json?.usageMetadata?.totalTokenCount ?? null;

    if (!rawResponse) {
      throw new Error('Gemini boş yanıt döndürdü.');
    }

    // Markdown code block varsa temizle
    let cleaned = rawResponse.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
    }

    const parsedData = JSON.parse(cleaned);
    const validatedData = aiResponseSchema.parse(parsedData);

    return {
      data: validatedData,
      rawResponse,
      tokensUsed,
      modelUsed: resolvedModel,
    };
  } catch (error: any) {
    console.error('Gemini REST API error:', error);
    return {
      data: null,
      rawResponse: null,
      tokensUsed: null,
      modelUsed: resolvedModel,
      error: error.message || 'AI üretimi başarısız',
    };
  }
}
