import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Sadece görsel dosyaları yüklenebilir' }, { status: 400 });
    }

    if (file.size > 32 * 1024 * 1024) {
      return NextResponse.json({ error: 'Dosya boyutu 32MB\'ı geçemez' }, { status: 400 });
    }

    const apiKey = process.env.IMGBB_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'IMGBB_API_KEY ortam değişkeni ayarlanmamış' }, { status: 500 });
    }

    // Dosyayı base64'e çevir
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    // ImgBB API'sine yükle
    const imgbbForm = new FormData();
    imgbbForm.append('key', apiKey);
    imgbbForm.append('image', base64);
    imgbbForm.append('name', `article-${Date.now()}`);

    const imgbbRes = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: imgbbForm,
    });

    const imgbbData = await imgbbRes.json();

    if (!imgbbData.success) {
      throw new Error(imgbbData.error?.message || 'ImgBB yükleme başarısız');
    }

    return NextResponse.json({
      imageUrl: imgbbData.data.url,
      displayUrl: imgbbData.data.display_url,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Yükleme başarısız' },
      { status: 500 }
    );
  }
}
