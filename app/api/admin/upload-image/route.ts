import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { put } from '@vercel/blob';

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

    // Dosya tipi kontrolü
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Sadece görsel dosyaları yüklenebilir' }, { status: 400 });
    }

    // Dosya boyutu kontrolü (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Dosya boyutu 5MB\'ı geçemez' }, { status: 400 });
    }

    // Dosya adını temizle ve benzersiz yap
    const ext = file.name.split('.').pop() || 'jpg';
    const safeName = `articles/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    // Vercel Blob'a yükle
    const blob = await put(safeName, file, {
      access: 'public',
    });

    return NextResponse.json({ imageUrl: blob.url });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Yükleme başarısız' },
      { status: 500 }
    );
  }
}
