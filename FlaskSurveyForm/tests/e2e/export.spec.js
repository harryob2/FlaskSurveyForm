const { test, expect } = require('@playwright/test');
const {
  BASE_URL,
  gotoHome,
  loginAsAdmin,
  fillBasicInternalTrainingForm,
  submitForm,
  expectSuccessfulSubmission
} = require('./utils/test-utils');

console.log("--- Loading export.spec.js ---");

test.describe('Export Approved Forms', () => {
  console.log("--- Defining export test suite ---");
  
  // Login once before all tests in this file
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('1. should export approved forms to an Excel file', async ({ page }) => {
    console.log("--- Starting test: Export Approved Forms ---");

    // --- 1. Create and Submit a Form ---
    await gotoHome(page);
    // Use a unique trainer name to avoid clashes if tests run concurrently or DB is not cleared
    const uniqueTrainerName = `Export Tester ${Date.now()}`;
    await fillBasicInternalTrainingForm(page, {
      trainerName: uniqueTrainerName,
      description: 'Form for export test',
      includeTrainee: true
    });
    await submitForm(page);
    await expectSuccessfulSubmission(page);
    console.log("--- Form submitted successfully ---");

    // --- 2. Navigate to List Page ---
    await page.goto(BASE_URL + '/list');
    await expect(page.locator('h2:has-text("Training Form Submissions")')).toBeVisible();
    console.log("--- Navigated to List Page ---");

    // --- 3. Approve the Form ---
    // Find the specific row for our unique trainer
    const formRow = page.locator(`.trainings-table tbody tr:has-text("${uniqueTrainerName}")`);
    await expect(formRow).toBeVisible(); 

    const approveButton = formRow.locator('a.btn:has-text("Approve")');
    await expect(approveButton).toBeVisible();
    await approveButton.click();

    // Explicitly wait for the Unapprove button to appear in that specific row
    const unapproveButton = formRow.locator('a.btn:has-text("Unapprove")');
    await expect(unapproveButton).toBeVisible({ timeout: 10000 }); // Increased timeout
    console.log("--- Form approved (Unapprove button visible) ---");

    // --- 4. Click Export Button and Verify Download ---
    const exportButton = page.locator('a.btn:has-text("Export to Claim 5 Form")');
    await expect(exportButton).toBeVisible();

    // Start waiting for the download before clicking the button
    const downloadPromise = page.waitForEvent('download', { timeout: 15000 }); // Increased timeout
    await exportButton.click();

    // Wait for the download to complete
    const download = await downloadPromise;

    // Verify the downloaded file name
    const expectedFilename = 'claim5_approved_forms_export.xlsx';
    expect(download.suggestedFilename()).toBe(expectedFilename);
    console.log(`--- Download started with expected filename: ${expectedFilename} ---`);

    console.log("--- Finished test: Export Approved Forms ---");
  });

  test('2. should show info message if no approved forms exist for export', async ({ page }) => {
    console.log("--- Starting test: Export with No Approved Forms ---");
  
    // --- 1. Navigate to List Page and Ensure No Forms are Approved ---
    await page.goto(BASE_URL + '/list');
    await expect(page.locator('h2:has-text("Training Form Submissions")')).toBeVisible();
    console.log("--- Navigated to List Page ---");

    // Attempt to unapprove any visible approved forms on the current page
    const unapproveButtons = page.locator('.trainings-table tbody a.btn:has-text("Unapprove")');
    const count = await unapproveButtons.count();
    console.log(`--- Found ${count} potentially approved forms to unapprove on this page ---`);
    for (let i = 0; i < count; ++i) {
        const button = unapproveButtons.nth(i);
        console.log(`--- Clicking Unapprove button ${i + 1} ---`);
        await button.click();
        // Wait briefly for potential DOM updates after clicking
        await page.waitForTimeout(500); 
        // Re-query the list page to ensure we are on the right page after potential navigation
        await page.goto(BASE_URL + '/list', { waitUntil: 'networkidle' }); 
    }
    // Add a final check to ensure no unapprove buttons are left after the loop
    await expect(page.locator('.trainings-table tbody a.btn:has-text("Unapprove")')).toHaveCount(0, { timeout: 5000 });
    console.log("--- Ensured no forms are approved on the current page ---");

  
    // --- 2. Click Export Button ---
    const exportButton = page.locator('a.btn:has-text("Export to Claim 5 Form")');
    await expect(exportButton).toBeVisible();
    await exportButton.click();
  
    // --- 3. Verify Info Flash Message ---
    // Wait specifically for the alert containing the correct text
    const flashMessage = page.locator('.alert.alert-info:has-text("No approved forms found to export.")');
    await expect(flashMessage).toBeVisible({ timeout: 10000 }); 
    console.log("--- Verified 'No approved forms' flash message ---");
  
    // --- 4. Verify Still on List Page ---
    await expect(page).toHaveURL(new RegExp(`${BASE_URL}/list`)); 
    await expect(page.locator('h2:has-text("Training Form Submissions")')).toBeVisible();
  
    console.log("--- Finished test: Export with No Approved Forms ---");
  });

}); 