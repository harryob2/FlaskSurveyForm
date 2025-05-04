/**
 * Form validation logic for the training form.
 */

/**
 * Validates that the end date is not before the start date.
 * Sets custom validity message on the endDateInput if invalid.
 * @param {HTMLInputElement} startDateInput - The start date input element.
 * @param {HTMLInputElement} endDateInput - The end date input element.
 */
function validateDates(startDateInput, endDateInput) {
  if (
    !startDateInput ||
    !endDateInput ||
    !startDateInput.value ||
    !endDateInput.value
  ) {
     endDateInput?.setCustomValidity(""); // Clear previous error if inputs cleared
    return; // Not enough info to validate or fields empty (let 'required' handle empty)
  }

  const startDate = new Date(startDateInput.value);
  const endDate = new Date(endDateInput.value);

  // Basic check if dates are valid objects
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
     endDateInput.setCustomValidity(""); // Clear validity if format is wrong (let type=date handle)
    return;
  }

  if (endDate < startDate) {
    endDateInput.setCustomValidity(
      "End date cannot be earlier than start date.",
    );
  } else {
    endDateInput.setCustomValidity(""); // Clear custom validity if valid
  }
}

/**
 * Validates that the file size is within the allowed limit (16MB).
 * This seems related to an invoice form, not the main training form?
 * Kept for now, but might be unused in the current context.
 * @returns {boolean} - True if file size is valid or no file, false otherwise
 */
function validateFileSize() {
  const fileInput = document.getElementById("invoice_attachment");

  if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
    return true; // No file selected, validation passes
  }

  const maxSize = 16 * 1024 * 1024; // 16MB in bytes
  const fileSize = fileInput.files[0].size;

  if (fileSize > maxSize) {
    alert("File size exceeds the maximum allowed size of 16MB.");
    fileInput.value = ""; // Clear the input
    return false;
  }

  return true;
}


