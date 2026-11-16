'use strict';

const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

async function expectNoAccessibilityViolations(page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
    .analyze();

  expect(
    results.violations.map(violation => ({
      id: violation.id,
      impact: violation.impact,
      description: violation.description,
      nodes: violation.nodes.map(node => ({
        target: node.target,
        summary: node.failureSummary
      }))
    }))
  ).toEqual([]);
}

test('initial learner screen has no automated axe-core violations', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#question')).toContainText('Hello');
  await expectNoAccessibilityViolations(page);
});

test('answered feedback state has no automated axe-core violations', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'مرحبًا' }).click();
  await expect(page.locator('#feedback')).toContainText('إجابة صحيحة');
  await expectNoAccessibilityViolations(page);
});

test('completed and reset learner states have no automated axe-core violations', async ({ page }) => {
  await page.goto('/');
  const correctAnswers = ['مرحبًا', 'am', 'books', 'drinks', 'small', 'an', 'are', 'شكرًا لك'];

  for (const answer of correctAnswers) {
    await page.getByRole('button', { name: answer, exact: true }).click();
    await expect(page.locator('#feedback')).toContainText('إجابة صحيحة');
    await page.getByRole('button', { name: 'التالي' }).click();
  }

  await expect(page.locator('#lesson-title')).toContainText('أحسنت');
  await expectNoAccessibilityViolations(page);

  await page.getByRole('button', { name: 'إعادة الدرس' }).click();
  await expect(page.locator('#question')).toContainText('Hello');
  await expectNoAccessibilityViolations(page);
});

test('narrow mobile learner screen has no automated axe-core violations', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto('/');
  await expect(page.locator('#question')).toContainText('Hello');
  await expectNoAccessibilityViolations(page);
});
