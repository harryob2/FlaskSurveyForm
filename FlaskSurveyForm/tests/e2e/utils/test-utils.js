const { expect } = require("@playwright/test");

// Base URL for the application - define once and export
const BASE_URL = "http://127.0.0.1:5000";

// Admin user credentials - used for all tests
const ADMIN_EMAIL = "harry@test.com";
const ADMIN_PASSWORD = "cork4liam";

/**
 * Common utilities for e2e tests to reduce code duplication and
 * standardize test patterns
 */

/**
 * Login as the admin user
 * @param {import('@playwright/test').Page} page - Playwright page
 */
async function loginAsAdmin(page) {
  console.log("--- Logging in as admin user ---");

  // Navigate to home (will redirect to login)
  await page.goto(BASE_URL + "/new");

  // Check if already logged in
  const currentUrl = page.url();
  if (!currentUrl.includes("/login")) {
    console.log("--- Already logged in, skipping login ---");
    return;
  }

  // Fill login form
  await page.locator('input[name="username"]').fill(ADMIN_EMAIL);
  await page.locator('input[name="password"]').fill(ADMIN_PASSWORD);

  // Submit login form
  await page.locator('input[type="submit"]').click();

  // Wait for redirect after login
  await page.waitForURL("**/");

  // Verify we are logged in by checking we're not on the login page anymore
  await expect(page).not.toHaveURL(/.*\/login/);

  console.log("--- Successfully logged in as admin ---");
}

/**
 * Go to the application's home page and ensure we're logged in
 * @param {import('@playwright/test').Page} page - Playwright page
 */
async function gotoHome(page) {
  await page.goto(BASE_URL + "/new");

  // Check if we need to login
  if (page.url().includes("/login")) {
    await loginAsAdmin(page);
  }
}

/**
 * Add a trainee to the form by searching and selecting the first match
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {string} searchTerm - Search term for trainee (default 'gre')
 * @param {Object} options - Optional parameters
 */
async function addTrainee(page, searchTerm = "gre", options = {}) {
  const defaults = {
    timeout: 10000, // 10 second timeout by default
    retries: 2 // Number of retries if search fails
  };

  const settings = { ...defaults, ...options };

  // Fill the search input
  await page.locator("input#trainee-search-input").fill(searchTerm);

  // Try to find and click the first search result with retry logic
  let attempt = 0;

  while (attempt <= settings.retries) {
    try {
      // Wait for suggestions to appear and click the first one
      await page
        .locator("div#trainee-search-results div.autocomplete-item:first-child")
        .waitFor({ state: "visible", timeout: settings.timeout });

      await page
        .locator("div#trainee-search-results div.autocomplete-item:first-child")
        .click();

      // Success! Return early
      return;
    } catch (error) {
      attempt++;
      console.log(
        `Attempt ${attempt} failed for trainee search '${searchTerm}'. ${settings.retries - attempt + 1} retries left.`
      );

      if (attempt > settings.retries) {
        throw error; // All retries failed, rethrow the error
      }

      // Clear and refill the search input for next attempt
      await page.locator("input#trainee-search-input").fill("");
      await page.waitForTimeout(500); // Small delay before trying again
      await page.locator("input#trainee-search-input").fill(searchTerm);
    }
  }
}

/**
 * Set a trainer name in both visible search field and hidden field
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {string} trainerName - Name of the trainer to set
 */
async function setTrainerName(page, trainerName) {
  await page.locator("input#trainer_name_search").fill(trainerName);

  // Also set the hidden field that stores the actual value
  await page.evaluate((name) => {
    const hiddenInput = document.getElementById("trainer_name_hidden");
    if (hiddenInput) {
      hiddenInput.value = name;
    }
  }, trainerName);
}

/**
 * Fill the basic required fields for an internal training submission
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {Object} options - Optional parameters to customize the form
 */
async function fillBasicInternalTrainingForm(page, options = {}) {
  const defaults = {
    trainerName: "Test Trainer",
    trainerHours: "1",
    traineeHours: "1",
    startDate: "2024-01-01",
    endDate: "2024-01-01",
    description: "Test training description",
    includeTrainer: true,
    includeTrainee: true,
    addExpenses: false,
    locationType: "Onsite", // Allow setting location type
    locationDetails: null, // Optional location details for Offsite
    skipBaseSetup: false // Allow skipping basic setup
  };

  const settings = { ...defaults, ...options };

  // Select training type and location
  await page
    .locator(".training-type-card")
    .filter({ hasText: "Internal Training" })
    .click();

  // Set location if not skipping basic setup
  if (!settings.skipBaseSetup) {
    await page
      .locator("label")
      .filter({ hasText: settings.locationType })
      .click();

    // Fill location details if Offsite
    if (settings.locationType === "Offsite") {
      await expect(page.locator("#location-details-container")).toBeVisible();
      if (settings.locationDetails) {
        await page
          .locator('input[name="location_details"]')
          .fill(settings.locationDetails);
      }
    }
  }

  // Set dates
  await page.locator('input[name="start_date"]').fill(settings.startDate);
  await page.locator('input[name="end_date"]').fill(settings.endDate);

  // Set trainer info if included
  if (settings.includeTrainer) {
    await setTrainerName(page, settings.trainerName);
    await page
      .locator('input[name="trainer_hours"]')
      .fill(settings.trainerHours);
  }

  // Set trainee hours
  if (settings.traineeHours) {
    await page
      .locator('input[name="trainee_hours"]')
      .fill(settings.traineeHours);
  }

  // Set description
  await page
    .locator('textarea[name="training_description"]')
    .fill(settings.description);

  // Add trainee if included
  if (settings.includeTrainee) {
    await addTrainee(page);
  }

  // Add expenses if needed
  if (settings.addExpenses) {
    await addExpenses(page, settings.expenseOptions);
  }
}

