'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, RefreshCw } from 'lucide-react';

interface RatesResponse {
  usd_try: number;
  eur_try: number;
  gbp_try: number;
  gram_gold: number | null;
  updated_at: string;
}

interface Weather {
  city: string;
  temp: number;
  label: string;
  emoji: string;
}

export default function LiveRatesBar() {
  // Rates States
  const [data, setData] = useState<RatesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
  const fetchRates = () => {
    setLoading(true);
    setError(null);
    fetch('/api/rates')
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Kurlar şu anda alınamıyor.');
        }
        return res.json();
      })
      .then((data: RatesResponse) => {
        setData(data);
        setLoading(false);
      })
      .catch((err: any) => {
        console.error('Failed to load rates:', err);
        setError(err.message || 'Kurlar şu anda alınamıyor.');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchRates();
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

  // Format updated_at date (Hour:Minute)
  const formattedDate = data
    ? new Date(data.updated_at).toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <div className="bg-primary border-b border-slate-800 text-slate-350 text-[11px] font-medium py-2 px-4 sm:px-6 select-none h-[35px] flex items-center">
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between gap-6">
        
        {/* Left Section: Live Rates Ticker */}
        <div className="flex items-center space-x-4 min-w-0 flex-1">
          <div className="flex items-center space-x-1.5 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] tracking-wider uppercase font-bold text-slate-400">Canlı Kurlar:</span>
          </div>

          <div className="flex items-center space-x-6 overflow-x-auto scrollbar-none whitespace-nowrap flex-1 min-w-0 pl-1">
            {loading ? (
              // Skeleton / Loading State
              <div className="flex items-center space-x-6 overflow-hidden">
                <div className="animate-pulse w-16 h-3 bg-slate-800 rounded"></div>
                <div className="animate-pulse w-16 h-3 bg-slate-800 rounded"></div>
                <div className="animate-pulse w-16 h-3 bg-slate-800 rounded"></div>
                <div className="animate-pulse w-20 h-3 bg-slate-800 rounded"></div>
              </div>
            ) : error || !data ? (
              <span className="text-rose-400 text-xs font-semibold">Kurlar şu anda alınamıyor.</span>
            ) : (
              <>
                <div className="flex items-center space-x-1.5">
                  <span className="text-slate-400 font-bold uppercase">USD/TRY</span>
                  <span className="text-slate-100 font-bold">{data.usd_try.toFixed(2)} ₺</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-slate-400 font-bold uppercase">EUR/TRY</span>
                  <span className="text-slate-100 font-bold">{data.eur_try.toFixed(2)} ₺</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-slate-400 font-bold uppercase">GBP/TRY</span>
                  <span className="text-slate-100 font-bold">{data.gbp_try.toFixed(2)} ₺</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-slate-400 font-bold uppercase">Gram Altın</span>
                  <span className="text-slate-100 font-bold">
                    {data.gram_gold !== null ? `${data.gram_gold} TL` : '-'}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Section: Weather Widget & Update Time */}
        <div className="flex items-center space-x-4 shrink-0">
          {/* Weather Widget */}
          {!loadingWeather && weather && (
            <button 
              onClick={handleToggleCity} 
              className="flex items-center space-x-1.5 hover:text-slate-100 transition-colors cursor-pointer outline-none focus:text-slate-100 text-left border-l border-slate-850 pl-4 hidden md:flex" 
              title="Şehir değiştirmek için tıklayın"
            >
              <span className="text-[12px]">{weather.emoji}</span>
              <span className="font-bold text-slate-200">{weather.city}</span>
              <span className="text-slate-100 font-bold">{weather.temp}°C</span>
            </button>
          )}

          {/* Last Updated or Retry Button */}
          <div className="flex items-center space-x-1 text-slate-550 text-[10px] font-bold uppercase border-l border-slate-850 pl-4 h-full">
            {error ? (
              <button 
                onClick={fetchRates} 
                className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-all cursor-pointer font-bold uppercase outline-none"
              >
                <RefreshCw className="w-3 h-3" />
                Dene
              </button>
            ) : data ? (
              <>
                <Calendar className="w-3.5 h-3.5 text-accent animate-pulse" />
                <span>Güncelleme: {formattedDate}</span>
              </>
            ) : null}
          </div>
        </div>

      </div>
    </div>
  );
}
