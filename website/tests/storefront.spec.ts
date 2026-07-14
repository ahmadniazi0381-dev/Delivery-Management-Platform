import { test, expect } from '@playwright/test';

test.describe('Naseeb Baryani Storefront E2E Tests', () => {
  const BASE_URL = 'http://localhost:3000';

  test('should load the homepage and show menu items', async ({ page }) => {
    // Navigate to homepage
    await page.goto(BASE_URL);

    // Check header section shows the name
    await expect(page.locator('text=Naseeb Baryani')).toBeVisible();

    // Check if the menu section loads
    await expect(page.locator('text=Menu')).toBeVisible();
  });

  test('should navigate to auth and register/login page', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/login`);

    // Verify login card exists
    await expect(page.locator('text=Sign In')).toBeVisible();
  });
});
