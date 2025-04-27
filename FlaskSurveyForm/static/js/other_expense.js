/**
 * Other Expense Description Script
 *
 * This script handles the dynamic display of the Other Expense Description field
 * based on whether the Other Expenses field has a value greater than zero.
 */

document.addEventListener("DOMContentLoaded", function () {
  // Get the Other Expenses field
  const otherCostField = document.getElementById("other_cost");

  // Get the Other Expense Description container
  const descriptionContainer = document.getElementById(
    "other-expense-description-container",
  );

  // Get the Other Expense Description field (might not be needed anymore, but keep reference just in case)
  // const descriptionField = document.getElementById("other_expense_description");

  // Get the form element (might not be needed anymore)
  // const form = document.getElementById("training-form");

  // Function to parse currency formatted values
  function parseCurrency(val) {
    // Remove all non-numeric except dot and minus
    if (!val) return 0;
    return parseFloat(val.replace(/[^0-9.-]+/g, ""));
  }

  // Function to check if Other Expenses field has a value and toggle visibility
  function checkOtherExpenses() {
    if (otherCostField && descriptionContainer) {
      const hasOtherExpenses =
        otherCostField.value && parseCurrency(otherCostField.value) > 0;

      if (hasOtherExpenses) {
        // Show the description field container
        descriptionContainer.classList.remove("d-none");
      } else {
        // Hide the description field container
        descriptionContainer.classList.add("d-none");
      }
    }
  }

  // Add event listeners to the Other Expenses field to check visibility
  if (otherCostField) {
    otherCostField.addEventListener("input", checkOtherExpenses);
    otherCostField.addEventListener("change", checkOtherExpenses);
  }

  // Initial check when the page loads
  checkOtherExpenses();
});
