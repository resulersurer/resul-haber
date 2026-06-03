'use client';

import React from 'react';
import Link from 'next/link';

export default function PublicHeader() {
  return (
    <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <Link href="/news" className="flex flex-col group">
          <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-link bg-clip-text text-transparent group-hover:to-accent transition-all duration-300">
            ersurer.com
          </span>
          <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mt-0.5">
            Teknoloji ve Girişimcilik Analizleri
          </span>
        </Link>

        <nav className="flex items-center space-x-6">
          <Link href="/news" className="text-sm font-semibold text-slate-600 hover:text-accent transition-colors">
            Tüm Haberler
          </Link>
          <Link 
            href="/admin" 
            className="text-xs font-bold bg-primary text-white px-4 py-2 rounded-lg hover:bg-accent transition-all shadow-sm hover:shadow-md active:scale-98"
          >
            Yönetim Paneli
          </Link>
        </nav>
      </div>
    </header>
  );
}
