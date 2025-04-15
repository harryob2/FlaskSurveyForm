// tests/e2e/attachment.spec.js
const { test, expect } = require('@playwright/test');
const path = require('path'); // Needed for file path resolution

console.log("--- Loading attachment.spec.js ---");

// Base URL for the application
const baseURL = 'http://127.0.0.1:5000';

test.describe('File Attachment Handling', () => {
  console.log("--- Defining attachment test suite ---");

  test('should allow uploading a file and verify it on the view page', async ({ page }) => {
    console.log("--- Starting test: File Upload and Verification ---");

    // --- 1. Define Test Data ---
    const standardTrainerName = 'Attachment Tester'; // Use a standard trainer name
    const standardDescription = 'Test upload description';
    const attachmentFilename = 'test-attachment.txt';
    const attachmentPath = path.join(__dirname, 'fixtures', attachmentFilename);

    // --- 2. Navigate and Fill Form ---
    await page.goto(baseURL + '/');

    // Fill minimal required fields + standard trainer name
    await page.locator('label').filter({ hasText: 'Internal Training' }).click();
    await page.locator('label').filter({ hasText: 'Onsite' }).click();
    await page.locator('input[name="start_date"]').fill('2024-01-01');
    await page.locator('input[name="end_date"]').fill('2024-01-01');
    await page.locator('input[name="trainer_days"]').fill('1');
    await page.locator('input[name="trainee_days"]').fill('1');
    await page.locator('input#trainer_name_search').fill(standardTrainerName); // Use standard name
    await page.evaluate((name) => { // Set hidden field using argument
        const hiddenInput = document.getElementById('trainer_name_hidden');
        if (hiddenInput) { hiddenInput.value = name; }
    }, standardTrainerName); // Pass standard name to evaluate
    await page.locator('textarea[name="training_description"]').fill(standardDescription);

    // --- 3. Select File using FileChooser event --- 
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('#dropzone').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(attachmentPath);

    // Wait for the file to appear in the attachment table UI
    const attachmentTableBody = page.locator('#attachment-table tbody');
    await expect(attachmentTableBody.locator(`tr:has-text("${attachmentFilename}")`)).toBeVisible();
    console.log("--- Attachment added to UI table ---");

    // --- 4. Submit Form ---
    await page.locator('#submit-training-form-btn').click();

    // --- 5. Confirm Success Page ---
    await page.waitForURL('**/success');
    await expect(page).toHaveURL(baseURL + '/success');
    console.log("--- Reached Success Page ---");

    // --- 6. Navigate to List Page --- 
    await page.goto(baseURL + '/list'); 
    console.log("--- Navigated to List Page ---");

    // --- 7. Find Submission and Extract ID from First Row ---
    // Locate the first data row in the table body
    const tableRow = page.locator('table tbody tr:first-child'); 
    await expect(tableRow).toBeVisible(); // Ensure the first row exists

    // Find the "View" link within that row and get its href
    const viewLink = tableRow.locator('a[href*="/view/"]');
    const viewHref = await viewLink.getAttribute('href');
    expect(viewHref).toBeTruthy();

    // Extract the form ID from the href
    const formIdMatch = viewHref.match(/\/view\/(\d+)/);
    expect(formIdMatch).toBeTruthy();
    const formId = formIdMatch[1];
    console.log(`--- Found Form ID from first row: ${formId} ---`);

    // --- 8. Navigate to View Page ---
    await page.goto(baseURL + viewHref);
    console.log(`--- Navigated to View Page: ${viewHref} ---`);

    // --- 9. Verify Attachment ---
    const attachmentLink = page.locator(`a:has-text("${attachmentFilename}")`);
    await expect(attachmentLink).toBeVisible();

    const expectedAttachmentHref = `/uploads/form_${formId}/${attachmentFilename}`;
    await expect(attachmentLink).toHaveAttribute('href', expectedAttachmentHref);
    console.log(`--- Verified Attachment Link: ${expectedAttachmentHref} ---`);

    console.log("--- Finished test: File Upload and Verification ---");
  });

}); 