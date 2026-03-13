# Dump BTC - Bitcoin Prediction Tool

## Project Overview

**Project Name:** Dump BTC  
**Type:** AI/ML-powered cryptocurrency prediction webapp  
**Core Functionality:** Analyze BTC market data using LSTM neural networks and Random Forest ensemble methods to generate short-term price predictions  
**Target Users:** Crypto traders, researchers, and enthusiasts interested in AI-driven market analysis

---

## UI/UX Specification

### Layout Structure

**Page Sections:**
1. **Header** - Logo, title, tagline
2. **Market Overview Panel** - Current BTC price, 24h change, key indicators
3. **Prediction Controls** - Run prediction button, model selection
4. **Results Panel** - 5-hour price prediction chart
5. **Technical Indicators Panel** - RSI, MACD, Bollinger Bands, volatility
6. **Historical Data Chart** - Price history with indicators overlay

**Grid Layout:**
- Desktop: 2-column layout (main content 70%, sidebar 30%)
- Tablet: Single column, stacked panels
- Mobile: Full-width stacked cards

**Responsive Breakpoints:**
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### Visual Design

**Color Palette:**
- Background Primary: `#0a0a0f` (deep void black)
- Background Secondary: `#12121a` (card background)
- Background Tertiary: `#1a1a25` (hover states)
- Accent Primary: `#f7931a` (Bitcoin orange)
- Accent Secondary: `#00d4aa` (bullish green)
- Danger: `#ff4757` (bearish red)
- Text Primary: `#e8e8ed` (off-white)
- Text Secondary: `#8b8b9a` (muted gray)
- Border: `#2a2a3a` (subtle borders)

**Typography:**
- Headings: "JetBrains Mono", monospace - bold
- Body: "IBM Plex Sans", sans-serif
- Numbers/Data: "JetBrains Mono", monospace
- Font Sizes:
  - H1: 2.5rem (40px)
  - H2: 1.75rem (28px)
  - H3: 1.25rem (20px)
  - Body: 1rem (16px)
  - Small: 0.875rem (14px)

**Spacing System:**
- Base unit: 4px
- xs: 4px, sm: 8px, md: 16px, lg: 24px, xl: 32px, 2xl: 48px

**Visual Effects:**
- Card shadows: `0 4px 24px rgba(0, 0, 0, 0.4)`
- Glow effects on key metrics: `0 0 20px rgba(247, 147, 26, 0.3)`
- Subtle gradient overlays on charts
- Smooth transitions: 300ms ease-out
- Loading pulse animations

### Components

**1. Header**
- Logo: Stylized "DUMP" text with BTC icon
- Subtitle: "AI-Powered Bitcoin Prediction"
- States: Static

**2. Market Stats Card**
- Current price (large, prominent)
- 24h change (color-coded green/red)
- High/Low range bar
- States: Loading (skeleton), Loaded, Error

**3. Indicator Cards**
- RSI gauge (0-100 scale visualization)
- MACD histogram
- Bollinger Bands overlay
- Volatility percentage
- States: Loading, Loaded

**4. Prediction Button**
- Large CTA button
- States: Idle, Loading (with spinner), Complete
- Animation: Pulse glow while processing

**5. Prediction Chart**
- Line chart showing historical + predicted
- Shaded confidence interval
- Hover tooltips
- States: Empty, Loading, Populated

**6. Technical Chart**
- Candlestick or line chart
- Overlay toggle for indicators
- Zoom/pan controls
- States: Loading, Loaded

---

## Functionality Specification

### Core Features

**1. Data Fetching**
- Fetch 1000+ BTC/USDT candles from Binance API
- Use 1-hour intervals for training data
- Real-time price updates every 60 seconds
- Handle API errors gracefully with retry logic

**2. Technical Indicators**
- **RSI (Relative Strength Index)**: 14-period
- **MACD**: 12, 26, 9 periods (signal, histogram)
- **Bollinger Bands**: 20-period, 2 std deviations
- **Volatility**: Standard deviation of price changes
- **Moving Averages**: SMA 7, SMA 25, SMA 99

**3. Feature Engineering**
- Price returns (1h, 6h, 24h)
- Lag features (1-5 periods)
- Momentum indicators
- Volume analysis
- Trend direction flags

**4. LSTM Model (Primary)**
- Sequence length: 24 (24 hours of data)
- Hidden units: 64
- Dense layers for output
- Training epochs: 10-20 (with early stopping)
- Timeout: 60 seconds for training
- Fallback: Automatic switch to Random Forest on timeout

**5. Random Forest Model (Fallback)**
- 100 trees
- Max depth: 10
- Feature importance selection
- Fast training (< 5 seconds)

**6. Prediction Output**
- 5-hour ahead prediction
- Confidence intervals (±%)
- Trend direction (bullish/bearish/neutral)
- Entry point suggestions

### User Interactions

1. **Load Page** → Auto-fetch current market data
2. **Click "Predict"** → Start ML pipeline → Show progress → Display results
3. **Toggle Visualization** → Show/hide charts
4. **Refresh Data** → Re-fetch from Binance

### Data Handling

- Client-side state management with React hooks
- API route for server-side data fetching (hide API keys)
- LocalStorage for caching recent predictions
- Error boundaries for graceful failures

### Edge Cases

- API rate limiting → Show cached data with timestamp
- LSTM training timeout → Auto-fallback to Random Forest
- No internet → Show offline message with last known data
- Invalid data → Show error state with retry option

---

## Technical Architecture

### API Routes
- `GET /api/predict` - Run prediction pipeline
- `GET /api/market` - Fetch current market data
- `GET /api/indicators` - Calculate technical indicators

### Dependencies to Add
- `@tensorflow/tfjs` - ML in browser/Node.js
- `recharts` - Charts and visualizations
- `technicalindicators` - Technical analysis library

---

## Acceptance Criteria

1. ✅ Page loads with current BTC price from Binance
2. ✅ Technical indicators (RSI, MACD, Bollinger Bands) display correctly
3. ✅ Clicking "Predict" triggers ML pipeline
4. ✅ 5-hour prediction chart displays after processing
5. ✅ Fallback to Random Forest works if LSTM times out
6. ✅ Responsive design works on mobile/tablet/desktop
7. ✅ Error states handled gracefully
8. ✅ Loading states visible during data fetch
9. ✅ Dark theme with Bitcoin orange accents throughout
10. ✅ All text readable, proper contrast ratios

---

## File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── market/route.ts      # Binance data fetching
│   │   ├── predict/route.ts     # ML prediction pipeline
│   │   └── indicators/route.ts # Technical indicators
│   ├── layout.tsx
│   ├── page.tsx                 # Main UI
│   └── globals.css
├── components/
│   ├── Header.tsx
│   ├── MarketStats.tsx
│   ├── IndicatorCard.tsx
│   ├── PredictionChart.tsx
│   └── TechnicalChart.tsx
└── lib/
    ├── binance.ts               # Binance API client
    ├── indicators.ts            # Technical indicator calculations
    └── models/
        ├── lstm.ts              # LSTM model wrapper
        └── randomForest.ts      # Random Forest implementation
```
