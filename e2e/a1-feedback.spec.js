'use strict';

const { test, expect } = require('@playwright/test');

test('shows the correct answer and the selected distractor explanation', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'إلى اللقاء' }).click();

  const feedback = page.locator('#feedback');
  await expect(feedback).toContainText('ليست الإجابة الصحيحة');
  await expect(feedback).toContainText('الإجابة الصحيحة هي «مرحبًا»');
  await expect(feedback).toContainText('Goodbye تُستخدم عند الوداع');
  await expect(page.locator('#score-label')).toContainText('0');
  await expect(page.getByRole('button', { name: 'التالي' })).toBeEnabled();
});

test('keeps the correct-answer path free of distractor feedback', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'مرحبًا' }).click();

  const feedback = page.locator('#feedback');
  await expect(feedback).toContainText('إجابة صحيحة!');
  await expect(feedback).toContainText('Hello هي تحية تُستخدم عند اللقاء');
  await expect(feedback).not.toContainText('ليست الإجابة الصحيحة');
  await expect(page.locator('#score-label')).toContainText('1');
  await expect(page.getByRole('button', { name: 'التالي' })).toBeEnabled();
});
