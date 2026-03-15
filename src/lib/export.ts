import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export function exportToCSV(data: Record<string, unknown>[], filename: string): void {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row =>
      headers
        .map(header => {
          const value = row[header];
          const stringValue = value === null || value === undefined ? '' : String(value);
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        })
        .join(',')
    )
  ];

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function exportToPDF(
  elementId: string,
  filename: string,
  title: string,
  summaryData?: Record<string, string>
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Element not found');
  }

  const canvas = await html2canvas(element, {
    backgroundColor: '#0a0a0f',
    scale: 2,
    logging: false,
    useCORS: true
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;

  pdf.setFillColor(10, 10, 15);
  pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');

  pdf.setTextColor(247, 147, 26);
  pdf.setFontSize(20);
  pdf.text(title, margin, 20);

  if (summaryData) {
    pdf.setFontSize(12);
    pdf.setTextColor(232, 232, 237);
    
    let yPos = 35;
    Object.entries(summaryData).forEach(([key, value]) => {
      pdf.setTextColor(139, 139, 154);
      pdf.text(`${key}: `, margin, yPos);
      pdf.setTextColor(232, 232, 237);
      pdf.text(value, margin + 40, yPos);
      yPos += 8;
    });
    yPos += 10;
  }

  const imgWidth = pdfWidth - margin * 2;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
  const maxHeight = pdfHeight - margin * 2 - (summaryData ? 60 : 20);
  const finalHeight = Math.min(imgHeight, maxHeight);
  const finalWidth = (finalHeight * canvas.width) / canvas.height;

  pdf.addImage(imgData, 'PNG', margin, summaryData ? 80 : 30, finalWidth, finalHeight);

  pdf.save(`${filename}.pdf`);
}

export function generateReportData() {
  return {
    generatedAt: new Date().toISOString(),
    version: '1.0.0'
  };
}
