/**
 * Expense Validation Script
 *
 * This script handles the dynamic validation of the Concur Claim Number field
 * based on whether any expense fields have values.
 */

document.addEventListener("DOMContentLoaded", function () {
  // Get all expense input fields
  const expenseFields = [
    document.getElementById("travel_cost"),
    document.getElementById("food_cost"),
    document.getElementById("materials_cost"),
    document.getElementById("other_cost")
  ];

  // Get the Concur Claim Number field
  const concurClaimField = document.getElementById("concur_claim");

  // Get the form element
  const form = document.getElementById("training-form");

  // Function to check if any expense fields have values
  function checkExpenses() {
    let hasExpenses = false;

    expenseFields.forEach((field) => {
      if (field && field.value && parseFloat(field.value) > 0) {
        hasExpenses = true;
      }
    });

    // Update the Concur Claim field based on whether there are expenses
    if (concurClaimField) {
      if (hasExpenses) {
        // Add required attribute and visual indicator
        concurClaimField.setAttribute("required", "required");

        // Only add the red styling if the field is empty
        if (!concurClaimField.value || concurClaimField.value.trim() === "") {
          concurClaimField.classList.add("is-required");

          // Add a visual indicator if it doesn't exist
          let indicator = document.querySelector(".concur-required-indicator");
          if (!indicator) {
            indicator = document.createElement("small");
            indicator.className = "concur-required-indicator text-danger";
            indicator.textContent = " * Required when expenses are entered";
            concurClaimField.parentNode.appendChild(indicator);
          }
        } else {
          // Remove red styling if the field has a value
          concurClaimField.classList.remove("is-required");

          // Remove the visual indicator if it exists
          const indicator = document.querySelector(
            ".concur-required-indicator"
          );
          if (indicator) {
            indicator.remove();
          }
        }
      } else {
        // Remove required attribute and visual indicator
        concurClaimField.removeAttribute("required");
        concurClaimField.classList.remove("is-required");

        // Remove the visual indicator if it exists
        const indicator = document.querySelector(".concur-required-indicator");
        if (indicator) {
          indicator.remove();
        }
      }
    }

    return hasExpenses;
  }

  // Add event listeners to all expense fields
  expenseFields.forEach((field) => {
    if (field) {
      field.addEventListener("input", checkExpenses);
      field.addEventListener("change", checkExpenses);
    }
  });

  // Add event listener to the Concur Claim field to update styling when it changes
  if (concurClaimField) {
    concurClaimField.addEventListener("input", function () {
      if (this.value && this.value.trim() !== "") {
        this.classList.remove("is-required");

        // Remove the visual indicator if it exists
        const indicator = document.querySelector(".concur-required-indicator");
        if (indicator) {
          indicator.remove();
        }

        // Remove error message if it exists
        const errorMessage = document.querySelector(".concur-error-message");
        if (errorMessage) {
          errorMessage.remove();
        }

        // Remove error class
        this.classList.remove("is-invalid");
      } else {
        // Check if we need to add the styling back
        checkExpenses();
      }
    });
  }

  // Add form submission validation
  if (form) {
    form.addEventListener("submit", function (event) {
      const hasExpenses = checkExpenses();

      if (
        hasExpenses &&
        (!concurClaimField.value || concurClaimField.value.trim() === "")
      ) {
        // Prevent form submission
        event.preventDefault();

        // Add error message
        let errorMessage = document.querySelector(".concur-error-message");
        if (!errorMessage) {
          errorMessage = document.createElement("div");
          errorMessage.className = "concur-error-message text-danger mt-2";
          errorMessage.textContent =
            "Concur Claim Number is required when expenses are entered.";
          concurClaimField.parentNode.appendChild(errorMessage);
        }

        // Focus on the field
        concurClaimField.focus();

        // Add error class to the field
        concurClaimField.classList.add("is-invalid");

        return false;
      }

      // Remove error message if it exists
      const errorMessage = document.querySelector(".concur-error-message");
      if (errorMessage) {
        errorMessage.remove();
      }

      // Remove error class from the field
      concurClaimField.classList.remove("is-invalid");

      return true;
    });
  }

  // Initial check when the page loads
  checkExpenses();
});