/**
 * Fill an external training form with basic required fields
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {Object} options - Optional parameters to customize the form
 */
async function fillBasicExternalTrainingForm(page, options = {}) {
  const defaults = {
    supplierName: "External Test Supplier",
    traineeHours: "1",
    startDate: "2024-07-01",
    endDate: "2024-07-01",
    description: "External training description",
    includeTrainee: true
  };

  const settings = { ...defaults, ...options };

  // Select external training type
  await page
    .locator(".training-type-card")
    .filter({ hasText: "External Training" })
    .click();
  await expect(page.locator("#external-supplier-container")).toBeVisible();

  // Set supplier
  await page.locator('input[name="supplier_name"]').fill(settings.supplierName);

  // Set location (default: Onsite)
  await page.locator("label").filter({ hasText: "Onsite" }).click();

  // Set dates
  await page.locator('input[name="start_date"]').fill(settings.startDate);
  await page.locator('input[name="end_date"]').fill(settings.endDate);

  // Set trainee Hours
  if (settings.traineeHours) {
    await page
      .locator('input[name="trainee_hours"]')
      .fill(settings.traineeHours);
  }

  // Set description
  await page
    .locator('textarea[name="training_description"]')
    .fill(settings.description);

  // Add trainee if included
  if (settings.includeTrainee) {
    await addTrainee(page);
  }
}

/**
 * Add expenses to the form
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {Object} options - Optional expense values and settings
 */
async function addExpenses(page, options = {}) {
  const defaults = {
    travelCost: "5",
    foodCost: "5",
    materialsCost: "5",
    otherCost: "5",
    otherDescription: "Test expenses",
    concurClaim: "ABC123"
  };

  const settings = { ...defaults, ...options };

  // Add expense values
  if (settings.travelCost) {
    await page.locator('input[name="travel_cost"]').fill(settings.travelCost);
  }

  if (settings.foodCost) {
    await page.locator('input[name="food_cost"]').fill(settings.foodCost);
  }

  if (settings.materialsCost) {
    await page
      .locator('input[name="materials_cost"]')
      .fill(settings.materialsCost);
  }

  if (settings.otherCost) {
    await page.locator('input[name="other_cost"]').fill(settings.otherCost);

    // Try to set the description, but don't fail if the element isn't visible
    if (settings.otherDescription) {
      try {
        // Try to click a button or make other_expense_description visible if needed
        const descField = page.locator(
          'textarea[name="other_expense_description"]'
        );
        const isVisible = await descField.isVisible().catch(() => false);

        // Only attempt to fill if it's visible
        if (isVisible) {
          await descField.fill(settings.otherDescription);
        } else {
          console.log("Other expense description field not visible, skipping");
        }
      } catch (e) {
        console.log("Could not set other expense description:", e.message);
      }
    }
  }

  // Add concur claim if any expenses are added and a claim number is provided
  const hasExpenses =
    settings.travelCost ||
    settings.foodCost ||
    settings.materialsCost ||
    settings.otherCost;

  if (hasExpenses && settings.concurClaim) {
    // No need to wait for the message, just fill the field
    await page.locator('input[name="concur_claim"]').fill(settings.concurClaim);
  }
}

/**
 * Submit the form
 * @param {import('@playwright/test').Page} page - Playwright page
 */
async function submitForm(page) {
  await page.locator("#submit-training-form-btn").click();
}

/**
 * Verify the form submission was successful
 * @param {import('@playwright/test').Page} page - Playwright page
 */
async function expectSuccessfulSubmission(page) {
  await page.waitForURL("**/success");
  await expect(page).toHaveURL(BASE_URL + "/success");
}

/**
 * Verify the form update was successful
 * @param {import('@playwright/test').Page} page - Playwright page
 */
async function expectSuccessfulUpdate(page) {
  // Wait for the success flash message to appear
  const successFlash = page.locator(".alert-success");
  await expect(successFlash).toBeVisible();

  // Verify the success message contains the expected text
  const successMessage = await successFlash.textContent();
  expect(successMessage).toContain("updated successfully");
}
/**
 * Verify a validation error for the specified field
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {string} selector - Selector for the field with error
 * @param {string} expectedMessage - Expected validation message
 */
async function expectValidationError(page, selector, expectedMessage) {
  // First, verify we're still on the form page (not redirected to success)
  await expect(page).not.toHaveURL(BASE_URL + "/success");

  // Check the validation message
  const element = page.locator(selector);
  const validationMessage = await element.evaluate(
    (el) => el.validationMessage
  );
  expect(validationMessage).toContain(expectedMessage);
}

module.exports = {
  BASE_URL,
  loginAsAdmin,
  gotoHome,
  addTrainee,
  setTrainerName,
  fillBasicInternalTrainingForm,
  fillBasicExternalTrainingForm,
  addExpenses,
  submitForm,
  expectSuccessfulSubmission,
  expectValidationError,
  expectSuccessfulUpdate
};
