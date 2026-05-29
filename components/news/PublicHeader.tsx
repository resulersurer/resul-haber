'use client';

import React from 'react';
import Link from 'next/link';

export default function PublicHeader() {
  return (
    <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <Link href="/news" className="flex flex-col">
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
            ersurer.com
          </span>
          <span className="text-[10px] font-semibold text-slate-500 tracking-wider uppercase">
            Teknoloji ve Girişimcilik Analizleri
          </span>
        </Link>

        <nav className="flex items-center space-x-6">
          <Link href="/news" className="text-sm font-medium text-slate-350 hover:text-emerald-400 transition-colors">
            Tüm Haberler
          </Link>
          <Link href="/admin" className="text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300 px-3.5 py-1.5 rounded-lg hover:bg-slate-800 hover:text-slate-100 transition-all">
            Yönetim Paneli
          </Link>
        </nav>
      </div>
    </header>
  );
}
