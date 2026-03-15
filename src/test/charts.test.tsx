import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { PredictionChart } from '@/components/PredictionChart';
import { TechnicalChart } from '@/components/TechnicalChart';
import { BacktestChart } from '@/components/BacktestChart';

global.fetch = vi.fn();

const mockIndicatorData = Array.from({ length: 50 }, (_, i) => ({
  time: Date.now() - (50 - i) * 60000,
  close: 42000 + Math.random() * 1000,
  sma7: 42000 + Math.random() * 500,
  sma25: 42000 + Math.random() * 300,
  sma99: 42000 + Math.random() * 200,
  rsi: 50 + Math.random() * 20,
  macd: Math.random() * 100 - 50,
  macdSignal: Math.random() * 100 - 50,
  macdHistogram: Math.random() * 50 - 25,
  bbUpper: 42500,
  bbMiddle: 42000,
  bbLower: 41500,
}));

describe('PredictionChart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        predictions: [42100, 42200, 42300, 42400, 42500],
        confidence: 75,
        trend: 'bullish',
        modelUsed: 'lstm',
        currentPrice: 42000,
        indicators: { rsi: 55, volatility: 0.02, trend: 'bullish' },
      }),
    });
  });

  it('renders without crashing', () => {
    render(
      <PredictionChart
        onPredict={() => {}}
        onPredictComplete={() => {}}
        isLoading={false}
        chartData={mockIndicatorData}
      />
    );
    expect(screen.getByText('Price Prediction')).toBeInTheDocument();
  });

  it('shows predict button', () => {
    render(
      <PredictionChart
        onPredict={() => {}}
        onPredictComplete={() => {}}
        isLoading={false}
        chartData={mockIndicatorData}
      />
    );
    expect(screen.getByRole('button', { name: /predict/i })).toBeInTheDocument();
  });

  it('displays loading state', () => {
    render(
      <PredictionChart
        onPredict={() => {}}
        onPredictComplete={() => {}}
        isLoading={true}
        chartData={mockIndicatorData}
      />
    );
    expect(screen.getByText(/analyzing/i)).toBeInTheDocument();
  });

  it('renders chart container', async () => {
    render(
      <PredictionChart
        onPredict={() => {}}
        onPredictComplete={() => {}}
        isLoading={false}
        chartData={mockIndicatorData}
      />
    );
    await waitFor(() => {
      const chartContainer = document.querySelector('.recharts-responsive-container');
      expect(chartContainer).toBeInTheDocument();
    });
  });

  it('handles prediction click', async () => {
    const onPredict = vi.fn();
    const onPredictComplete = vi.fn();

    render(
      <PredictionChart
        onPredict={onPredict}
        onPredictComplete={onPredictComplete}
        isLoading={false}
        chartData={mockIndicatorData}
      />
    );

    const predictBtn = screen.getByRole('button', { name: /predict/i });
    predictBtn.click();

    await waitFor(() => {
      expect(onPredict).toHaveBeenCalled();
    });
  });
});

describe('TechnicalChart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ chartData: mockIndicatorData }),
    });
  });

  it('renders without crashing', () => {
    render(<TechnicalChart chartData={mockIndicatorData} />);
    expect(screen.getByText('Technical Analysis')).toBeInTheDocument();
  });

  it('shows toggle buttons', () => {
    render(<TechnicalChart chartData={mockIndicatorData} />);
    expect(screen.getByText('SMA')).toBeInTheDocument();
    expect(screen.getByText('BB')).toBeInTheDocument();
    expect(screen.getByText('MACD')).toBeInTheDocument();
  });

  it('renders chart container', async () => {
    render(<TechnicalChart chartData={mockIndicatorData} />);
    await waitFor(() => {
      const chartContainer = document.querySelector('.recharts-responsive-container');
      expect(chartContainer).toBeInTheDocument();
    });
  });

  it('toggles SMA visibility', () => {
    render(<TechnicalChart chartData={mockIndicatorData} />);
    const smaButton = screen.getByText('SMA');
    smaButton.click();
  });

  it('toggles BB visibility', () => {
    render(<TechnicalChart chartData={mockIndicatorData} />);
    const bbButton = screen.getByText('BB');
    bbButton.click();
  });
});

describe('BacktestChart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        results: Array.from({ length: 20 }, (_, i) => ({
          date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
          actualPrice: 42000 + Math.random() * 1000,
          predictedPrice: 42000 + Math.random() * 1000,
        })),
        metrics: {
          mae: 150,
          mape: 2.5,
          accuracy: 65,
          totalPredictions: 100,
          directionAccuracy: 55,
        },
      }),
    });
  });

  it('renders without crashing', async () => {
    render(<BacktestChart />);
    await waitFor(() => {
      expect(screen.getByText('Model Backtesting')).toBeInTheDocument();
    });
  });

  it('shows run backtest button after loading', async () => {
    render(<BacktestChart />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /run backtest/i })).toBeInTheDocument();
    });
  });

  it('renders chart container', async () => {
    render(<BacktestChart />);
    await waitFor(() => {
      const chartContainer = document.querySelector('.recharts-responsive-container');
      expect(chartContainer).toBeInTheDocument();
    });
  });

  it('displays metrics after loading', async () => {
    render(<BacktestChart />);
    await waitFor(() => {
      expect(screen.getByText('MAE')).toBeInTheDocument();
      expect(screen.getByText('MAPE')).toBeInTheDocument();
    });
  });
});
