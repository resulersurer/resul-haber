import React from 'react';
import Link from 'next/link';

export default function PublicFooter() {
  return (
    <footer className="border-t border-slate-900 bg-slate-950 py-10 mt-auto text-slate-500 text-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
        <div>
          <p className="font-semibold text-slate-400">haber.ersurer.com © {new Date().getFullYear()}</p>
          <p className="mt-1">Güncel teknoloji, yapay zeka, bilim, internet kültürü ve dijital yaşam haberleri.</p>
        </div>
        <div className="flex space-x-6">
          <Link href="/news" className="hover:text-slate-300 transition-colors">Haberler</Link>
          <Link href="/admin/login" className="hover:text-slate-300 transition-colors">Giriş Yap</Link>
        </div>
      </div>
    </footer>
  );
}
