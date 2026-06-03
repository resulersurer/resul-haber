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

interface Weather {
  city: string;
  temp: number;
  label: string;
  emoji: string;
}

export default function PublicHeader() {
  // Rates States
  const [rates, setRates] = useState<Rate[]>([]);
  const [loadingRates, setLoadingRates] = useState(true);

  // Weather States
  const [weatherCity, setWeatherCity] = useState('istanbul');
  const [weather, setWeather] = useState<Weather | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(true);

  // Load saved weather city on mount (safely client-side)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('weather_city') || 'istanbul';
      setWeatherCity(saved);
    }
  }, []);

  // Fetch exchange rates
  useEffect(() => {
    fetch('/api/exchange-rates')
      .then((res) => res.json())
      .then((data) => {
        setRates(data);
        setLoadingRates(false);
      })
      .catch((err) => {
        console.error('Failed to load exchange rates in header:', err);
        setLoadingRates(false);
      });
  }, []);

  // Fetch weather data
  useEffect(() => {
    setLoadingWeather(true);
    fetch(`/api/weather?city=${weatherCity}`)
      .then((res) => res.json())
      .then((data) => {
        setWeather(data);
        setLoadingWeather(false);
      })
      .catch((err) => {
        console.error('Failed to load weather:', err);
        setLoadingWeather(false);
      });
  }, [weatherCity]);

  // Click to rotate cities: Istanbul -> Ankara -> Izmir -> Istanbul
  const handleToggleCity = () => {
    const citiesList = ['istanbul', 'ankara', 'izmir'];
    const nextIndex = (citiesList.indexOf(weatherCity) + 1) % citiesList.length;
    const nextCity = citiesList[nextIndex];
    setWeatherCity(nextCity);
    if (typeof window !== 'undefined') {
      localStorage.setItem('weather_city', nextCity);
    }
  };

  return (
    <div className="flex flex-col sticky top-0 z-50 shadow-sm">
      {/* Live Market Rates & Weather Topbar */}
      <div className="bg-primary border-b border-slate-800 text-slate-350 text-[11px] font-medium py-2 px-4 sm:px-6 select-none">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-6">
          {/* Left section: Piyasalar + Ticker */}
          <div className="flex items-center space-x-4 min-w-0 flex-1">
            <div className="flex items-center space-x-1.5 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] tracking-wider uppercase font-bold text-slate-400">Piyasalar:</span>
            </div>
            
            <div className="flex items-center space-x-6 overflow-x-auto scrollbar-none whitespace-nowrap flex-1 min-w-0 pl-1">
              {loadingRates ? (
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

          {/* Right section: Weather Widget */}
          <div className="flex items-center space-x-2 shrink-0 border-l border-slate-850 pl-4 md:pl-6">
            {loadingWeather ? (
              <span className="text-slate-550 animate-pulse text-[10px]">Hava durumu...</span>
            ) : (
              weather && (
                <button 
                  onClick={handleToggleCity} 
                  className="flex items-center space-x-1.5 hover:text-slate-100 transition-colors cursor-pointer outline-none focus:text-slate-100 text-left" 
                  title="Şehir değiştirmek için tıklayın"
                >
                  <span className="text-[12px]">{weather.emoji}</span>
                  <span className="font-bold text-slate-200">{weather.city}</span>
                  <span className="text-slate-100 font-bold">{weather.temp}°C</span>
                  <span className="text-[9px] text-slate-500 font-bold uppercase hidden sm:inline">{weather.label}</span>
                </button>
              )
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
