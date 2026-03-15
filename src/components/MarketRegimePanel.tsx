'use client';

import { useEffect, useState, useRef } from 'react';

type MarketRegime = 'trending' | 'mean-reverting' | 'volatile' | 'consolidating';

interface RegimeData {
  regime: MarketRegime;
  volatility: number;
  volatilityPercentile: number;
  smaDistance: number;
  bollingerPosition: number;
  trendStrength: number;
  confidence: number;
  label: string;
  description: string;
}

const regimeColors: Record<MarketRegime, string> = {
  trending: '#f7931a',
  'mean-reverting': '#00d4aa',
  volatile: '#ff4757',
  consolidating: '#9b59b6'
};

export function MarketRegimePanel() {
  const [data, setData] = useState<RegimeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchRegime = async () => {
    try {
      const res = await fetch('/api/regime');
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError('Failed to detect regime');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegime();
    intervalRef.current = setInterval(fetchRegime, 30000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (loading) {
    return (
      <div className="regime-panel">
        <div className="regime-header">
          <h2>Market Regime</h2>
        </div>
        <div className="regime-loading">
          <div className="spinner"></div>
          <p>Analyzing market...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="regime-panel">
        <div className="regime-header">
          <h2>Market Regime</h2>
        </div>
        <div className="regime-error">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const regimeColor = data ? regimeColors[data.regime] : '#8b8b9a';

  return (
    <div className="regime-panel">
      <div className="regime-header">
        <h2>Market Regime</h2>
      </div>

      <div className="regime-main" style={{ borderColor: regimeColor }}>
        <div className="regime-label" style={{ color: regimeColor }}>
          {data?.label}
        </div>
        <div className="regime-confidence">
          Confidence: {(data?.confidence || 0) * 100}%
        </div>
      </div>

      <div className="regime-description">
        {data?.description}
      </div>

      <div className="regime-metrics">
        <div className="regime-metric">
          <span className="metric-label">Volatility (Ann.)</span>
          <span className="metric-value">{(data?.volatility || 0).toFixed(1)}%</span>
          <div className="metric-bar">
            <div 
              className="metric-bar-fill" 
              style={{ 
                width: `${Math.min((data?.volatility || 0), 100)}%`,
                backgroundColor: data && data.volatility > 60 ? '#ff4757' : data && data.volatility < 30 ? '#00d4aa' : '#f7931a'
              }} 
            />
          </div>
        </div>

        <div className="regime-metric">
          <span className="metric-label">Trend Strength</span>
          <span className="metric-value">{(data?.trendStrength || 0).toFixed(0)}%</span>
          <div className="metric-bar">
            <div 
              className="metric-bar-fill" 
              style={{ 
                width: `${data?.trendStrength || 0}%`,
                backgroundColor: data && data.trendStrength > 60 ? '#f7931a' : '#8b8b9a'
              }} 
            />
          </div>
        </div>

        <div className="regime-metric">
          <span className="metric-label">SMA Distance</span>
          <span className="metric-value">{(data?.smaDistance || 0).toFixed(2)}%</span>
          <div className="metric-bar">
            <div 
              className="metric-bar-fill" 
              style={{ 
                width: `${Math.min((data?.smaDistance || 0) * 10, 100)}%`,
                backgroundColor: data && data.smaDistance < 2 ? '#00d4aa' : '#8b8b9a'
              }} 
            />
          </div>
        </div>

        <div className="regime-metric">
          <span className="metric-label">BB Position</span>
          <span className="metric-value">
            {data && data.bollingerPosition < 0.2 
              ? 'Oversold' 
              : data && data.bollingerPosition > 0.8 
                ? 'Overbought' 
                : 'Neutral'}
          </span>
        </div>
      </div>

      <div className="regime-formula">
        <span className="formula-label">Detection:</span>
        <code>Volatility + SMA Distance + BB Position</code>
      </div>
    </div>
  );
}
