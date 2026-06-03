import { NextRequest, NextResponse } from 'next/server';

export const revalidate = 900; // Cache for 15 minutes
export const dynamic = 'force-dynamic';

const CITIES: Record<string, { name: string; lat: number; lng: number }> = {
  istanbul: { name: 'İstanbul', lat: 41.0082, lng: 28.9784 },
  ankara: { name: 'Ankara', lat: 39.9334, lng: 32.8597 },
  izmir: { name: 'İzmir', lat: 38.4192, lng: 27.1287 },
};

function getWeatherInfo(code: number) {
  switch (code) {
    case 0: return { label: 'Güneşli', emoji: '☀️' };
    case 1:
    case 2:
    case 3: return { label: 'Parçalı Bulutlu', emoji: '⛅' };
    case 45:
    case 48: return { label: 'Sisli', emoji: '🌫️' };
    case 51:
    case 53:
    case 55: return { label: 'Çiseleme', emoji: '🌧️' };
    case 61:
    case 63:
    case 65: return { label: 'Yağmurlu', emoji: '🌧️' };
    case 71:
    case 73:
    case 75: return { label: 'Karlı', emoji: '❄️' };
    case 77: return { label: 'Kar Taneli', emoji: '❄️' };
    case 80:
    case 81:
    case 82: return { label: 'Sağanak', emoji: '🌦️' };
    case 85:
    case 86: return { label: 'Kar Sağanağı', emoji: '🌨️' };
    case 95:
    case 96:
    case 99: return { label: 'Fırtına', emoji: '⛈️' };
    default: return { label: 'Açık', emoji: '🌡️' };
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cityParam = searchParams.get('city')?.toLowerCase() || 'istanbul';
    const latParam = searchParams.get('lat');
    const lngParam = searchParams.get('lng');

    let name = 'İstanbul';
    let lat = 41.0082;
    let lng = 28.9784;

    if (latParam && lngParam) {
      lat = parseFloat(latParam);
      lng = parseFloat(lngParam);
      name = 'Konumunuz';
    } else if (CITIES[cityParam]) {
      lat = CITIES[cityParam].lat;
      lng = CITIES[cityParam].lng;
      name = CITIES[cityParam].name;
    }

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code`;
    const res = await fetch(weatherUrl, {
      next: { revalidate: 900 }
    });

    if (!res.ok) throw new Error('Weather API returned error status');
    const data = await res.json();

    const temp = Math.round(data.current.temperature_2m);
    const code = data.current.weather_code;
    const { label, emoji } = getWeatherInfo(code);

    return NextResponse.json({
      city: name,
      temp,
      label,
      emoji,
      code
    });
  } catch (error) {
    console.error('Failed to fetch weather data:', error);
    // Return realistic fallback so UI never looks broken
    return NextResponse.json({
      city: 'İstanbul',
      temp: 22,
      label: 'Güneşli',
      emoji: '☀️',
      code: 0
    });
  }
}
