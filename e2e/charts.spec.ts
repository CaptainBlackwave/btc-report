import { test, expect } from '@playwright/test';

test.describe('Chart Tooltip Behavior', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Technical Chart - tooltip follows cursor correctly', async ({ page }) => {
    const chartContainer = page.locator('.technical-panel .recharts-wrapper');
    await expect(chartContainer).toBeVisible({ timeout: 10000 });

    const chart = chartContainer.locator('svg');
    const chartBox = await chart.boundingBox();
    
    if (!chartBox) {
      throw new Error('Chart not found');
    }

    const tooltip = page.locator('.recharts-tooltip-wrapper');
    
    const initialTooltipState = await tooltip.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.display === 'none';
    });

    const centerX = chartBox.x + chartBox.width / 2;
    const centerY = chartBox.y + chartBox.height / 2;
    
    await page.mouse.move(centerX, centerY);
    await page.waitForTimeout(500);

    const tooltipVisibleAfterMove = await tooltip.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.display !== 'none';
    });

    if (tooltipVisibleAfterMove) {
      const tooltipBox = await tooltip.boundingBox();
      console.log('Tooltip appeared at:', tooltipBox);
    }

    const rightX = chartBox.x + chartBox.width * 0.75;
    await page.mouse.move(rightX, centerY);
    await page.waitForTimeout(500);

    const tooltipVisibleAtRight = await tooltip.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.display !== 'none';
    });

    if (tooltipVisibleAtRight) {
      const tooltipBox = await tooltip.boundingBox();
      console.log('Tooltip at right side:', tooltipBox);
    }

    const activeDots = page.locator('.recharts-surface .recharts-active-dot');
    const activeDotsCount = await activeDots.count();
    console.log('Active dots found:', activeDotsCount);
  });

  test('Prediction Chart - tooltip follows cursor correctly', async ({ page }) => {
    const predictBtn = page.locator('button:has-text("Predict")');
    
    if (await predictBtn.isVisible()) {
      await predictBtn.click();
      await page.waitForTimeout(5000);
    }

    const chartContainer = page.locator('.prediction-panel .recharts-wrapper');
    await expect(chartContainer).toBeVisible({ timeout: 10000 });

    const chart = chartContainer.locator('svg');
    const chartBox = await chart.boundingBox();
    
    if (!chartBox) {
      throw new Error('Chart not found');
    }

    const tooltip = page.locator('.recharts-tooltip-wrapper');

    const leftX = chartBox.x + chartBox.width * 0.25;
    const centerY = chartBox.y + chartBox.height / 2;
    
    await page.mouse.move(leftX, centerY);
    await page.waitForTimeout(300);

    const tooltipAtLeft = await tooltip.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return { display: style.display, opacity: style.opacity };
    });
    console.log('Tooltip at left:', tooltipAtLeft);

    const rightX = chartBox.x + chartBox.width * 0.75;
    await page.mouse.move(rightX, centerY);
    await page.waitForTimeout(300);

    const tooltipAtRight = await tooltip.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return { display: style.display, opacity: style.opacity };
    });
    console.log('Tooltip at right:', tooltipAtRight);
  });

  test('Backtest Chart - tooltip follows cursor correctly', async ({ page }) => {
    const backtestCard = page.locator('.backtest-card');
    
    if (await backtestCard.isVisible()) {
      const runBtn = page.locator('button:has-text("Run Backtest")');
      if (await runBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await runBtn.click();
        await page.waitForTimeout(5000);
      }
    }

    const chartContainer = page.locator('.backtest-chart .recharts-wrapper');
    
    await expect(chartContainer).toBeVisible({ timeout: 15000 });

    const chart = chartContainer.locator('svg');
    const chartBox = await chart.boundingBox();
    
    if (!chartBox) {
      throw new Error('Chart not found');
    }

    const tooltip = page.locator('.recharts-tooltip-wrapper');

    const positions = [0.25, 0.5, 0.75];
    
    for (const pos of positions) {
      const x = chartBox.x + chartBox.width * pos;
      const y = chartBox.y + chartBox.height / 2;
      
      await page.mouse.move(x, y);
      await page.waitForTimeout(300);

      const tooltipState = await tooltip.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return style.display;
      });
      console.log(`Tooltip at ${pos * 100}%: ${tooltipState}`);
    }
  });

  test('All charts render without console errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const criticalErrors = errors.filter(e => 
      !e.includes('Warning') && 
      !e.includes('hydration') &&
      !e.includes('favicon')
    );

    console.log('Console errors:', criticalErrors);
    
    expect(criticalErrors.length).toBe(0);
  });
});
