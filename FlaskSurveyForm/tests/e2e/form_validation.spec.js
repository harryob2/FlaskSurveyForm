const { test, expect } = require('@playwright/test');

console.log("--- Loading form_validation.spec.js ---");

// Base URL for the application
const baseURL = 'http://127.0.0.1:5000';

test.describe('Form Validation Errors', () => {
  console.log("--- Defining validation test suite ---");

  // Helper function to fill minimally required fields for internal training
  async function fillMinimumInternalFields(page) {
    await page.locator('label').filter({ hasText: 'Internal Training' }).click();
    await page.locator('label').filter({ hasText: 'Onsite' }).click();
    // Assuming basic dates are needed for validation check
    await page.locator('input[name="start_date"]').fill('2024-01-01');
    await page.locator('input[name="end_date"]').fill('2024-01-01');
    // Add trainer_days as it might be required before trainer_name validation
    await page.locator('input[name="trainer_days"]').fill('1'); 
    // Add other fields if they become required by validation logic before the target field
  }

  test('should show error if Trainer Name is empty for Internal Training', async ({ page }) => {
    console.log("--- Starting test: Missing Trainer Name ---");
    await page.goto(baseURL + '/');

    // Setup: Select internal training and fill minimal fields + trainee_days
    await fillMinimumInternalFields(page); 
    // Add trainee_days back - it seems required before trainer name validation runs
    await page.locator('input[name="trainee_days"]').fill('1'); 

    // Action: Leave trainer name empty and click submit
    await page.locator('#submit-training-form-btn').click();

    // Assertion: Check the validationMessage property of the input element
    const trainerSearchInput = page.locator('input#trainer_name_search');
    const validationMessage = await trainerSearchInput.evaluate(element => element.validationMessage);
    
    // Check if the validation message contains the expected text
    expect(validationMessage).toContain('Trainer name is required for internal training.');

     console.log("--- Finished test: Missing Trainer Name ---");
  });

  test('should show error if Trainee Days is empty', async ({ page }) => {
    console.log("--- Starting test: Missing Trainee Days ---");
    await page.goto(baseURL + '/');

    // Setup: Select internal training, fill trainer name and other necessary fields
    await fillMinimumInternalFields(page);
    // Fill trainer name for this test
    await page.locator('input#trainer_name_search').fill('Test Trainer'); 
    // Set hidden field value using JavaScript since it's not visible
    await page.evaluate(() => {
        const hiddenInput = document.getElementById('trainer_name_hidden');
        if (hiddenInput) {
            hiddenInput.value = 'Test Trainer';
            // Optionally dispatch an event if validation depends on it, though likely not needed here
            // hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
    });

    // Action: Leave trainee days empty and click submit
    // Trainee days input: 'input[name="trainee_days"]' is empty by default
    await page.locator('#submit-training-form-btn').click();

    // Assertion: Check for *a* validation message near the trainee days input
    const traineeDaysInput = page.locator('input[name="trainee_days"]');
    const traineeDaysContainer = traineeDaysInput.locator('xpath=ancestor::div[contains(@class, "mb-3")]');
    // Target the first validation message found to avoid strict mode violation
    const errorMessage = traineeDaysContainer.locator('.validation-message').first(); 

    await expect(errorMessage).toBeVisible();
    // Optional: Can check text if needed, but visibility might be enough
    // await expect(errorMessage).toContainText('Please fill in this field'); 

    console.log("--- Finished test: Missing Trainee Days ---");
  });

  test('should show error if Expenses are entered but Concur Claim is empty', async ({ page }) => {
    console.log("--- Starting test: Missing Concur Claim with Expenses ---");
    await page.goto(baseURL + '/');

    // Setup: Fill minimum fields + trainer name + trainee days + an expense
    await fillMinimumInternalFields(page);
    await page.locator('input[name="trainee_days"]').fill('1');
    await page.locator('input#trainer_name_search').fill('Test Trainer');
    await page.evaluate(() => {
        const hiddenInput = document.getElementById('trainer_name_hidden');
        if (hiddenInput) { hiddenInput.value = 'Test Trainer'; }
    });
    await page.locator('input[name="travel_cost"]').fill('10'); // Add an expense

    // Action: Leave concur claim empty and click submit
    // concur_claim input is empty by default
    await page.locator('#submit-training-form-btn').click();

    // Assertion 1: Check the page URL hasn't changed (form shouldn't submit)
    await expect(page).toHaveURL(baseURL + '/');

    // Assertion 2: Check the validationMessage property of the input
    const concurInput = page.locator('input[name="concur_claim"]');
    const validationMessage = await concurInput.evaluate(element => element.validationMessage);
    expect(validationMessage).toContain('Concur Claim Number is required when expenses are entered.');

    // Assertion 3: Check the specific helper message div is visible
    const concurRequiredDiv = page.locator('#concur-required-message');
    await expect(concurRequiredDiv).toBeVisible(); // Checks if it doesn't have display:none
    await expect(concurRequiredDiv).not.toHaveClass(/d-none/); // Explicitly check class removal

    console.log("--- Finished test: Missing Concur Claim with Expenses ---");
  });

  test('should show error if Other Cost is entered but description is empty', async ({ page }) => {
    console.log("--- Starting test: Missing Other Expense Description ---");
    await page.goto(baseURL + '/');

    // Setup: Fill required fields + trainer name + an 'other' expense
    await fillMinimumInternalFields(page);
    await page.locator('input[name="trainee_days"]').fill('1');
    await page.locator('input#trainer_name_search').fill('Test Trainer');
    await page.evaluate(() => {
        const hiddenInput = document.getElementById('trainer_name_hidden');
        if (hiddenInput) { hiddenInput.value = 'Test Trainer'; }
    });
    await page.locator('input[name="other_cost"]').fill('15'); // Add an 'other' expense

    // Wait for the description container to become visible (JS should trigger this)
    const descriptionContainer = page.locator('#other-expense-description-container');
    await expect(descriptionContainer).toBeVisible();

    // Action: Leave description empty and click submit
    // other_expense_description textarea is empty by default
    await page.locator('#submit-training-form-btn').click();

    // Assertion 1: Check the page URL hasn't changed
    await expect(page).toHaveURL(baseURL + '/');

    // Assertion 2: Check the validationMessage property of the textarea
    const descriptionTextarea = page.locator('textarea[name="other_expense_description"]');
    const validationMessage = await descriptionTextarea.evaluate(element => element.validationMessage);
    expect(validationMessage).toContain('Description is required when other expenses are entered.');

    // Assertion 3: Check the specific helper message text is visible
    const requiredText = descriptionContainer.locator('.other-expense-required-text');
    await expect(requiredText).toBeVisible(); 

    console.log("--- Finished test: Missing Other Expense Description ---");
  });

  // --- NEW TESTS ---

  test('should show error if End Date is earlier than Start Date', async ({ page }) => {
    console.log("--- Starting test: End Date < Start Date ---");
    await page.goto(baseURL + '/');

    // Setup: Fill most fields, but set end date before start date
    // Use a helper that fills almost everything, ensuring description etc. are present
    await fillMinimumInternalFields(page); // Use helper defined earlier in the file
    await page.locator('input[name="start_date"]').fill('2024-02-15');
    await page.locator('input[name="end_date"]').fill('2024-02-10'); // End date is earlier

    // Action: Click submit
    await page.locator('#submit-training-form-btn').click();

    // Assertion 1: Check URL hasn't changed
    await expect(page).toHaveURL(baseURL + '/');

    // Assertion 2: Check validation message on end_date input
    const endDateInput = page.locator('input[name="end_date"]');
    const validationMessage = await endDateInput.evaluate(element => element.validationMessage);
    // Check against the specific message from forms.py validator
    expect(validationMessage).toContain('End date cannot be earlier than start date');

    console.log("--- Finished test: End Date < Start Date ---");
  });

  test('should show error if Location is Offsite but Location Details are empty', async ({ page }) => {
    console.log("--- Starting test: Offsite without Details ---");
    await page.goto(baseURL + '/');

     // Setup: Fill most fields, select Offsite, leave details empty
    await fillMinimumInternalFields(page); // Use helper (defaults to Onsite initially)
    await page.locator('label').filter({ hasText: 'Offsite' }).click(); // Change to Offsite
    await expect(page.locator('#location-details-container')).toBeVisible(); // Wait for details field to show

    // Action: Click submit
    await page.locator('#submit-training-form-btn').click();

    // Assertion 1: Check URL hasn't changed
    await expect(page).toHaveURL(baseURL + '/');

    // Assertion 2: Check for the dynamically added validation message div
    const locationDetailsInput = page.locator('input[name="location_details"]');
    const locationDetailsContainer = locationDetailsInput.locator('xpath=ancestor::div[contains(@class, "mb-3")]');
    const errorMessage = locationDetailsContainer.locator('.validation-message').first(); // Target first to be safe

    await expect(errorMessage).toBeVisible();
    // Optionally, check the text if needed, but visibility confirms an error was shown
    // await expect(errorMessage).toContainText('required'); 

    console.log("--- Finished test: Offsite without Details ---");
  });

}); 