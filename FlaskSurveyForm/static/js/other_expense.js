/**
 * Other Expense Description Script
 *
 * This script handles the dynamic display of the Other Expense Description field
 * based on whether the Other Expenses field has a value greater than zero.
 */

document.addEventListener("DOMContentLoaded", function () {
  // Get the Other Expenses field
  const otherCostField = document.getElementById("other_cost");
  const form = document.getElementById("training-form"); // Need form reference

  // Get the Other Expense Description container
  const descriptionContainer = document.getElementById(
    "other-expense-description-container",
  );

  // --- Add Concur Logic Elements ---
  const travelCostInput = form?.elements["travel_cost"];
  const foodCostInput = form?.elements["food_cost"];
  const materialsCostInput = form?.elements["materials_cost"];
  // otherCostField is already defined
  const concurRequiredMessageDiv = document.getElementById("concur-required-message");

  // Combine inputs, filtering out any that might not exist
  const expenseInputs = [
      travelCostInput,
      foodCostInput,
      materialsCostInput,
      otherCostField, // Use the existing variable
  ].filter(input => input);

  // --- End Concur Logic Elements ---

  // Function to parse currency formatted values (can be defined here or rely on global form_helpers.js)
  // Let's define it here for encapsulation, assuming form_helpers might not always be loaded
  function parseLocalCurrency(val) {
    if (!val) return 0;
    return parseFloat(val.replace(/[^0-9.-]+/g, ""));
  }

  // Function to check if Other Expenses field has a value and toggle visibility
  function checkOtherExpensesVisibility() {
    if (otherCostField && descriptionContainer) {
      const hasOtherExpenses =
        otherCostField.value && parseLocalCurrency(otherCostField.value) > 0;

      descriptionContainer.classList.toggle("d-none", !hasOtherExpenses);
    }
  }

  // --- Add Concur Logic Function ---
  function updateConcurMessageVisibility() {
      let hasAnyExpense = false;
      expenseInputs.forEach((input) => {
          const value = parseLocalCurrency(input.value);
          if (!isNaN(value) && value > 0) {
              hasAnyExpense = true;
          }
      });

      if (concurRequiredMessageDiv) { // Check if element exists
          concurRequiredMessageDiv.classList.toggle("d-none", !hasAnyExpense);
      }
  }
  // --- End Concur Logic Function ---

  // Add event listeners to the Other Expenses field to check visibility
  if (otherCostField) {
    otherCostField.addEventListener("input", checkOtherExpensesVisibility);
    otherCostField.addEventListener("change", checkOtherExpensesVisibility);
  }

  // --- Add Concur Logic Listeners ---
  expenseInputs.forEach((input) => {
      input.addEventListener("input", updateConcurMessageVisibility);
  });
  // --- End Concur Logic Listeners ---

  // Initial check when the page loads
  checkOtherExpensesVisibility();
  updateConcurMessageVisibility(); // Also run Concur check on load

  // Make the checkOtherExpenses function globally available if needed by inline script (legacy)
  // window.checkOtherExpenses = checkOtherExpensesVisibility; // We removed the call from inline script

  console.log("Other Expense and Concur Message Logic Initialized.");
});
