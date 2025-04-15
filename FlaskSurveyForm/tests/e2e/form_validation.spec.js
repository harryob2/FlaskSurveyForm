const { test, expect } = require('@playwright/test');
const {
  BASE_URL,
  gotoHome,
  addTrainee,
  setTrainerName,
  fillBasicInternalTrainingForm,
  fillBasicExternalTrainingForm,
  submitForm,
  expectSuccessfulSubmission,
  expectValidationError
} = require('./utils/test-utils');

console.log("--- Loading form_validation.spec.js ---");

test.describe('Form Validation Errors', () => {
  console.log("--- Defining validation test suite ---");

  // Test 1: Trainer Name validation
  test('1. should show error if Trainer Name is empty for Internal Training', async ({ page }) => {
    console.log("--- Starting test: Missing Trainer Name ---");
    
    // Setup: Fill form without trainer name
    await gotoHome(page);
    await fillBasicInternalTrainingForm(page, {
      includeTrainer: false,  // Skip trainer name
      includeTrainee: true    // Include trainee
    });
    
    // Action: Submit the form
    await submitForm(page);
    
    // Assertion: Check validation message
    await expectValidationError(
      page, 
      'input#trainer_name_search', 
      'Trainer name is required for internal training.'
    );
    
    console.log("--- Finished test: Missing Trainer Name ---");
  });

  // Test 2: Trainee Days validation
  test('2. should show error if Trainee Days is empty', async ({ page }) => {
    console.log("--- Starting test: Missing Trainee Days ---");
    
    // Setup: Fill form without trainee days
    await gotoHome(page);
    await fillBasicInternalTrainingForm(page, {
      traineeDays: null  // Skip trainee days
    });
    
    // Action: Submit the form
    await submitForm(page);
    
    // Assertion: Check for validation message element
    const traineeDaysInput = page.locator('input[name="trainee_days"]');
    const traineeDaysContainer = traineeDaysInput.locator('xpath=ancestor::div[contains(@class, "mb-3")]');
    const errorMessage = traineeDaysContainer.locator('.validation-message').first(); 
    await expect(errorMessage).toBeVisible();
    
    console.log("--- Finished test: Missing Trainee Days ---");
  });

  // Test 3: Concur Claim validation
  test('3. should show error if Expenses are entered but Concur Claim is empty', async ({ page }) => {
    console.log("--- Starting test: Missing Concur Claim with Expenses ---");
    
    // Setup: Fill form with expenses but no concur claim
    await gotoHome(page);
    await fillBasicInternalTrainingForm(page, {
      addExpenses: true,
      expenseOptions: {
        travelCost: '10',
        concurClaim: null // Omit concur claim
      }
    });
    
    // Action: Submit the form
    await submitForm(page);
    
    // Assertions
    await expect(page).toHaveURL(BASE_URL + '/');
    await expectValidationError(
      page, 
      'input[name="concur_claim"]', 
      'Concur Claim Number is required when expenses are entered.'
    );
    
    // Check the specific helper message is visible
    const concurRequiredDiv = page.locator('#concur-required-message');
    await expect(concurRequiredDiv).toBeVisible();
    await expect(concurRequiredDiv).not.toHaveClass(/d-none/);
    
    console.log("--- Finished test: Missing Concur Claim with Expenses ---");
  });

  // Test 4: Other Expense Description validation
  test('4. should show error if Other Cost is entered but description is empty', async ({ page }) => {
    console.log("--- Starting test: Missing Other Expense Description ---");
    
    // Setup: Fill form with other cost but no description
    await gotoHome(page);
    await fillBasicInternalTrainingForm(page, {
      addExpenses: true,
      expenseOptions: {
        otherCost: '15',
        otherDescription: null, // Omit description
        // Include concur to avoid concur validation error
        concurClaim: 'CLAIM123'
      }
    });
    
    // Action: Submit the form
    await submitForm(page);
    
    // Assertions
    await expect(page).toHaveURL(BASE_URL + '/');
    await expectValidationError(
      page, 
      'textarea[name="other_expense_description"]', 
      'Description is required when other expenses are entered.'
    );
    
    // Check the specific helper message text is visible
    const descriptionContainer = page.locator('#other-expense-description-container');
    const requiredText = descriptionContainer.locator('.other-expense-required-text');
    await expect(requiredText).toBeVisible();
    
    console.log("--- Finished test: Missing Other Expense Description ---");
  });

  // Test 5: End Date validation
  test('5. should show error if End Date is earlier than Start Date', async ({ page }) => {
    console.log("--- Starting test: End Date < Start Date ---");
    
    // Setup: Fill form with end date earlier than start date
    await gotoHome(page);
    await fillBasicInternalTrainingForm(page, {
      startDate: '2024-02-15',
      endDate: '2024-02-10'  // Earlier than start date
    });
    
    // Action: Submit the form
    await submitForm(page);
    
    // Assertions
    await expect(page).toHaveURL(BASE_URL + '/');
    await expectValidationError(
      page, 
      'input[name="end_date"]', 
      'End date cannot be earlier than start date'
    );
    
    console.log("--- Finished test: End Date < Start Date ---");
  });

  // Test 6: Location Details validation
  test('6. should show error if Location is Offsite but Location Details are empty', async ({ page }) => {
    console.log("--- Starting test: Offsite without Details ---");
    
    // Setup: Fill form with offsite location but no details
    await gotoHome(page);
    
    // Use internal training with offsite location, but manually control the location setting
    await fillBasicInternalTrainingForm(page, {
      skipBaseSetup: true // Skip default location setup
    });
    
    // Manually set location to Offsite to better control the test flow
    await page.locator('label').filter({ hasText: 'Offsite' }).click();
    await expect(page.locator('#location-details-container')).toBeVisible();
    // Deliberately don't fill in location details
    
    // Action: Submit the form
    await submitForm(page);
    
    // Assertions
    await expect(page).not.toHaveURL(BASE_URL + '/success');
    
    // Check that we're still on a form page by looking for required elements
    await expect(page.locator('#training-form')).toBeVisible();
    
    // Check for error in the page content relating to location details
    await expect(page.locator('body')).toContainText('required');
    
    console.log("--- Finished test: Offsite without Details ---");
  });

  // Test 7: External Training validation (positive test)
  test('7. should allow submitting External Training without entering Trainer Days', async ({ page }) => {
    console.log("--- Starting test: External Training No Trainer Days Error ---");
    
    // Setup: Fill external training form without trainer days
    await gotoHome(page);
    await fillBasicExternalTrainingForm(page);
    
    // Action: Submit the form
    await submitForm(page);
    
    // Assertion: Verify form submitted successfully
    await expectSuccessfulSubmission(page);
    
    console.log("--- Finished test: External Training No Trainer Days Error ---");
  });

  // Test 8: Trainee validation
  test('8. should show error if no trainees are added', async ({ page }) => {
    console.log("--- Starting test: No Trainees Added ---");
    
    // Setup: Fill form without adding a trainee
    await gotoHome(page);
    await fillBasicInternalTrainingForm(page, {
      includeTrainee: false  // Skip adding trainee
    });
    
    // Action: Submit the form
    await submitForm(page);
    
    // Assertions
    await expect(page).not.toHaveURL(BASE_URL + '/success');
    
    // Check for the validation error message in the page body
    await expect(page.locator('body')).toContainText('At least one trainee must be added.');
    
    console.log("--- Finished test: No Trainees Added ---");
  });

});