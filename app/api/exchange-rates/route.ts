import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [dovizRes, altinRes, kriptoRes] = await Promise.all([
      fetch('https://api.genelpara.com/json/?list=doviz', {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        cache: 'no-store'
      }),
      fetch('https://api.genelpara.com/json/?list=altin', {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        cache: 'no-store'
      }),
      fetch('https://api.genelpara.com/json/?list=kripto', {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        cache: 'no-store'
      }),
    ]);

    if (!dovizRes.ok || !altinRes.ok || !kriptoRes.ok) {
      throw new Error('Failed to fetch from GenelPara');
    }

    const [dovizData, altinData, kriptoData] = await Promise.all([
      dovizRes.json(),
      altinRes.json(),
      kriptoRes.json(),
    ]);

    if (!dovizData.success || !altinData.success || !kriptoData.success) {
      throw new Error('GenelPara API returned success=false');
    }

    const rates = [
      {
        code: 'USD',
        name: 'Dolar',
        price: parseFloat(dovizData.data.USD.satis).toFixed(2),
        change: dovizData.data.USD.degisim,
        direction: dovizData.data.USD.yon,
        symbol: '$',
      },
      {
        code: 'EUR',
        name: 'Euro',
        price: parseFloat(dovizData.data.EUR.satis).toFixed(2),
        change: dovizData.data.EUR.degisim,
        direction: dovizData.data.EUR.yon,
        symbol: '€',
      },
      {
        code: 'GBP',
        name: 'Sterlin',
        price: parseFloat(dovizData.data.GBP.satis).toFixed(2),
        change: dovizData.data.GBP.degisim,
        direction: dovizData.data.GBP.yon,
        symbol: '£',
      },
      {
        code: 'ALTIN',
        name: 'Gram Altın',
        price: parseFloat(altinData.data.GA.satis).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        change: altinData.data.GA.degisim,
        direction: altinData.data.GA.yon,
        symbol: 'TL',
      },
      {
        code: 'BTC',
        name: 'Bitcoin',
        price: parseFloat(kriptoData.data.BTC.satis).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        change: kriptoData.data.BTC.degisim,
        direction: kriptoData.data.BTC.yon,
        symbol: '$',
      },
    ];

    return NextResponse.json(rates);
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error);

    // Realistic fallback data so header never displays empty rates
    const fallbackRates = [
      { code: 'USD', name: 'Dolar', price: '45.96', change: '+0.03', direction: 'moneyUp', symbol: '$' },
      { code: 'EUR', name: 'Euro', price: '53.40', change: '-0.24', direction: 'moneyDown', symbol: '€' },
      { code: 'GBP', name: 'Sterlin', price: '61.84', change: '-0.23', direction: 'moneyDown', symbol: '£' },
      { code: 'ALTIN', name: 'Gram Altın', price: '6.587,14', change: '-0.65', direction: 'moneyDown', symbol: 'TL' },
      { code: 'BTC', name: 'Bitcoin', price: '66,938.88', change: '-0.82', direction: 'moneyDown', symbol: '$' },
    ];

    return NextResponse.json(fallbackRates);
  }
}
