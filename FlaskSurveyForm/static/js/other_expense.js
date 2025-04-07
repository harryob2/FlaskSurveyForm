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
    "other-expense-description-container"
  );

  // Get the Other Expense Description field
  const descriptionField = document.getElementById("other_expense_description");

  // Get the required text element
  const requiredText = document.querySelector(".other-expense-required-text");

  // Get the form element
  const form = document.getElementById("training-form");

  // Function to check if Other Expenses field has a value
  function checkOtherExpenses() {
    if (otherCostField && descriptionContainer) {
      const hasOtherExpenses =
        otherCostField.value && parseFloat(otherCostField.value) > 0;

      if (hasOtherExpenses) {
        // Show the description field
        descriptionContainer.classList.remove("d-none");

        // Make the description field required
        if (descriptionField) {
          descriptionField.setAttribute("required", "required");

          // Only add the red styling if the field is empty
          if (!descriptionField.value || descriptionField.value.trim() === "") {
            descriptionField.classList.add("is-required");
            // Show the required text
            if (requiredText) {
              requiredText.classList.remove("d-none");
            }
          } else {
            descriptionField.classList.remove("is-required");
            // Hide the required text
            if (requiredText) {
              requiredText.classList.add("d-none");
            }
          }
        }
      } else {
        // Hide the description field
        descriptionContainer.classList.add("d-none");

        // Remove required attribute
        if (descriptionField) {
          descriptionField.removeAttribute("required");
          descriptionField.classList.remove("is-required");
          // Hide the required text
          if (requiredText) {
            requiredText.classList.add("d-none");
          }
        }
      }
    }
  }

  // Add event listeners to the Other Expenses field
  if (otherCostField) {
    otherCostField.addEventListener("input", checkOtherExpenses);
    otherCostField.addEventListener("change", checkOtherExpenses);
  }

  // Add event listener to the description field to remove red styling when filled
  if (descriptionField) {
    descriptionField.addEventListener("input", function () {
      if (this.value && this.value.trim() !== "") {
        this.classList.remove("is-required");
        // Hide the required text
        if (requiredText) {
          requiredText.classList.add("d-none");
        }
      } else {
        this.classList.add("is-required");
        // Show the required text
        if (requiredText) {
          requiredText.classList.remove("d-none");
        }
      }
    });
  }

  // Add form submission validation
  if (form) {
    form.addEventListener("submit", function (event) {
      const hasOtherExpenses =
        otherCostField.value && parseFloat(otherCostField.value) > 0;

      if (
        hasOtherExpenses &&
        (!descriptionField.value || descriptionField.value.trim() === "")
      ) {
        // Prevent form submission
        event.preventDefault();

        // Add error message
        let errorMessage = document.querySelector(
          ".other-expense-error-message"
        );
        if (!errorMessage) {
          errorMessage = document.createElement("div");
          errorMessage.className =
            "other-expense-error-message text-danger mt-2";
          errorMessage.textContent =
            "Description is required when other expenses are entered.";
          descriptionField.parentNode.appendChild(errorMessage);
        }

        // Focus on the field
        descriptionField.focus();

        // Add error class to the field
        descriptionField.classList.add("is-invalid");

        return false;
      }

      // Remove error message if it exists
      const errorMessage = document.querySelector(
        ".other-expense-error-message"
      );
      if (errorMessage) {
        errorMessage.remove();
      }

      // Remove error class from the field
      descriptionField.classList.remove("is-invalid");

      return true;
    });
  }

  // Initial check when the page loads
  checkOtherExpenses();
});
