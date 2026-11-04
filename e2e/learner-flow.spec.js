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
  await expect(page.getByRole('button', { name: 'إلى اللقاء' })).toHaveAttribute('aria-disabled', 'true');
  await expect(page.getByRole('button', { name: 'التالي' })).toBeEnabled();
  await expect(page.locator('#score-label')).toContainText('0');
});

test('supports keyboard answer selection and a predictable focus path', async ({ page }) => {
  await page.goto('/');
  const correct = page.getByRole('button', { name: 'مرحبًا' });
  await correct.focus();
  await page.keyboard.press('Enter');

  await expect(correct).toHaveAttribute('aria-disabled', 'true');
  await expect(correct).toContainText('إجابتك صحيحة');
  await expect(correct).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'التالي' })).toBeFocused();
});

test('announces the correct choice after an incorrect keyboard answer', async ({ page }) => {
  await page.goto('/');
  const incorrect = page.getByRole('button', { name: 'إلى اللقاء' });
  await incorrect.focus();
  await page.keyboard.press('Space');

  await expect(page.locator('#feedback')).toContainText('الإجابة الصحيحة: مرحبًا');
  await expect(incorrect).toHaveAttribute('aria-disabled', 'true');
  await expect(page.getByRole('button', { name: /الإجابة الصحيحة/ })).toContainText('الإجابة الصحيحة');
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

test('reviews recorded wrong answers after completion without adding points', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'إلى اللقاء', exact: true }).click();
  await page.getByRole('button', { name: 'التالي', exact: true }).click();

  for (const answer of ['am', 'books', 'drinks', 'small', 'an', 'are', 'شكرًا لك']) {
    await page.getByRole('button', { name: answer, exact: true }).click();
    await page.getByRole('button', { name: 'التالي', exact: true }).click();
  }

  await expect(page.locator('#lesson-title')).toContainText('أحسنت');
  await expect(page.locator('#score-label')).toContainText('7');
  const reviewButton = page.getByRole('button', { name: 'مراجعة أخطائي', exact: true });
  await expect(reviewButton).toBeVisible();
  await reviewButton.click();
  await expect(page.locator('#review-panel')).toBeVisible();
  await expect(page.locator('#review-list .review-item')).toHaveCount(1);
  await expect(page.locator('#review-list')).toContainText('ما معنى “Hello”؟');
  await expect(page.locator('#review-list')).toContainText('إجابتك: إلى اللقاء');
  await expect(page.locator('#review-list')).toContainText('الإجابة الصحيحة: مرحبًا');
  await expect(page.locator('#review-list')).toContainText('Hello هي تحية تُستخدم عند اللقاء.');
  await expect(page.locator('#review-summary')).toContainText('المراجعة لا تضيف نقاطًا');
  await expect(page.locator('#score-label')).toContainText('7');
  const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('verbasprout-progress')));
  expect(persisted.version).toBe(3);
  expect(persisted.mistakes).toEqual([{ questionId: 'a1-hello-meaning', selected: 1 }]);

  await page.reload();
  await expect(reviewButton).toBeVisible();
  await reviewButton.click();
  await expect(page.locator('#review-list .review-item')).toHaveCount(1);
  await expect(page.locator('#review-list')).toContainText('إجابتك: إلى اللقاء');
  await expect(page.locator('#score-label')).toContainText('7');
});

test('migrates index-based saved mistakes to stable lesson IDs', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('verbasprout-progress', JSON.stringify({
    version: 2,
    step: 0,
    score: 0,
    answered: false,
    selected: null,
    mistakes: [{ questionIndex: 0, selected: 1 }],
    completed: false,
    updatedAt: '2026-10-28T00:00:00.000Z'
  })));
  await page.reload();

  const migrated = await page.evaluate(() => JSON.parse(localStorage.getItem('verbasprout-progress')));
  expect(migrated.version).toBe(3);
  expect(migrated.questionId).toBe('a1-hello-meaning');
  expect(migrated.mistakes).toEqual([{ questionId: 'a1-hello-meaning', selected: 1 }]);
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
