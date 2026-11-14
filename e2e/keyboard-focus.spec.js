'use strict';

const { test, expect } = require('@playwright/test');

test('moves focus from an answered option to Next and then to the next question', async ({ page }) => {
  await page.goto('/');

  const answer = page.getByRole('button', { name: 'مرحبًا' });
  const next = page.getByRole('button', { name: 'التالي' });
  const question = page.locator('#question');

  await answer.click();
  await expect(next).toBeFocused();

  await next.click();
  await expect(question).toBeFocused();
  await expect(question).toContainText('I ___ a student');
});

test('moves focus to completion and returns it to question one after reset', async ({ page }) => {
  await page.goto('/');

  const correctChoices = [0, 0, 1, 1, 0, 1, 2, 1];
  const next = page.getByRole('button', { name: 'التالي' });

  for (let index = 0; index < correctChoices.length; index += 1) {
    await page.locator('#answers button').nth(correctChoices[index]).click();
    await expect(next).toBeFocused();
    await next.click();

    if (index < correctChoices.length - 1) {
      await expect(page.locator('#question')).toBeFocused();
    } else {
      await expect(page.locator('#lesson-title')).toBeFocused();
      await expect(page.locator('#lesson-title')).toContainText('أحسنت');
    }
  }

  await page.getByRole('button', { name: 'إعادة الدرس' }).click();
  await expect(page.locator('#question')).toBeFocused();
  await expect(page.locator('#question')).toContainText('Hello');
});

test('keyboard activation follows the same focus order', async ({ page }) => {
  await page.goto('/');

  const answer = page.getByRole('button', { name: 'مرحبًا' });
  const next = page.getByRole('button', { name: 'التالي' });

  await answer.focus();
  await page.keyboard.press('Enter');
  await expect(next).toBeFocused();

  await page.keyboard.press('Enter');
  await expect(page.locator('#question')).toBeFocused();
  await expect(page.locator('#question')).toContainText('I ___ a student');
});

test('respects the operating-system reduced-motion preference for the progress indicator', async ({ page }) => {
  await page.goto('/');

  const progress = page.locator('#progress');
  await expect.poll(() => progress.evaluate(element => getComputedStyle(element).transitionDuration)).toBe('0.2s');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => progress.evaluate(element => getComputedStyle(element).transitionDuration)).toBe('0s');
});
