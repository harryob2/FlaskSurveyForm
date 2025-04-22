const { test, expect } = require('@playwright/test');
const {
  BASE_URL,
  gotoHome,
  loginAsAdmin,
  fillBasicInternalTrainingForm
} = require('./utils/test-utils');

console.log("--- Loading bulk_add_trainees.spec.js ---");

test.describe('Bulk Add Trainees', () => {
  console.log("--- Defining bulk add trainees test suite ---");
  
  // Login once before all tests in this file
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('1. should open modal when bulk add button is clicked', async ({ page }) => {
    console.log("--- Starting test: Bulk Add Modal Functionality ---");
    
    // Navigate to the form page
    await gotoHome(page);
    console.log("--- Navigated to form page ---");
    
    // Start filling the form to make the trainees section visible
    await fillBasicInternalTrainingForm(page, {
      includeTrainee: false, // Skip adding trainees through the helper
      skipBaseSetup: false
    });
    console.log("--- Form fields populated ---");
    
    // Verify the bulk add button exists
    const bulkAddButton = page.locator('#bulk-add-trainees-btn');
    await expect(bulkAddButton).toBeVisible({ timeout: 5000 });
    console.log("--- Bulk Add button is visible ---");
    
    // Click the bulk add button
    await bulkAddButton.click();
    console.log("--- Clicked Bulk Add button ---");
    
    // Wait for the modal to appear
    await expect(page.locator('#bulkAddModal')).toBeVisible({ timeout: 5000 });
    console.log("--- Modal appeared ---");
    
    // Verify the textarea exists within the modal
    const emailTextarea = page.locator('#bulkAddModal #trainee_emails');
    await expect(emailTextarea).toBeVisible();
    console.log("--- Email textarea is visible in modal ---");
    
    // Test adding some emails through the modal
    await emailTextarea.fill('greene@test.com');
    console.log("--- Filled email textarea with greene@test.com ---");
    
    // Click the Add Emails button
    await page.locator('#bulkAddModal #add-emails-btn').click();
    console.log("--- Clicked Add Emails button ---");
    
    // Wait for the modal to close
    await expect(page.locator('#bulkAddModal')).not.toBeVisible({ timeout: 5000 });
    console.log("--- Modal closed after adding emails ---");
    
    // Verify trainees were NOT added (since greene@test.com likely doesn't exist)
    const traineeCount = await page.locator('#trainees-list .card').count();
    expect(traineeCount).toBe(0); // Expect 0 trainees as the email wasn't found
    console.log(`--- Found ${traineeCount} trainee cards (expected 0) ---`);
    
    console.log("--- Finished test: Bulk Add Modal Functionality ---");
  });
}); 