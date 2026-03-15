'use client';

import { useState } from 'react';
import { exportToCSV, exportToPDF } from '@/lib/export';

interface ExportButtonProps {
  chartId: string;
  filename: string;
  title: string;
  data?: Record<string, unknown>[];
  summaryData?: Record<string, string>;
}

export function ExportButton({ chartId, filename, title, data, summaryData }: ExportButtonProps) {
  const [exporting, setExporting] = useState<'csv' | 'pdf' | null>(null);

  const handleCSVExport = async () => {
    if (!data || data.length === 0) return;
    setExporting('csv');
    try {
      exportToCSV(data, filename);
    } catch (error) {
      console.error('CSV export failed:', error);
    } finally {
      setExporting(null);
    }
  };

  const handlePDFExport = async () => {
    setExporting('pdf');
    try {
      await exportToPDF(chartId, filename, title, summaryData);
    } catch (error) {
      console.error('PDF export failed:', error);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="export-buttons">
      <button
        className="export-btn csv"
        onClick={handleCSVExport}
        disabled={exporting !== null || !data}
        title="Export as CSV"
      >
        {exporting === 'csv' ? (
          <span className="export-spinner"></span>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <path d="M14 2v6h6M8 13h8M8 17h8M8 9h2"/>
          </svg>
        )}
        CSV
      </button>
      <button
        className="export-btn pdf"
        onClick={handlePDFExport}
        disabled={exporting !== null}
        title="Export as PDF"
      >
        {exporting === 'pdf' ? (
          <span className="export-spinner"></span>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
          </svg>
        )}
        PDF
      </button>
    </div>
  );
}
