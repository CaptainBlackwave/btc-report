# Dump BTC - AI-Powered Bitcoin Prediction Tool

A real-time Bitcoin market analysis and price prediction dashboard built with Next.js. Features technical indicators, machine learning-based price predictions, and interactive charts.

## Features

- **Real-time Market Data**: Live Bitcoin prices from Binance API
- **Technical Indicators**: RSI, MACD, Bollinger Bands, SMAs
- **AI Price Prediction**: TensorFlow.js-based LSTM model for price forecasting
- **Interactive Charts**: Price history and prediction visualizations with Recharts
- **Market Stats**: 24h price change, high/low, volume tracking

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19, Tailwind CSS 4
- **Charts**: Recharts
- **ML**: TensorFlow.js
- **Technical Analysis**: technicalindicators
- **Data Source**: Binance API

## Getting Started

```bash
# Install dependencies
bun install

# Run development server
bun run dev

# Build for production
bun run build

# Start production server
bun start

# Run linting
bun run lint

# Type checking
bun run typecheck
```

## API Endpoints

- `GET /api/market` - Fetch current Bitcoin market data
- `GET /api/indicators` - Calculate technical indicators
- `GET /api/predict` - Generate AI price predictions

## Disclaimer

This tool is for educational purposes only. Predictions are not financial advice.
