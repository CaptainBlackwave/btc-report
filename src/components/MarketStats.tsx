'use client';

import { useEffect, useState } from 'react';

interface MarketData {
  price: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  lastUpdate: number;
}

interface MarketStatsProps {
  onRefresh?: () => void;
}

export function MarketStats({ onRefresh }: MarketStatsProps) {
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/market');
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError('Failed to load market data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const isPositive = data?.priceChangePercent24h && data.priceChangePercent24h >= 0;

  return (
    <div className="market-stats">
      <div className="market-header">
        <h2>Market Overview</h2>
        <button className="refresh-btn" onClick={fetchData} disabled={loading}>
          <svg className={loading ? 'spinning' : ''} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 4v6h-6M1 20v-6h6"/>
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
          </svg>
        </button>
      </div>

      {loading && !data && (
        <div className="loading-skeleton">
          <div className="skeleton price-skeleton"></div>
          <div className="skeleton-row">
            <div className="skeleton small"></div>
            <div className="skeleton small"></div>
          </div>
        </div>
      )}

      {error && (
        <div className="error-state">
          <p>{error}</p>
          <button onClick={fetchData}>Retry</button>
        </div>
      )}

      {data && !loading && (
        <>
          <div className="price-display">
            <span className="currency">$</span>
            <span className="price">{data.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>

          <div className={`price-change ${isPositive ? 'positive' : 'negative'}`}>
            <span className="change-icon">{isPositive ? '▲' : '▼'}</span>
            <span className="change-value">{Math.abs(data.priceChangePercent24h).toFixed(2)}%</span>
            <span className="change-label">(24h)</span>
          </div>

          <div className="range-bar">
            <div className="range-labels">
              <span>Low: ${data.low24h.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              <span>High: ${data.high24h.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="range-track">
              <div 
                className="range-fill"
                style={{
                  left: `${((data.price - data.low24h) / (data.high24h - data.low24h)) * 100}%`
                }}
              />
            </div>
          </div>

          <div className="volume-display">
            <span className="volume-label">24h Volume</span>
            <span className="volume-value">{data.volume24h.toLocaleString(undefined, { maximumFractionDigits: 0 })} BTC</span>
          </div>
        </>
      )}
    </div>
  );
}
