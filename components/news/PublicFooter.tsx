import React from 'react';
import Link from 'next/link';

export default function PublicFooter() {
  return (
    <footer className="border-t border-slate-800 bg-primary py-12 mt-auto text-slate-400 text-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
        <div>
          <p className="font-bold text-slate-200 text-sm">haber.ersurer.com © {new Date().getFullYear()}</p>
          <p className="mt-1.5 text-slate-400">Güncel teknoloji, yapay zeka, bilim, internet kültürü ve dijital yaşam haberleri.</p>
        </div>
        <div className="flex space-x-6">
          <Link href="/news" className="hover:text-accent transition-colors font-medium">Haberler</Link>
          <Link href="/admin/login" className="hover:text-accent transition-colors font-medium">Giriş Yap</Link>
        </div>
      </div>
    </footer>
  );
}
