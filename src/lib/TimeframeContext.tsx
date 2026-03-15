'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TimeFrame, TIMEFRAMES } from '@/lib/binance';
import { TechnicalIndicators, IndicatorChartData } from '@/lib/indicators';

interface TimeframeData {
  indicators: TechnicalIndicators;
  chartData: IndicatorChartData[];
  lastCandle: { time: number; close: number };
}

interface MultiTimeframeContextType {
  activeTimeframe: TimeFrame;
  setActiveTimeframe: (tf: TimeFrame) => void;
  timeframeData: Record<TimeFrame, TimeframeData | null>;
  loading: boolean;
  error: string | null;
  availableTimeframes: TimeFrame[];
}

const MultiTimeframeContext = createContext<MultiTimeframeContextType | undefined>(undefined);

export function MultiTimeframeProvider({ children }: { children: ReactNode }) {
  const [activeTimeframe, setActiveTimeframe] = useState<TimeFrame>('1h');
  const [timeframeData, setTimeframeData] = useState<Record<TimeFrame, TimeframeData | null>>({
    '15m': null,
    '1h': null,
    '4h': null,
    '1d': null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMultiTimeframeData = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/multi-timeframe');
        if (!res.ok) throw new Error('Failed to fetch data');
        
        const data = await res.json();
        
        const formattedData: Record<TimeFrame, TimeframeData | null> = {
          '15m': null,
          '1h': null,
          '4h': null,
          '1d': null
        };
        
        for (const tf of TIMEFRAMES) {
          if (data.timeframes[tf]) {
            formattedData[tf] = data.timeframes[tf];
          }
        }
        
        setTimeframeData(formattedData);
      } catch (err) {
        console.error('Error fetching multi-timeframe data:', err);
        setError('Failed to load market data');
      } finally {
        setLoading(false);
      }
    };

    fetchMultiTimeframeData();
  }, []);

  return (
    <MultiTimeframeContext.Provider 
      value={{ 
        activeTimeframe, 
        setActiveTimeframe, 
        timeframeData, 
        loading, 
        error,
        availableTimeframes: TIMEFRAMES
      }}
    >
      {children}
    </MultiTimeframeContext.Provider>
  );
}

export function useMultiTimeframe() {
  const context = useContext(MultiTimeframeContext);
  if (!context) {
    throw new Error('useMultiTimeframe must be used within a MultiTimeframeProvider');
  }
  return context;
}
