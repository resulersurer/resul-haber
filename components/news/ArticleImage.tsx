'use client';

import { useState } from 'react';
import { ImageOff } from 'lucide-react';

interface ArticleImageProps {
  src: string | null;
  alt: string;
  category?: string;
  className?: string;
  aspectClass?: string; // e.g. "aspect-video"
}

// Kategori → gradient eşlemesi
const CATEGORY_GRADIENTS: Record<string, string> = {
  'yapay zeka': 'from-violet-900/60 via-slate-900 to-slate-950',
  'ai': 'from-violet-900/60 via-slate-900 to-slate-950',
  'teknoloji': 'from-blue-900/60 via-slate-900 to-slate-950',
  'bilim': 'from-cyan-900/60 via-slate-900 to-slate-950',
  'uzay': 'from-indigo-900/60 via-slate-900 to-slate-950',
  'oyunlar': 'from-emerald-900/60 via-slate-900 to-slate-950',
  'ekonomi': 'from-amber-900/50 via-slate-900 to-slate-950',
  'internet': 'from-teal-900/60 via-slate-900 to-slate-950',
  'inovasyon': 'from-rose-900/50 via-slate-900 to-slate-950',
};

function getGradient(category?: string) {
  if (!category) return 'from-slate-800 via-slate-900 to-slate-950';
  const key = category.toLowerCase();
  for (const [k, v] of Object.entries(CATEGORY_GRADIENTS)) {
    if (key.includes(k)) return v;
  }
  return 'from-slate-800 via-slate-900 to-slate-950';
}

export default function ArticleImage({
  src,
  alt,
  category,
  className = 'w-full h-full object-cover',
  aspectClass = 'aspect-video',
}: ArticleImageProps) {
  const [failed, setFailed] = useState(false);
  const gradient = getGradient(category);

  if (!src || failed) {
    return (
      <div
        className={`${aspectClass} w-full bg-gradient-to-br ${gradient} flex flex-col items-center justify-center gap-3 select-none`}
      >
        <ImageOff className="w-8 h-8 text-slate-600" strokeWidth={1.5} />
        <span className="text-[10px] text-slate-600 font-semibold uppercase tracking-widest">
          {category || 'Görsel'}
        </span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
