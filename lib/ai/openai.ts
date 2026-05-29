import OpenAI from 'openai';
import { z } from 'zod';

// Zod Schema to validate AI output
export const aiResponseSchema = z.object({
  should_publish: z.boolean(),
  reason: z.string(),
  title: z.string(),
  slug: z.string(),
  excerpt: z.string(),
  content: z.string(), // Markdown formatted
  category: z.string(),
  tags: z.array(z.string()),
  seo_title: z.string(),
  seo_description: z.string(),
  source_name: z.string(),
  source_url: z.string(),
});

export type AIResponse = z.infer<typeof aiResponseSchema>;

// Initialize OpenAI client lazily
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (geminiKey && geminiKey !== 'your-gemini-api-key-here') {
      openaiClient = new OpenAI({
        apiKey: geminiKey,
        baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
      });
    } else if (openaiKey && openaiKey !== 'your-openai-api-key-here') {
      openaiClient = new OpenAI({
        apiKey: openaiKey,
      });
    } else {
      throw new Error('Neither GEMINI_API_KEY nor OPENAI_API_KEY environment variable is configured.');
    }
  }
  return openaiClient;
}

const SYSTEM_PROMPT = `Sen haber.ersurer.com için çalışan bir AI editörsün.

Görevin, kaynaklardan gelen haberleri birebir kopyalamadan; genel okuyucu kitlesine hitap eden, özgün, sade, anlaşılır, bilgilendirici ve merak uyandırıcı içeriklere dönüştürmektir.

Yazım tarzı:
* Türkçe yaz.
* Sade, net, akıcı ve profesyonel ol.
* Aşırı akademik veya ağır teknik jargon kullanma. Teknik terimleri okuyucunun anlayacağı şekilde açıkla.
* Samimi, tarafsız ve merak uyandıran bir ton kullan.
* Haberin bireylerin günlük yaşantısına, teknoloji algısına, geleceğe veya topluma ne gibi etkiler getireceğini açıkla.
* Clickbait başlık kullanma, ilgi çekici ama dürüst başlıklar üret.
* Haberi kopyalama, özgün cümlelerle yeniden yorumla.
* Orijinal haber kaynağını mutlaka belirt.

İçerik formatı (content alanı içinde tam olarak bu markdown şablonunu kullan):
# Başlık

## Kısa Özet
Haberde ne olduğunu 3-4 anlaşılır cümlede anlat.

## Neden Önemli?
Bu gelişmenin neden önemli olduğunu ve neden konuşulmaya değer olduğunu açıkla.

## Günlük Hayata ve Geleceğe Etkisi
Bu gelişmenin insanların günlük yaşantısına, teknoloji kullanımına, iş dünyasına veya geleceğe olan etkilerini ve getirdiği yenilikleri anlat.

## Editörün Yorumu
Gelişmeye yönelik kısa, nesnel ve vizyoner bir bakış açısı ekle. Bu adımın uzun vadeli önemini yorumla.

## Bilinmesi Gerekenler & İpuçları
Okuyucu için faydalı olabilecek 3-5 önemli detay, ipucu veya yapılması önerilen eylem maddesi yaz.

## Kaynak
Orijinal kaynak adını ve bağlantısını belirt.

Yayınlama kriterleri:
* Teknoloji, bilim, yapay zeka, internet kültürü, oyunlar, dijital yaşam, inovasyon, uzay, sürdürülebilirlik, ekonomi ve genel kültür alanındaki ilgi çekici gelişmeler yayınlanabilir.
* Tamamen alakasız yerel siyasi tartışmalar, suç haberleri, magazin dedikoduları veya spam içerikli duyurular yayınlanmamalıdır.
* Uygun değilse should_publish değerini false dön.

ÇIKTI FORMATI:
Kesinlikle geçerli bir JSON objesi dönmelisin. JSON yapısı şu alanları içermelidir:
{
  "should_publish": boolean,
  "reason": "Yayınlanma kriteri değerlendirmesi",
  "title": "Haber Başlığı",
  "slug": "url-uyumlu-slug",
  "excerpt": "Makalenin kısa özeti (SEO meta description olarak da kullanılabilir)",
  "content": "Yukarıda belirtilen markdown formatında hazırlanmış makale gövdesi",
  "category": "Kategori adı",
  "tags": ["etiket1", "etiket2"],
  "seo_title": "SEO Başlığı",
  "seo_description": "SEO Açıklaması",
  "source_name": "Kaynak Adı",
  "source_url": "Kaynak URL"
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
  modelName: string = 'gemini-1.5-flash'
): Promise<GenerateResult> {
  const client = getOpenAIClient();

  const userContent = `Aşağıdaki kaynak haberi, belirtilen yönergelere göre özgün bir makaleye dönüştür.
  
KULLANICI TALİMATI (PROMPT):
"${userPrompt}"

KAYNAK HABER BAŞLIĞI:
${newsTitle}

KAYNAK HABER MAÇ İÇERİĞİ:
${newsContent}`;

  try {
    const completion = await client.chat.completions.create({
      model: modelName,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const rawResponse = completion.choices[0]?.message?.content || null;
    const tokensUsed = completion.usage?.total_tokens || null;

    if (!rawResponse) {
      throw new Error('OpenAI returned an empty response.');
    }

    // Parse and validate using Zod
    const parsedData = JSON.parse(rawResponse);
    const validatedData = aiResponseSchema.parse(parsedData);

    return {
      data: validatedData,
      rawResponse,
      tokensUsed,
      modelUsed: modelName,
    };
  } catch (error: any) {
    console.error('OpenAI generation or validation error:', error);
    return {
      data: null,
      rawResponse: error.response?.data || null,
      tokensUsed: null,
      modelUsed: modelName,
      error: error.message || 'AI Generation failed',
    };
  }
}
