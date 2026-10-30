'use strict';

const { test, expect } = require('@playwright/test');

test('restores an answered lesson and does not count it twice', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#question')).toContainText('Hello');

  await page.getByRole('button', { name: 'مرحبًا' }).click();
  await expect(page.locator('#feedback')).toContainText('إجابة صحيحة');
  await expect(page.getByRole('button', { name: 'التالي' })).toBeEnabled();

  await page.reload();
  await expect(page.locator('#question')).toContainText('Hello');
  await expect(page.locator('#feedback')).toContainText('إجابة صحيحة');
  await expect(page.locator('#score-label')).toContainText('1');
  await expect(page.getByRole('button', { name: 'التالي' })).toBeEnabled();

  await page.getByRole('button', { name: 'التالي' }).click();
  await expect(page.locator('#question')).toContainText('I ___ a student');
  await expect(page.locator('#score-label')).toContainText('1');

  await page.reload();
  await expect(page.locator('#question')).toContainText('I ___ a student');
  await expect(page.locator('#score-label')).toContainText('1');
});

test('restores incorrect-answer feedback after reload', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'إلى اللقاء' }).click();

  await expect(page.locator('#feedback')).toContainText('ليست الإجابة الصحيحة');
  await page.reload();

  await expect(page.locator('#feedback')).toContainText('ليست الإجابة الصحيحة');
  await expect(page.getByRole('button', { name: 'إلى اللقاء' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'التالي' })).toBeEnabled();
  await expect(page.locator('#score-label')).toContainText('0');
});

test('reset clears the saved lesson and score', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'مرحبًا' }).click();
  await page.getByRole('button', { name: 'التالي' }).click();
  await page.getByRole('button', { name: 'إعادة الدرس' }).click();

  await expect(page.locator('#question')).toContainText('Hello');
  await expect(page.locator('#score-label')).toContainText('0');
  await expect(page.locator('#saved')).toContainText('لم تحفظ أي إجابات');
});

test('keeps the learner screen within narrow mobile viewports', async ({ page }) => {
  await page.goto('/');

  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 800 });
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth
    }));
    expect(dimensions.content, `horizontal overflow at ${width}px`).toBeLessThanOrEqual(dimensions.viewport);
    await expect(page.locator('#question')).toContainText('Hello');
  }
});

test('opens the cached lesson shell while offline', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)), { timeout: 10_000 }).toBe(true);

  await context.setOffline(true);
  await page.reload();

  await expect(page.locator('header h1')).toContainText('VerbaSprout');
  await expect(page.locator('#question')).toContainText('Hello');
});
