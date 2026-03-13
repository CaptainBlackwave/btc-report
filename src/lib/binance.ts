export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketData {
  price: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  lastUpdate: number;
}

export interface BinanceKline {
  0: number;
  1: string;
  2: string;
  3: string;
  4: string;
  5: string;
  6: string;
  7: string;
  8: number;
  9: string;
  10: string;
  11: string;
}

const BINANCE_API = 'https://api.binance.com/api/v3';

export async function fetchCandles(symbol: string = 'BTCUSDT', interval: string = '1h', limit: number = 1000): Promise<Candle[]> {
  const url = `${BINANCE_API}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch candles: ${response.statusText}`);
  }
  
  const data: BinanceKline[] = await response.json();
  
  return data.map(kline => ({
    time: kline[0],
    open: parseFloat(kline[1]),
    high: parseFloat(kline[2]),
    low: parseFloat(kline[3]),
    close: parseFloat(kline[4]),
    volume: parseFloat(kline[5])
  }));
}

export async function fetchMarketData(symbol: string = 'BTCUSDT'): Promise<MarketData> {
  const url = `${BINANCE_API}/ticker/24hr?symbol=${symbol}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch market data: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  return {
    price: parseFloat(data.lastPrice),
    priceChange24h: parseFloat(data.priceChange),
    priceChangePercent24h: parseFloat(data.priceChangePercent),
    high24h: parseFloat(data.highPrice),
    low24h: parseFloat(data.lowPrice),
    volume24h: parseFloat(data.volume),
    lastUpdate: Date.now()
  };
}

export function calculatePriceReturns(candles: Candle[], periods: number[] = [1, 6, 24]): number[] {
  const closes = candles.map(c => c.close);
  const returns: number[] = [];
  
  for (const period of periods) {
    for (let i = period; i < closes.length; i++) {
      const ret = (closes[i] - closes[i - period]) / closes[i - period];
      returns.push(ret);
    }
  }
  
  return returns;
}

export function createLagFeatures(candles: Candle[], numLags: number = 5): number[][] {
  const closes = candles.map(c => c.close);
  const features: number[][] = [];
  
  for (let i = numLags; i < closes.length; i++) {
    const lagFeatures: number[] = [];
    for (let j = 1; j <= numLags; j++) {
      lagFeatures.push((closes[i] - closes[i - j]) / closes[i - j]);
    }
    features.push(lagFeatures);
  }
  
  return features;
}
