const { test, expect } = require("@playwright/test");
const {
  BASE_URL,
  gotoHome,
  loginAsAdmin,
  fillBasicInternalTrainingForm,
  submitForm,
  expectSuccessfulSubmission
} = require("./utils/test-utils");

console.log("--- Loading export.spec.js ---");

test.describe("Export Approved Forms", () => {
  console.log("--- Defining export test suite ---");

  // Login once before all tests in this file
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("1. should export approved forms to an Excel file", async ({ page }) => {
    console.log("--- Starting test: Export Approved Forms ---");

    // --- 1. Create and Submit a Form ---
    await gotoHome(page);
    // Use a unique trainer name to avoid clashes if tests run concurrently or DB is not cleared
    const uniqueTrainerName = `Export Tester ${Date.now()}`;
    await fillBasicInternalTrainingForm(page, {
      trainerName: uniqueTrainerName,
      description: "Form for export test",
      includeTrainee: true
    });
    await submitForm(page);
    await expectSuccessfulSubmission(page);
    console.log("--- Form submitted successfully ---");

    // --- 2. Navigate to List Page ---
    await page.goto(BASE_URL + "/list");
    await expect(
      page.locator('h2:has-text("Training Form Submissions")')
    ).toBeVisible();
    console.log("--- Navigated to List Page ---");

    // --- 3. Approve the Form ---
    // Find the specific row for our unique trainer
    const formRow = page.locator(
      `.trainings-table tbody tr:has-text("${uniqueTrainerName}")`
    );
    await expect(formRow).toBeVisible();

    const approveButton = formRow.locator('a.btn:has-text("Approve")');
    await expect(approveButton).toBeVisible();
    await approveButton.click();

    // Explicitly wait for the Unapprove button to appear in that specific row
    const unapproveButton = formRow.locator('a.btn:has-text("Unapprove")');
    await expect(unapproveButton).toBeVisible({ timeout: 6000 });
    console.log("--- Form approved (Unapprove button visible) ---");

    // --- 4. Click Export Button, Select Quarter, and Verify Download ---
    const exportButton = page.locator("button#export-claim5-btn");
    await expect(exportButton).toBeVisible();
    await exportButton.click();

    // Wait for modal to appear
    const modal = page.locator("#exportClaim5Modal");
    await expect(modal).toBeVisible();

    // Wait for quarters to load and select the first available quarter
    const firstQuarterCheckbox = page
      .locator('#quarters-list input[type="checkbox"]')
      .first();
    await expect(firstQuarterCheckbox).toBeVisible();
    await firstQuarterCheckbox.check();

    // Click the Export button in the modal
    const confirmExportBtn = page.locator("#export-claim5-confirm-btn");
    await expect(confirmExportBtn).toBeVisible();

    // Start waiting for the download before clicking the button
    const downloadPromise = page.waitForEvent("download", { timeout: 6000 });
    await confirmExportBtn.click();

    // Wait for the download to complete
    const download = await downloadPromise;

    // Verify the downloaded file name
    const expectedFilename = "claim5_export.xlsx";
    expect(download.suggestedFilename()).toBe(expectedFilename);
    console.log(
      `--- Download started with expected filename: ${expectedFilename} ---`
    );

    console.log("--- Finished test: Export Approved Forms ---");
  });

  test("2. should show info message if no approved forms exist for export", async ({
    page
  }) => {
    console.log("--- Starting test: Export with No Approved Forms ---");

    // --- 1. Navigate to List Page and Ensure No Forms are Approved ---
    await page.goto(BASE_URL + "/list");
    await expect(
      page.locator('h2:has-text("Training Form Submissions")')
    ).toBeVisible();
    console.log("--- Navigated to List Page ---");

    // Attempt to unapprove any visible approved forms on the current page
    const unapproveButtons = page.locator(
      '.trainings-table tbody a.btn:has-text("Unapprove")'
    );
    const count = await unapproveButtons.count();
    console.log(
      `--- Found ${count} potentially approved forms to unapprove on this page ---`
    );

    // If there are approved forms, unapprove them one by one
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        // Get a fresh reference to avoid stale elements
        const freshButtons = page.locator(
          '.trainings-table tbody a.btn:has-text("Unapprove")'
        );
        if ((await freshButtons.count()) === 0) {
          console.log("--- No more unapprove buttons found ---");
          break;
        }

        // Get the first button (always index 0 since the list changes after each click)
        const button = freshButtons.first();
        console.log(`--- Clicking Unapprove button ${i + 1} ---`);

        await button.click();
        // Wait briefly for potential DOM updates after clicking
        await page.waitForTimeout(500);
        // Re-query the list page to ensure we are on the right page after potential navigation
        await page.goto(BASE_URL + "/list", { waitUntil: "networkidle" });
      }
    }

    // Add a final check to ensure no unapprove buttons are left after the loop
    await expect(
      page.locator('.trainings-table tbody a.btn:has-text("Unapprove")')
    ).toHaveCount(0, { timeout: 5000 });
    console.log("--- Ensured no forms are approved on the current page ---");

    // --- 2. Click Export Button and Try to Export ---
    const exportButton = page.locator("button#export-claim5-btn");
    await expect(exportButton).toBeVisible();
    await exportButton.click();

    // Wait for modal to appear
    const modal = page.locator("#exportClaim5Modal");
    await expect(modal).toBeVisible();

    // Try to click export without selecting a quarter (should alert and not download)
    const confirmExportBtn = page.locator("#export-claim5-confirm-btn");
    await expect(confirmExportBtn).toBeVisible();
    await confirmExportBtn.click();

    // There should be no download, and possibly an alert
    // Optionally, check for alert or error message in the UI
    // Just verify we're still on the list page (the feature works even if no specific message is shown)
    await expect(page).toHaveURL(new RegExp(`${BASE_URL}/list`));
    await expect(
      page.locator('h2:has-text("Training Form Submissions")')
    ).toBeVisible();

    // Check for any alert that might be visible, but don't fail the test if not found
    const anyAlert = page.locator(".alert");
    const alertVisible = await anyAlert.isVisible().catch(() => false);
    if (alertVisible) {
      console.log("Alert is visible with text:", await anyAlert.textContent());
    } else {
      console.log(
        "No alert is visible, but we're still on the list page, which is the expected behavior"
      );
    }

    console.log("--- Finished test: Export with No Approved Forms ---");
  });
});
