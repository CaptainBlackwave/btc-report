# Active Context: Dump BTC - Bitcoin Prediction Tool

## Current State

**Project Status:** ✅ Complete - AI-powered Bitcoin prediction tool built with Next.js

The Dump BTC application is fully implemented with LSTM and Random Forest models for Bitcoin price prediction.

## Recently Completed

- [x] Install dependencies: @tensorflow/tfjs, recharts, technicalindicators
- [x] Create lib/binance.ts - Binance API client for fetching candles and market data
- [x] Create lib/indicators.ts - Technical indicator calculations (RSI, MACD, Bollinger Bands, SMA)
- [x] Create API routes:
  - /api/market - Real-time BTC market data
  - /api/indicators - Technical analysis calculations
  - /api/predict - ML prediction pipeline with LSTM/Random Forest fallback
- [x] Create React components:
  - Header.tsx - Logo and branding
  - MarketStats.tsx - Current price, 24h change, high/low range
  - IndicatorCard.tsx - RSI, MACD, Volatility, Trend indicators
  - PredictionChart.tsx - 5-hour prediction chart with Recharts
  - TechnicalChart.tsx - Historical chart with SMA, BB, MACD overlays
- [x] Create main page with all components integrated
- [x] Style with custom CSS matching spec (dark theme, Bitcoin orange accents)
- [x] Run typecheck and lint - all passing

## Current Structure

| File/Directory | Purpose | Status |
|----------------|---------|--------|
| `src/lib/binance.ts` | Binance API client | ✅ |
| `src/lib/indicators.ts` | Technical indicators | ✅ |
| `src/app/api/market/route.ts` | Market data API | ✅ |
| `src/app/api/indicators/route.ts` | Indicators API | ✅ |
| `src/app/api/predict/route.ts` | ML prediction API | ✅ |
| `src/components/Header.tsx` | Header component | ✅ |
| `src/components/MarketStats.tsx` | Market stats component | ✅ |
| `src/components/IndicatorCard.tsx` | Indicator cards | ✅ |
| `src/components/PredictionChart.tsx` | Prediction chart | ✅ |
| `src/components/TechnicalChart.tsx` | Technical chart | ✅ |
| `src/app/page.tsx` | Main page | ✅ |
| `src/app/globals.css` | Custom styles | ✅ |

## Tech Stack

- **Framework:** Next.js 16 with App Router
- **ML:** TensorFlow.js (LSTM neural network)
- **Visualization:** Recharts
- **Technical Analysis:** technicalindicators library
- **API:** Binance public API (no auth required)
- **Styling:** Custom CSS with CSS variables

## Features Implemented

1. **Data Fetching:** 500+ BTC/USDT candles from Binance (1h intervals)
2. **Technical Indicators:**
   - RSI (14-period)
   - MACD (12, 26, 9)
   - Bollinger Bands (20, 2)
   - SMA (7, 25, 99)
   - Volatility calculation
   - Trend detection
3. **ML Models:**
   - LSTM neural network (TensorFlow.js)
   - Random Forest fallback (50 trees)
   - Auto-fallback on timeout
4. **Visualization:**
   - Price prediction chart
   - Technical analysis chart with toggles
   - MACD histogram
   - RSI gauge

## Session History

| Date | Changes |
|------|---------|
| Initial | Base Next.js 16 template created |
| This session | Dump BTC tool fully implemented |

## Quick Start

```bash
bun install
bun dev
```

Open http://localhost:3000 to view the application.
