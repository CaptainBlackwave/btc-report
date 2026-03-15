'use client';

import { useState, useSyncExternalStore } from 'react';
import { usePortfolio } from '@/lib/PortfolioContext';

function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export function PortfolioCard() {
  const isHydrated = useHydrated();
  
  const { 
    portfolio, 
    currentPrice, 
    loading: portfolioLoading, 
    buyBTC, 
    sellBTC, 
    resetPortfolio,
    netWorth,
    percentageReturn 
  } = usePortfolio();
  
  const [tradeAmount, setTradeAmount] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [showHistory, setShowHistory] = useState(false);

  const handleAmountChange = (value: string) => {
    setTradeAmount(value);
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleBuy = () => {
    const amount = parseFloat(tradeAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Enter a valid amount');
      return;
    }

    const success = buyBTC(amount, currentPrice);
    if (success) {
      setSuccess(`Bought ${amount} BTC at $${currentPrice.toLocaleString()}`);
      setTradeAmount('');
    } else {
      setError('Insufficient fiat balance');
    }
  };

  const handleSell = () => {
    const amount = parseFloat(tradeAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Enter a valid amount');
      return;
    }

    const success = sellBTC(amount, currentPrice);
    if (success) {
      setSuccess(`Sold ${amount} BTC at $${currentPrice.toLocaleString()}`);
      setTradeAmount('');
    } else {
      setError('Insufficient BTC balance');
    }
  };

  const handleReset = () => {
    if (confirm('Reset portfolio to $10,000? This will clear all trades.')) {
      resetPortfolio();
      setTradeAmount('');
    }
  };

  if (portfolioLoading || !isHydrated) {
    return (
      <div className="portfolio-card">
        <div className="portfolio-header">
          <h3>Portfolio</h3>
        </div>
        <div className="portfolio-loading">
          <div className="skeleton portfolio-skeleton"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="portfolio-card">
      <div className="portfolio-header">
        <h3>Portfolio</h3>
        <button className="portfolio-reset-btn" onClick={handleReset}>
          Reset
        </button>
      </div>

      <div className="portfolio-summary">
        <div className="net-worth">
          <span className="nw-label">Net Worth</span>
          <span className="nw-value">${netWorth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <div className={`return-badge ${percentageReturn >= 0 ? 'positive' : 'negative'}`}>
          <span className="return-icon">{percentageReturn >= 0 ? '▲' : '▼'}</span>
          <span className="return-value">{percentageReturn >= 0 ? '+' : ''}{percentageReturn.toFixed(2)}%</span>
        </div>
      </div>

      <div className="portfolio-balances">
        <div className="balance-item">
          <span className="balance-label">Fiat</span>
          <span className="balance-value">${portfolio.fiatBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="balance-item">
          <span className="balance-label">BTC</span>
          <span className="balance-value btc">{portfolio.btcBalance.toFixed(8)} BTC</span>
        </div>
        <div className="balance-item">
          <span className="balance-label">Current BTC Price</span>
          <span className="balance-value">${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      <div className="trade-section">
        <div className="trade-input-group">
          <input
            type="number"
            placeholder="Amount (BTC)"
            value={tradeAmount}
            onChange={(e) => handleAmountChange(e.target.value)}
            className="trade-input"
            step="0.00000001"
            min="0"
          />
          <span className="trade-usd">
            ≈ ${(parseFloat(tradeAmount || '0') * currentPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {error && <div className="trade-message error">{error}</div>}
        {success && <div className="trade-message success">{success}</div>}

        <div className="trade-buttons">
          <button 
            className="trade-btn buy" 
            onClick={handleBuy}
            disabled={!tradeAmount || parseFloat(tradeAmount) <= 0}
          >
            Buy BTC
          </button>
          <button 
            className="trade-btn sell" 
            onClick={handleSell}
            disabled={!tradeAmount || parseFloat(tradeAmount) <= 0 || portfolio.btcBalance <= 0}
          >
            Sell BTC
          </button>
        </div>
      </div>

      <div className="trade-history-section">
        <button 
          className="history-toggle"
          onClick={() => setShowHistory(!showHistory)}
        >
          {showHistory ? 'Hide' : 'Show'} Trade History ({portfolio.tradeHistory.length})
        </button>

        {showHistory && portfolio.tradeHistory.length > 0 && (
          <div className="trade-history">
            {portfolio.tradeHistory.map((trade) => (
              <div key={trade.id} className={`trade-item ${trade.type}`}>
                <span className="trade-type">{trade.type.toUpperCase()}</span>
                <span className="trade-amount">{trade.amount.toFixed(8)} BTC</span>
                <span className="trade-price">@ ${trade.price.toLocaleString()}</span>
                <span className="trade-total">${trade.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            ))}
          </div>
        )}

        {showHistory && portfolio.tradeHistory.length === 0 && (
          <div className="no-trades">No trades yet</div>
        )}
      </div>
    </div>
  );
}
