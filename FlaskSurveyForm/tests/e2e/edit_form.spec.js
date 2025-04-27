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

    // --- 6. Verify success page ---
    await expectSuccessfulUpdate(page);
      

    // --- 7. Go to view page and check the updated values ---
    // Get the view link from the same row (assume still first row)
    await page.goto(BASE_URL + "/list");
    const viewLink = tableRow.locator('a[href*="/view/"]');
    const viewHref = await viewLink.getAttribute("href");
    expect(viewHref).toBeTruthy();
    await page.goto(BASE_URL + viewHref);

    // Check for updated description and trainer name
    await expect(page.locator("body")).toContainText("Edited description");
    await expect(page.locator("body")).toContainText("Edited Trainer");
  });
});
