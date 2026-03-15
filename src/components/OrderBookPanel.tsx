'use client';

import { useEffect, useState, useRef } from 'react';

interface OrderBookEntry {
  price: number;
  quantity: number;
}

interface OrderBookData {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  bidVolume: number;
  askVolume: number;
  imbalance: number;
  timestamp: number;
}

export function OrderBookPanel() {
  const [data, setData] = useState<OrderBookData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchOrderBook = async () => {
    try {
      const res = await fetch('/api/orderbook');
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError('Failed to load order book');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderBook();
    intervalRef.current = setInterval(fetchOrderBook, 2000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (loading) {
    return (
      <div className="orderbook-panel">
        <div className="orderbook-header">
          <h2>Order Book Imbalance</h2>
        </div>
        <div className="orderbook-loading">
          <div className="spinner"></div>
          <p>Loading depth data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="orderbook-panel">
        <div className="orderbook-header">
          <h2>Order Book Imbalance</h2>
        </div>
        <div className="orderbook-error">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const maxVolume = Math.max(
    ...(data?.bids.map(b => b.quantity * b.price) || []),
    ...(data?.asks.map(a => a.quantity * a.price) || [])
  );

  const imbalanceColor = data && data.imbalance > 0.1 
    ? '#00d4aa' 
    : data && data.imbalance < -0.1 
      ? '#ff4757' 
      : '#f7931a';

  const imbalanceLabel = data && data.imbalance > 0.1 
    ? 'Buy Pressure' 
    : data && data.imbalance < -0.1 
      ? 'Sell Pressure' 
      : 'Balanced';

  return (
    <div className="orderbook-panel">
      <div className="orderbook-header">
        <h2>Order Book Imbalance</h2>
        <span className="orderbook-updated">
          Updated: {new Date(data?.timestamp || 0).toLocaleTimeString()}
        </span>
      </div>

      <div className="imbalance-indicator">
        <div className="imbalance-label">Imbalance Score</div>
        <div className="imbalance-value" style={{ color: imbalanceColor }}>
          {(data?.imbalance || 0).toFixed(4)}
        </div>
        <div className="imbalance-status" style={{ color: imbalanceColor }}>
          {imbalanceLabel}
        </div>
        <div className="imbalance-bar-container">
          <div 
            className="imbalance-bar" 
            style={{ 
              width: `${Math.abs(data?.imbalance || 0) * 100}%`,
              backgroundColor: imbalanceColor,
              marginLeft: data && data.imbalance < 0 ? '50%' : 'auto',
              marginRight: data && data.imbalance >= 0 ? '50%' : 'auto'
            }}
          />
          <div className="imbalance-center-line" />
        </div>
      </div>

      <div className="orderbook-content">
        <div className="orderbook-side bids">
          <div className="orderbook-side-header">
            <span>Bids (Buy Orders)</span>
            <span className="volume">${(data?.bidVolume || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
          <div className="orderbook-list">
            {data?.bids.slice(0, 10).map((bid, i) => (
              <div key={i} className="orderbook-row">
                <div 
                  className="orderbook-depth" 
                  style={{ width: `${(bid.quantity * bid.price / maxVolume) * 100}%` }}
                />
                <span className="price bid-price">{bid.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className="quantity">{bid.quantity.toFixed(4)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="orderbook-side asks">
          <div className="orderbook-side-header">
            <span>Asks (Sell Orders)</span>
            <span className="volume">${(data?.askVolume || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
          <div className="orderbook-list">
            {data?.asks.slice(0, 10).map((ask, i) => (
              <div key={i} className="orderbook-row">
                <div 
                  className="orderbook-depth" 
                  style={{ width: `${(ask.quantity * ask.price / maxVolume) * 100}%` }}
                />
                <span className="price ask-price">{ask.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className="quantity">{ask.quantity.toFixed(4)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="orderbook-formula">
        <span className="formula-label">Formula:</span>
        <code>(Bid Volume - Ask Volume) / (Bid Volume + Ask Volume)</code>
      </div>
    </div>
  );
}
