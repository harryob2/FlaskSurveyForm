const { test, expect } = require("@playwright/test");
const {
  BASE_URL,
  gotoHome,
  loginAsAdmin,
  addTrainee,
  setTrainerName,
  fillBasicInternalTrainingForm,
  submitForm,
  expectSuccessfulSubmission,
  expectSuccessfulUpdate
} = require("./utils/test-utils");

console.log("--- Loading edit_form.spec.js ---");

test.describe("Edit Form Functionality", () => {
  console.log("--- Defining edit form test suite ---");

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("should allow editing a submitted form and reflect changes", async ({
    page
  }) => {
    // --- 1. Submit a new form first ---
    await gotoHome(page);
    await fillBasicInternalTrainingForm(page, {
      trainerName: "Edit Tester",
      description: "Original description",
      includeTrainee: true
    });
    await submitForm(page);
    await expectSuccessfulSubmission(page);

    // --- 2. Go to list page and get the first form's edit link ---
    await page.goto(BASE_URL + "/list");
    const tableRow = page.locator("table tbody tr:first-child");
    await expect(tableRow).toBeVisible();
    const editLink = tableRow.locator('a[href*="/edit/"]');
    const editHref = await editLink.getAttribute("href");
    expect(editHref).toBeTruthy();

    // --- 3. Go to the edit page ---
    await page.goto(BASE_URL + editHref);

    // --- 4. Change the description and trainer name ---
    await page
      .locator('textarea[name="training_description"]')
      .fill("Edited description");
    await setTrainerName(page, "Edited Trainer");

    // --- 5. Submit the edited form ---
    await submitForm(page);

    // Wait for navigation to potentially complete and data to settle
    await page.waitForTimeout(500); // Small delay

    // --- 6. Verify success page/flash message (original check is fine)
    await expectSuccessfulUpdate(page);


    // --- 7. Go to view page and check the updated values ---
    // Get the view link from the same row (assume still first row)
    await page.goto(BASE_URL + "/list");
    // Re-find the row to ensure it's fresh
    const updatedTableRow = page.locator('table tbody tr:has-text("Edited Trainer")').first();
    await expect(updatedTableRow).toBeVisible();
    const viewLink = updatedTableRow.locator('a[href*="/view/"]');
    const viewHref = await viewLink.getAttribute("href");
    expect(viewHref).toBeTruthy();
    await page.goto(BASE_URL + viewHref);

    // Check for updated description and trainer name within a likely container
    // Use a selector for a main content area if possible, e.g., '#main-content' or 'div.card-body'
    // Using 'body' as a fallback, but a more specific container is preferred.
    const viewPageContent = page.locator('body'); // Adjust if a better container exists
    await expect(viewPageContent).toContainText("Edited description");
    await expect(viewPageContent).toContainText("Edited Trainer");
  });
});
