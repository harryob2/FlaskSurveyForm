// tests/e2e/screenshot-debug.spec.js
const { test, expect } = require('@playwright/test');
const { BASE_URL, loginAsAdmin } = require('./utils/test-utils');

test.describe('Debug Screenshots', () => {
  test('take screenshots of pages', async ({ page }) => {
    // Login first
    await loginAsAdmin(page);
    
    // Go to home page and take a screenshot
    await page.goto(BASE_URL + '/');
    await page.screenshot({ path: 'debug-home.png' });
    
    // Log the page HTML to see what's actually in the DOM
    const html = await page.content();
    console.log('Page HTML structure:');
    console.log(html.substring(0, 2000) + '...'); // First 2000 chars to avoid huge logs
    
    // Try to find the radio buttons with different strategies
    const radioButtons = await page.locator('input[type="radio"]').count();
    console.log(`Found ${radioButtons} radio buttons on the page`);
    
    const labels = await page.locator('label').count();
    console.log(`Found ${labels} labels on the page`);
    
    // Check if any labels contain "Training"
    const trainingLabels = await page.locator('label:has-text("Training")').count();
    console.log(`Found ${trainingLabels} labels containing "Training"`);
    
    // List the actual label texts
    const allLabels = await page.locator('label').allInnerTexts();
    console.log('All label texts:', allLabels);
    
    // Check for specific form elements
    await page.screenshot({ path: 'debug-form.png' });
  });
}); 