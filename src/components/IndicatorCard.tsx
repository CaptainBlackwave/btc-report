'use client';

interface IndicatorCardProps {
  title: string;
  value: string | number | null;
  subtitle?: string;
  type?: 'rsi' | 'macd' | 'bollinger' | 'volatility' | 'trend';
  trend?: 'bullish' | 'bearish' | 'neutral';
}

export function IndicatorCard({ title, value, subtitle, type = 'rsi', trend }: IndicatorCardProps) {
  const getDisplayValue = () => {
    if (value === null || value === undefined) return '--';
    if (typeof value === 'number') {
      if (type === 'rsi') return value.toFixed(1);
      if (type === 'volatility') return value.toFixed(2) + '%';
      if (type === 'macd') return value > 0 ? `+${value.toFixed(2)}` : value.toFixed(2);
    }
    return value;
  };

  const getStatusClass = () => {
    if (type === 'rsi' && typeof value === 'number') {
      if (value >= 70) return 'overbought';
      if (value <= 30) return 'oversold';
      return 'neutral';
    }
    if (type === 'trend' && trend) return trend;
    return '';
  };

  const getGaugeValue = () => {
    if (type === 'rsi' && typeof value === 'number') {
      return (value / 100) * 180;
    }
    return 0;
  };

  return (
    <div className={`indicator-card ${getStatusClass()}`}>
      <h3 className="indicator-title">{title}</h3>
      
      {type === 'rsi' && (
        <div className="gauge-container">
          <svg viewBox="0 0 200 20" className="gauge">
            <defs>
              <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ff4757"/>
                <stop offset="50%" stopColor="#ffa502"/>
                <stop offset="100%" stopColor="#00d4aa"/>
              </linearGradient>
            </defs>
            <rect x="10" y="8" width="180" height="4" rx="2" fill="#2a2a3a"/>
            <rect x="10" y="8" width={getGaugeValue()} height="4" rx="2" fill="url(#gaugeGrad)"/>
            <line x1="46" y1="4" x2="46" y2="16" stroke="#ff4757" strokeWidth="1" opacity="0.5"/>
            <line x1="154" y1="4" x2="154" y2="16" stroke="#00d4aa" strokeWidth="1" opacity="0.5"/>
          </svg>
        </div>
      )}

      <div className="indicator-value">
        <span className={`value ${getStatusClass()}`}>{getDisplayValue()}</span>
      </div>

      {subtitle && (
        <p className="indicator-subtitle">{subtitle}</p>
      )}

      {type === 'trend' && trend && (
        <div className={`trend-badge ${trend}`}>
          {trend === 'bullish' && '↗ BULLISH'}
          {trend === 'bearish' && '↘ BEARISH'}
          {trend === 'neutral' && '→ NEUTRAL'}
        </div>
      )}
    </div>
  );
}
