import { NextResponse } from 'next/server';
import { fetchOrderBook } from '@/lib/binance';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const orderBook = await fetchOrderBook('BTCUSDT', 20);
    return NextResponse.json(orderBook);
  } catch (error) {
    console.error('Error fetching order book:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order book data' },
      { status: 500 }
    );
  }
}
