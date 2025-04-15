/**
 * Validates that the end date is not before the start date.
 * @param {HTMLInputElement} startDateInput - The start date input element.
 * @param {HTMLInputElement} endDateInput - The end date input element.
 * @returns {HTMLElement | null} - Returns the invalid element (endDateInput) or null if valid.
 */
function validateDates(startDateInput, endDateInput) {
  if (!startDateInput || !endDateInput || !startDateInput.value || !endDateInput.value) {
    return null; // Not enough info to validate or fields empty (let 'required' handle empty)
  }

  const startDate = new Date(startDateInput.value);
  const endDate = new Date(endDateInput.value);

  // Basic check if dates are valid objects
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      // Let browser's type="date" validation handle format issues primarily
      // Or rely on server-side WTForms validation for format
    return null;
  }

  if (endDate < startDate) {
    // Set a custom message for reportValidity to use
    endDateInput.setCustomValidity("End date cannot be earlier than start date.");
    return endDateInput; // Return the element that failed validation
  } else {
     endDateInput.setCustomValidity(""); // Clear custom validity if it was previously set
  }

  return null; // Dates are valid
}

/**
 * Validates that the file size is within the allowed limit
 * @returns {boolean} - True if file size is valid, false otherwise
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
