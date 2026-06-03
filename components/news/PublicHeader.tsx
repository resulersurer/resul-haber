'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Rate {
  code: string;
  name: string;
  price: string;
  change: string;
  direction: string;
  symbol: string;
}

export default function PublicHeader() {
  const [rates, setRates] = useState<Rate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/exchange-rates')
      .then((res) => res.json())
      .then((data) => {
        setRates(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load exchange rates in header:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex flex-col sticky top-0 z-50 shadow-sm">
      {/* Live Market Rates Topbar */}
      <div className="bg-primary border-b border-slate-800 text-slate-350 text-[11px] font-medium py-2 px-4 sm:px-6 select-none">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center space-x-1.5 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] tracking-wider uppercase font-bold text-slate-400">Piyasalar:</span>
          </div>
          
          <div className="flex items-center space-x-6 overflow-x-auto scrollbar-none whitespace-nowrap pl-4">
            {loading ? (
              <span className="text-slate-500 animate-pulse text-[10px]">Piyasa verileri yükleniyor...</span>
            ) : (
              rates.map((rate) => {
                const isUp = rate.direction === 'moneyUp' || rate.change.startsWith('+');
                return (
                  <div key={rate.code} className="flex items-center space-x-1.5 text-[11px]">
                    <span className="text-slate-400 font-bold uppercase">{rate.name}</span>
                    <span className="text-slate-100 font-bold">
                      {rate.symbol === 'TL' ? '' : rate.symbol}
                      {rate.price}
                      {rate.symbol === 'TL' ? ' TL' : ''}
                    </span>
                    <span className={`text-[10px] font-extrabold flex items-center gap-0.5 ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isUp ? '▲' : '▼'} {rate.change}%
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation Header */}
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
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
    </div>
  );
}