// --- Main Validation Driver Logic (integrating previous inline script logic) ---
document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("training-form");
    const submitButton = document.getElementById("submit-training-form-btn");

    if (!form || !submitButton) {
        console.error("Form or Submit Button not found for validation initialization.");
        return;
    }

    // Helper: Check if an element (or its container) is truly visible to the user
    function isReallyVisible(element) {
        if (!element) return false;
        let el = element;
        let visible = false;
        let depth = 0; // Prevent infinite loops
        while (el && el !== document.body && depth < 10) {
            const style = window.getComputedStyle(el);
            if (
                style.display === "none" ||
                style.visibility === "hidden" ||
                parseFloat(style.opacity) === 0
            ) {
                return false;
            }
            if (style.display !== "none" && (el.offsetWidth > 0 || el.offsetHeight > 0)) {
                visible = true;
            }
            el = el.parentElement;
            depth++;
        }
        return visible;
    }

    // Helper function to display validation messages
    function showValidationMessage(element, message) {
        const container = element.closest('.form-group, .mb-3, .trainee-search-box, #training-type-card-group');
        const targetElement = container || element;

        // Remove existing message within the container first
        const existingMsg = targetElement.parentNode?.querySelector('.validation-message[data-target="' + (element.id || element.name) + '"]');
        if (existingMsg) {
            existingMsg.remove();
        }

        const messageElement = document.createElement("div");
        messageElement.className = "validation-message alert alert-danger mt-2";
        messageElement.style.cssText = "padding: 0.5rem; font-size: 0.9rem;";
        messageElement.textContent = message;
        messageElement.setAttribute('data-target', (element.id || element.name)); // Link message to field

        try {
             if (targetElement.parentNode) {
                 if (targetElement.nextSibling) {
                    targetElement.parentNode.insertBefore(messageElement, targetElement.nextSibling);
                 } else {
                    targetElement.parentNode.appendChild(messageElement);
                 }
            } else {
                 console.error("Could not find parent node to insert validation message for:", element);
            }
        } catch (e) {
            console.error(`Error inserting validation message for element:`, element, e);
        }
        return messageElement;
    }

    // --- Form Validation triggered by BUTTON CLICK ---
    submitButton.addEventListener("click", function (event) {
        // 1. Reset state
        document.querySelectorAll(".validation-message").forEach((el) => el.remove());
        form.classList.remove("was-validated");
        // Reset custom validity messages
        Array.from(form.elements).forEach(el => el.setCustomValidity?.(""));
        console.log("Form validation triggered...");

        // 2. Specific Custom Validations (before checkValidity)
        const trainingType = form.elements["training_type"];
        const locationType = form.elements["location_type"];
        const startDate = form.elements["start_date"];
        const endDate = form.elements["end_date"];
        const travelCost = form.elements["travel_cost"];
        const foodCost = form.elements["food_cost"];
        const materialsCost = form.elements["materials_cost"];
        const otherCost = form.elements["other_cost"];
        const concurClaim = form.elements["concur_claim"];
        const otherDesc = form.elements["other_expense_description"];
        const trainerNameSearch = document.getElementById("trainer_name_search");
        const trainerNameHidden = form.elements["trainer_name"];
        const traineesData = form.elements["trainees_data"];
        const locationDetails = form.elements["location_details"];

        let firstInvalidElement = null;
        let firstInvalidMessageElement = null;

        // --- Training Type ---
        if (!trainingType.value) {
            const message = "Please select a training type.";
            const targetElement = document.getElementById('training-type-card-group') || trainingType[0];
            if (targetElement) {
                firstInvalidMessageElement = showValidationMessage(targetElement, message);
                firstInvalidElement = targetElement; // Set focus target
            }
        }

        // --- Location Type --- (If training type is selected)
        if (trainingType.value && !locationType.value) {
            const message = "Please select a location type.";
            const targetElement = locationType[0]?.closest(".form-group") || locationType[0];
            if (targetElement && !firstInvalidElement) {
                firstInvalidMessageElement = showValidationMessage(targetElement, message);
                firstInvalidElement = targetElement;
            }
        }

        // --- Location Details --- (If Offsite)
        if (locationType.value === 'Offsite' && !locationDetails?.value?.trim()) {
             const message = "Location Details are required for Offsite training.";
             if (locationDetails && !firstInvalidElement) {
                  firstInvalidMessageElement = showValidationMessage(locationDetails, message);
                  firstInvalidElement = locationDetails;
                  locationDetails.setCustomValidity(message); // Also set for potential Bootstrap styling
             }
        } else if (locationDetails) {
            locationDetails.setCustomValidity("");
        }

        // --- Dates ---
        validateDates(startDate, endDate); // Sets custom validity on endDate

        // --- Conditional Trainer Name ---
        if (trainerNameSearch && trainerNameHidden) {
            if (trainingType.value === "Internal Training" && !trainerNameHidden.value?.trim()) {
                trainerNameSearch.setCustomValidity("Trainer name is required for internal training.");
            } else {
                trainerNameSearch.setCustomValidity("");
            }
        }

        // --- Trainer Hours: Required for Internal Training ---
        const trainerHours = form.elements["trainer_hours"];
        if (
            trainingType.value === "Internal Training" &&
            trainerHours &&
            (
                trainerHours.value === "" ||
                isNaN(Number(trainerHours.value)) ||
                Number(trainerHours.value) <= 0
            )
        ) {
            trainerHours.classList.add("is-invalid");
            // Add feedback if not present
            let feedback = trainerHours.parentElement.querySelector('.invalid-feedback');
            if (!feedback) {
                feedback = document.createElement('div');
                feedback.className = 'invalid-feedback';
                feedback.innerText = "Trainer hours are required and must be greater than 0 for internal training.";
                trainerHours.parentElement.appendChild(feedback);
            }
            trainerHours.setCustomValidity("Trainer hours are required and must be greater than 0 for internal training.");
            if (!firstInvalidElement) firstInvalidElement = trainerHours;
        } else if (trainerHours) {
            trainerHours.classList.remove("is-invalid");
            trainerHours.setCustomValidity("");
            let feedback = trainerHours.parentElement.querySelector('.invalid-feedback');
            if (feedback) feedback.remove();
        }

        // --- Expenses: Concur Claim ---
        // Relies on parseCurrency from form_helpers.js (ensure loaded first)
        const expenseInputs = [travelCost, foodCost, materialsCost, otherCost].filter(el => el);
        let hasExpenses = expenseInputs.some((input) => {
             const val = (typeof parseCurrency === 'function') ? parseCurrency(input.value) : parseFloat(input.value || '0');
             return !isNaN(val) && val > 0;
         });
        if (concurClaim) {
            if (hasExpenses && !concurClaim.value.trim()) {
                concurClaim.setCustomValidity("Concur Claim Number is required when expenses are entered.");
            } else {
                concurClaim.setCustomValidity("");
            }
        }

        // --- Expenses: Other Description ---
        if (otherDesc && otherCost) {
             const otherCostVal = (typeof parseCurrency === 'function') ? parseCurrency(otherCost.value) : parseFloat(otherCost.value || '0');
            if (!isNaN(otherCostVal) && otherCostVal > 0 && !otherDesc.value.trim()) {
                otherDesc.setCustomValidity("Description is required when other expenses are entered.");
            } else {
                otherDesc.setCustomValidity("");
            }
        }

        // --- Trainees ---
        if (!traineesData || !traineesData.value || traineesData.value.trim() === '[]') {
            const message = "At least one trainee must be added.";
            const targetElement = document.getElementById("trainee-search-input") || document.getElementById("trainees-list");
            if (targetElement && !firstInvalidElement) {
                firstInvalidMessageElement = showValidationMessage(targetElement, message);
                firstInvalidElement = targetElement;
            }
        }

        // 3. Perform Browser's Check & Find First Standard Error
        let isFormValid = form.checkValidity(); // Check standard HTML5 validation

        if (!isFormValid && !firstInvalidElement) { // Find the first *standard* error only if no custom one was found yet
            const elements = form.elements;
            for (let i = 0; i < elements.length; i++) {
                const element = elements[i];
                if (!element.name || element.type === 'submit' || element.type === 'button' || element.disabled ) continue;

                if (!element.validity.valid) {
                    if (isReallyVisible(element)) {
                        // Show message for this standard error
                        showValidationMessage(element, element.validationMessage || "This field is required.");
                        firstInvalidElement = element; // Set this as the first element to focus/scroll to
                        break; // Stop at the first visible standard error
                    }
                }
            }
        }

        // 4. Handle Overall Validity
        if (!isFormValid || firstInvalidMessageElement) { // If either checkValidity failed OR we manually added a message
            event.preventDefault(); // Prevent submission
            form.classList.add("was-validated"); // Trigger Bootstrap styles for fields with setCustomValidity errors

            let elementToFocus = firstInvalidElement; // Use the element identified earlier

            // Adjust focus target for specific controls
            if (elementToFocus) {
                 if (elementToFocus.name === 'training_type') {
                     elementToFocus = document.getElementById('training-type-card-group') || elementToFocus;
                 } else if (elementToFocus.name === 'location_type'){
                     elementToFocus = elementToFocus.closest('.form-group') || elementToFocus;
                 } else if (elementToFocus.id === 'trainee-search-input' || elementToFocus.id === 'trainees-list') {
                     elementToFocus = document.getElementById('trainee-search-input') || elementToFocus;
                 } else if (elementToFocus.id === 'trainer_name') { // Hidden field
                     elementToFocus = document.getElementById('trainer_name_search') || elementToFocus;
                 }

                console.log("Scrolling/Focusing first invalid element:", elementToFocus);
                const scrollTarget = elementToFocus.closest('.form-group, .mb-3, .trainee-search-box, #training-type-card-group') || elementToFocus;
                scrollTarget.scrollIntoView({ behavior: "smooth", block: "center" });

                setTimeout(() => {
                    let focusable = (elementToFocus.tagName === 'INPUT' || elementToFocus.tagName === 'TEXTAREA' || elementToFocus.tagName === 'SELECT')
                                      ? elementToFocus
                                      : elementToFocus.querySelector('input:not([type=hidden]), textarea, select');

                    if (focusable?.focus) {
                        focusable.focus({ preventScroll: true });
                    }
                }, 150);
            }

        } else {
            // Form IS valid
            console.log("Form is valid. Preparing attachments for submission.");
            form.classList.remove("was-validated");

            if (window.prepareAttachmentsForSubmit) {
                window.prepareAttachmentsForSubmit();
            } else {
                console.error("prepareAttachmentsForSubmit function not found!");
            }
        }
    });

    console.log("Form Validation Initialized.");
});
