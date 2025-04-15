// Import necessary modules from Playwright
console.log("--- Loading survey_form.spec.js ---");
const { test, expect } = require('@playwright/test');

// Define the test suite
test.describe('Survey Form Submission', () => {
  console.log("--- Defining test suite ---");

  // Define the specific test case
  test('should fill and submit the form successfully for internal training', async ({ page }) => {
    console.log("--- Starting test: should fill and submit... ---");
    // Base URL for the application (Consider moving this to playwright.config.js)
    const baseURL = 'http://127.0.0.1:5000';

    // 1. Navigate to the homepage
    await page.goto(baseURL + '/');

    // --- Fill Form ---

    // 2. Select Training Type: 'Internal Training'
    // Find the label containing 'Internal Training' and click it to select the corresponding radio button
    await page.locator('label').filter({ hasText: 'Internal Training' }).click();

    // Wait for conditional fields related to internal training to become visible
    await expect(page.locator('#internal-trainer-container')).toBeVisible();

    // 3. Enter Trainer Name: 'rosale' and select the first option
    await page.locator('input#trainer_name_search').fill('rosale');
    // Wait for suggestions to appear and click the first one
    await page.locator('div#trainer-search-results div.autocomplete-item:first-child').waitFor({ state: 'visible' });
    await page.locator('div#trainer-search-results div.autocomplete-item:first-child').click();

    // 4. Select Location: 'Onsite'
    await page.locator('label').filter({ hasText: 'Onsite' }).click();

    // 5. Enter Trainer Days: '7'
    await page.locator('input[name="trainer_days"]').fill('7');

    // 6. Enter Trainee Days: '4.3'
    await page.locator('input[name="trainee_days"]').fill('4.3');

    // 7. Enter Training Description: 'test test 777'
    await page.locator('textarea[name="training_description"]').fill('test test 777');

    // 8. Enter Expenses: '5' for each
    await page.locator('input[name="travel_cost"]').fill('5');
    await page.locator('input[name="food_cost"]').fill('5');
    // Note: Using materials_cost based on HTML, assuming it corresponds to user's 'accommodation' expense
    await page.locator('input[name="materials_cost"]').fill('5');
    await page.locator('input[name="other_cost"]').fill('5');

    // 9. Enter Other Expense Description: 'test other expense'
    // The description field only becomes visible/required if other_cost > 0, wait for it
    await expect(page.locator('#other-expense-description-container')).toBeVisible();
    await page.locator('textarea[name="other_expense_description"]').fill('test other expense');

    // 10. Enter Concur Claim Number: 'abc2222'
    // The concur field becomes required if any cost > 0, wait for the message indicating requirement potentially
    await expect(page.locator('#concur-required-message')).not.toHaveClass(/d-none/); // Check it's visible
    await page.locator('input[name="concur_claim"]').fill('abc2222');

    // 11. Add Trainee: Enter 'gre' and select the first option
    await page.locator('input#trainee-search-input').fill('gre');
    // Wait for suggestions to appear and click the first one
    await page.locator('div#trainee-search-results div.autocomplete-item:first-child').waitFor({ state: 'visible' });
    await page.locator('div#trainee-search-results div.autocomplete-item:first-child').click();
    // Ensure the trainee was added (e.g., check if a trainee row appeared in a table - selector needed)
    // For now, we assume clicking the suggestion adds the trainee. A more robust check might be needed.

    // --- Submit ---

    // 12. Click 'Submit Form'
    // The button is type="button" and triggers JS validation/submission
    const submitButton = page.locator('#submit-training-form-btn');
    await submitButton.click();

    // --- Assert ---

    // 13. Verify navigation to the success page
    // Wait for navigation to complete and check the URL
    await page.waitForURL('**/success');
    await expect(page).toHaveURL(baseURL + '/success');
  });

});
