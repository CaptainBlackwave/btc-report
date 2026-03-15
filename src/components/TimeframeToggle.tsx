'use client';

import { useMultiTimeframe } from '@/lib/TimeframeContext';
import { TimeFrame } from '@/lib/binance';

const TIMEFRAME_LABELS: Record<TimeFrame, string> = {
  '15m': '15m',
  '1h': '1H',
  '4h': '4H',
  '1d': '1D'
};

export function TimeframeToggle() {
  const { activeTimeframe, setActiveTimeframe, availableTimeframes, loading } = useMultiTimeframe();

  if (loading) {
    return (
      <div className="timeframe-toggle">
        <div className="timeframe-skeleton">
          {availableTimeframes.map((tf) => (
            <div key={tf} className="timeframe-skeleton-item" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="timeframe-toggle">
      {availableTimeframes.map((tf) => (
        <button
          key={tf}
          className={`timeframe-btn ${activeTimeframe === tf ? 'active' : ''}`}
          onClick={() => setActiveTimeframe(tf)}
        >
          {TIMEFRAME_LABELS[tf]}
        </button>
      ))}
    </div>
  );
}
