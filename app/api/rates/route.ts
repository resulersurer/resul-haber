import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const apiKey = process.env.CURRENCY_API_KEY;

  // 1. If API key is not defined, return a 500 error
  if (!apiKey || apiKey === 'your-currency-api-key-here') {
    console.error('CURRENCY_API_KEY is missing or using placeholder value.');
    return NextResponse.json(
      { error: 'CURRENCY_API_KEY is not defined in environment variables.' },
      { status: 500 }
    );
  }

  try {
    // 2. Fetch latest rates from currencyapi.com
    // We request TRY, EUR, and GBP rates with USD base
    const url = `https://api.currencyapi.com/v3/latest?apikey=${apiKey}&currencies=TRY,EUR,GBP`;
    const res = await fetch(url, {
      next: { revalidate: 300 } // Cache the API response for 5 minutes (300 seconds)
    });

    if (!res.ok) {
      throw new Error(`CurrencyAPI returned status code ${res.status}`);
    }

    const json = await res.json();

    if (!json.data || !json.data.TRY || !json.data.EUR || !json.data.GBP) {
      throw new Error('Unexpected response structure from CurrencyAPI');
    }

    // 3. Extract and calculate rates relative to TRY
    const usd_try = json.data.TRY.value;
    const eur_val = json.data.EUR.value;
    const gbp_val = json.data.GBP.value;

    const eur_try = usd_try / eur_val;
    const gbp_try = usd_try / gbp_val;

    // 4. Return formatted response matching user specifications
    return NextResponse.json({
      usd_try: parseFloat(usd_try.toFixed(2)),
      eur_try: parseFloat(eur_try.toFixed(2)),
      gbp_try: parseFloat(gbp_try.toFixed(2)),
      gram_gold: null,
      updated_at: json.meta?.last_updated_at || new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Failed to fetch from CurrencyAPI:', error);
    
    // 5. Return a safe, clean 502 error with a clear message
    return NextResponse.json(
      { error: 'Kurlar şu anda alınamıyor.' },
      { status: 502 }
    );
  }
}
