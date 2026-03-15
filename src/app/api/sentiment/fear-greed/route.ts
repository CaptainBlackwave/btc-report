import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const response = await fetch('https://api.alternative.me/fng/');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Fear & Greed index: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.data || data.data.length === 0) {
      throw new Error('No Fear & Greed data available');
    }
    
    const latest = data.data[0];
    
    const value = parseInt(latest.value);
    const classification = getClassification(value);
    
    return NextResponse.json({
      value,
      classification: latest.value_classification,
      timestamp: parseInt(latest.timestamp) * 1000,
      previousClose: parseInt(data.data[1]?.value || '50'),
      classificationShort: classification
    });
  } catch (error) {
    console.error('Error fetching Fear & Greed index:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Fear & Greed index' },
      { status: 500 }
    );
  }
}

function getClassification(value: number): string {
  if (value <= 25) return 'Extreme Fear';
  if (value <= 45) return 'Fear';
  if (value <= 55) return 'Neutral';
  if (value <= 75) return 'Greed';
  return 'Extreme Greed';
}
