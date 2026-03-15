'use client';

import { useState, useEffect } from 'react';

export interface ModelSettings {
  epochs: number;
  batchSize: number;
  learningRate: number;
  lookback: number;
  modelType: 'lstm' | 'random-forest';
}

interface ModelSettingsCardProps {
  settings: ModelSettings;
  onSettingsChange: (settings: ModelSettings) => void;
  isTraining: boolean;
}

export function ModelSettingsCard({ settings, onSettingsChange, isTraining }: ModelSettingsCardProps) {
  const [localSettings, setLocalSettings] = useState<ModelSettings>(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleChange = (key: keyof ModelSettings, value: number) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  return (
    <div className="model-settings-card">
      <div className="settings-header">
        <h3>Model Settings</h3>
      </div>

      <div className="settings-grid">
        <div className="setting-item">
          <div className="setting-label">
            <span>Epochs</span>
            <span className="setting-value">{localSettings.epochs}</span>
          </div>
          <input
            type="range"
            min="5"
            max="100"
            step="5"
            value={localSettings.epochs}
            onChange={(e) => handleChange('epochs', parseInt(e.target.value))}
            disabled={isTraining}
            className="setting-slider"
          />
          <div className="setting-range">
            <span>5</span>
            <span>100</span>
          </div>
        </div>

        <div className="setting-item">
          <div className="setting-label">
            <span>Batch Size</span>
            <span className="setting-value">{localSettings.batchSize}</span>
          </div>
          <div className="batch-options">
            {[16, 32, 64, 128].map((size) => (
              <button
                key={size}
                className={`batch-btn ${localSettings.batchSize === size ? 'active' : ''}`}
                onClick={() => handleChange('batchSize', size)}
                disabled={isTraining}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <div className="setting-item">
          <div className="setting-label">
            <span>Learning Rate</span>
            <span className="setting-value">{localSettings.learningRate}</span>
          </div>
          <input
            type="range"
            min="0.0001"
            max="0.01"
            step="0.0001"
            value={localSettings.learningRate}
            onChange={(e) => handleChange('learningRate', parseFloat(e.target.value))}
            disabled={isTraining}
            className="setting-slider"
          />
          <div className="setting-range">
            <span>0.0001</span>
            <span>0.01</span>
          </div>
        </div>

        <div className="setting-item">
          <div className="setting-label">
            <span>Lookback</span>
            <span className="setting-value">{localSettings.lookback}h</span>
          </div>
          <input
            type="range"
            min="12"
            max="72"
            step="6"
            value={localSettings.lookback}
            onChange={(e) => handleChange('lookback', parseInt(e.target.value))}
            disabled={isTraining}
            className="setting-slider"
          />
          <div className="setting-range">
            <span>12h</span>
            <span>72h</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export const defaultModelSettings: ModelSettings = {
  epochs: 20,
  batchSize: 32,
  learningRate: 0.001,
  lookback: 24,
  modelType: 'lstm'
};
