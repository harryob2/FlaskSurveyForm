// tests/e2e/attachment.spec.js
const { test, expect } = require('@playwright/test');
const path = require('path'); // Needed for file path resolution
const {
  BASE_URL,
  gotoHome,
  addTrainee,
  setTrainerName,
  fillBasicInternalTrainingForm,
  submitForm,
  expectSuccessfulSubmission
} = require('./utils/test-utils');

console.log("--- Loading attachment.spec.js ---");

test.describe('File Attachment Handling', () => {
  console.log("--- Defining attachment test suite ---");

  test('1. should allow uploading a file and verify it on the view page', async ({ page }) => {
    console.log("--- Starting test: File Upload and Verification ---");

    // --- 1. Define Test Data ---
    const standardTrainerName = 'Attachment Tester';
    const standardDescription = 'Test upload description';
    const attachmentFilename = 'test-attachment.txt';
    const attachmentPath = path.join(__dirname, 'fixtures', attachmentFilename);

    // --- 2. Navigate and Start Form ---
    await gotoHome(page);
    
    // --- 3. Fill Basic Form Fields ---
    // Use helper but skip trainee so we can add it after the file
    await fillBasicInternalTrainingForm(page, {
      trainerName: standardTrainerName,
      description: standardDescription,
      includeTrainee: false // Skip trainee for now
    });

    // --- 4. Upload File ---
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('#dropzone').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(attachmentPath);

    // --- 5. Verify Upload ---
    // Wait for the file to appear in the attachment table UI
    const attachmentTableBody = page.locator('#attachment-table tbody');
    await expect(attachmentTableBody.locator(`tr:has-text("${attachmentFilename}")`)).toBeVisible();
    console.log("--- Attachment added to UI table ---");

    // --- 6. Add Trainee ---
    await addTrainee(page, 'gre');

    // --- 7. Submit Form ---
    await submitForm(page);

    // --- 8. Verify Successful Submission ---
    await expectSuccessfulSubmission(page);
    console.log("--- Reached Success Page ---");

    // --- 9. Navigate to List Page and Extract Form ID ---
    await page.goto(BASE_URL + '/list');
    console.log("--- Navigated to List Page ---");

    // Locate the first data row in the table body
    const tableRow = page.locator('table tbody tr:first-child');
    await expect(tableRow).toBeVisible();

    // Find the "View" link and get its href
    const viewLink = tableRow.locator('a[href*="/view/"]');
    const viewHref = await viewLink.getAttribute('href');
    expect(viewHref).toBeTruthy();

    // Extract the form ID from the href
    const formIdMatch = viewHref.match(/\/view\/(\d+)/);
    expect(formIdMatch).toBeTruthy();
    const formId = formIdMatch[1];
    console.log(`--- Found Form ID from first row: ${formId} ---`);

    // --- 10. Navigate to View Page ---
    await page.goto(BASE_URL + viewHref);
    console.log(`--- Navigated to View Page: ${viewHref} ---`);

    // --- 11. Verify Attachment Link ---
    const attachmentLink = page.locator(`a:has-text("${attachmentFilename}")`);
    // Use a longer timeout for this operation since file uploads may take time to process
    await expect(attachmentLink).toBeVisible({ timeout: 10000 });

    const expectedAttachmentHref = `/uploads/form_${formId}/${attachmentFilename}`;
    await expect(attachmentLink).toHaveAttribute('href', expectedAttachmentHref);
    console.log(`--- Verified Attachment Link: ${expectedAttachmentHref} ---`);

    console.log("--- Finished test: File Upload and Verification ---");
  });
}); 