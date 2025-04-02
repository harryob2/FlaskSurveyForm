/**
 * Validates that the end date is not before the start date
 * @returns {boolean} - True if dates are valid, false otherwise
 */
function validateDates() {
    const startDateInput = document.getElementById('start_date');
    const endDateInput = document.getElementById('end_date');
    
    if (!startDateInput || !endDateInput) {
        return true; // If the elements don't exist, don't block submission
    }
    
    const startDate = new Date(startDateInput.value);
    const endDate = new Date(endDateInput.value);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return true; // If dates are not properly formatted, let server validation handle it
    }
    
    if (endDate < startDate) {
        alert('End date cannot be earlier than start date.');
        endDateInput.focus();
        return false;
    }
    
    return true;
}

/**
 * Validates that the file size is within the allowed limit
 * @returns {boolean} - True if file size is valid, false otherwise
 */
function validateFileSize() {
    const fileInput = document.getElementById('invoice_attachment');
    
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        return true; // No file selected, validation passes
    }
    
    const maxSize = 16 * 1024 * 1024; // 16MB in bytes
    const fileSize = fileInput.files[0].size;
    
    if (fileSize > maxSize) {
        alert('File size exceeds the maximum allowed size of 16MB.');
        fileInput.value = ''; // Clear the input
        return false;
    }
    
    return true;
}