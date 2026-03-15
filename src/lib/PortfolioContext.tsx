'use client';

import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';

export interface Trade {
  id: string;
  type: 'buy' | 'sell';
  amount: number;
  price: number;
  total: number;
  timestamp: number;
}

export interface PortfolioState {
  fiatBalance: number;
  btcBalance: number;
  tradeHistory: Trade[];
}

interface PortfolioContextType {
  portfolio: PortfolioState;
  currentPrice: number;
  loading: boolean;
  buyBTC: (amount: number, price: number) => boolean;
  sellBTC: (amount: number, price: number) => boolean;
  resetPortfolio: () => void;
  netWorth: number;
  initialInvestment: number;
  percentageReturn: number;
}

const STORAGE_KEY = 'btc_report_portfolio';

const initialPortfolio: PortfolioState = {
  fiatBalance: 10000,
  btcBalance: 0,
  tradeHistory: []
};

function getInitialPortfolio(): PortfolioState {
  if (typeof window === 'undefined') {
    return initialPortfolio;
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...initialPortfolio, ...parsed };
    }
  } catch (e) {
    console.error('Failed to parse portfolio:', e);
  }
  
  return initialPortfolio;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [portfolio, setPortfolio] = useState<PortfolioState>(getInitialPortfolio);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolio));
  }, [portfolio]);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch('/api/market');
        if (res.ok) {
          const data = await res.json();
          setCurrentPrice(data.price);
        }
      } catch (e) {
        console.error('Failed to fetch price:', e);
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 60000);
    return () => clearInterval(interval);
  }, []);

  const buyBTC = (amount: number, price: number): boolean => {
    const total = amount * price;
    
    if (total > portfolio.fiatBalance) {
      return false;
    }

    const trade: Trade = {
      id: Date.now().toString(),
      type: 'buy',
      amount,
      price,
      total,
      timestamp: Date.now()
    };

    setPortfolio(prev => ({
      fiatBalance: prev.fiatBalance - total,
      btcBalance: prev.btcBalance + amount,
      tradeHistory: [trade, ...prev.tradeHistory]
    }));

    return true;
  };

  const sellBTC = (amount: number, price: number): boolean => {
    if (amount > portfolio.btcBalance) {
      return false;
    }

    const total = amount * price;
    const trade: Trade = {
      id: Date.now().toString(),
      type: 'sell',
      amount,
      price,
      total,
      timestamp: Date.now()
    };

    setPortfolio(prev => ({
      fiatBalance: prev.fiatBalance + total,
      btcBalance: prev.btcBalance - amount,
      tradeHistory: [trade, ...prev.tradeHistory]
    }));

    return true;
  };

  const resetPortfolio = () => {
    setPortfolio(initialPortfolio);
    localStorage.removeItem(STORAGE_KEY);
  };

  const netWorth = useMemo(
    () => portfolio.fiatBalance + (portfolio.btcBalance * currentPrice),
    [portfolio.fiatBalance, portfolio.btcBalance, currentPrice]
  );
  
  const initialInvestment = initialPortfolio.fiatBalance;
  const percentageReturn = useMemo(
    () => ((netWorth - initialInvestment) / initialInvestment) * 100,
    [netWorth]
  );

  return (
    <PortfolioContext.Provider 
      value={{ 
        portfolio, 
        currentPrice,
        loading,
        buyBTC,
        sellBTC,
        resetPortfolio,
        netWorth,
        initialInvestment,
        percentageReturn
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
}
