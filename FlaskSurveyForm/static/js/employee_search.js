import { initAutocomplete } from './autocomplete.js';

// Employee search and autocomplete functionality

// Log that employee search script is loaded
console.log("Employee search script loaded (v2 - refactored with autocomplete.js)");

// Global variables for trainees management
let trainees = [];

// General employee search function that can be used for different input fields
function initEmployeeSearch(
  inputId,
  resultsContainerId,
  onSelectCallback,
  options = {}
) {
  console.log(`[EmployeeSearch] Initializing for inputId: ${inputId}, resultsContainerId: ${resultsContainerId}`);
  console.log(`[EmployeeSearch] Options received:`, options);

  const {
    hiddenFieldId = null,
    clearInput = true,
    focusInput = false,
    addToTrainees = false
  } = options;

  initAutocomplete({
    inputId: inputId,
    resultsId: resultsContainerId,
    lookupUrl: "/api/employees", // Specific for employees
    fuseKeys: ['displayName', 'email', 'department', 'name'], // Keys to search in employee data
    renderItem: (employee) => {
      // console.log('[EmployeeSearch] Rendering employee:', employee);
      return `
        <div class="fw-medium">${employee.name || employee.displayName}</div>
        ${employee.email ? `<div class="text-muted small">${employee.email}</div>` : ''}
        ${employee.department ? `<div class="text-muted small fst-italic">${employee.department}</div>` : ''}
      `;
    },
    onSelect: (employee) => {
      console.log(`[EmployeeSearch] Employee selected via autocomplete callback:`, employee);

      // For trainer search, the inputId is 'trainer_name_search'. We want to keep its value.
      // For trainee search, inputId is 'trainee-search-input', and its value should be cleared (handled by initAutocomplete if clearInputOnSelect is true).
      if (inputId === 'trainer_name_search') {
        const trainerSearchInputElement = document.getElementById('trainer_name_search');
        if (trainerSearchInputElement) {
            trainerSearchInputElement.value = employee.name; // Explicitly set trainer name input
        }
      }

      // Update hidden field if specified (applies to trainer search)
      if (hiddenFieldId) {
        const hiddenField = document.getElementById(hiddenFieldId);
        if (hiddenField) {
          hiddenField.value = employee.name;
          hiddenField.dispatchEvent(new Event("change"));
        }
      }

      // Add to trainees if specified (using existing logic from this file)
      if (addToTrainees) {
        addTrainee(
          employee.name,
          employee.email,
          employee.department,
        );
      }

      // Call the original onSelectCallback passed to initEmployeeSearch
      if (onSelectCallback) {
        console.log("[EmployeeSearch] Calling original onSelectCallback.");
        onSelectCallback(employee);
      }

      // Focus input if specified
      if (focusInput) {
        const inputElem = document.getElementById(inputId);
        if(inputElem) inputElem.focus();
      }
    },
    fuseOptions: { threshold: 0.4, minMatchCharLength: 2, includeScore: true, keys: ['displayName', 'email', 'department', 'name'] },
    noResultsText: "No matching employees found",
    minSearchLength: 2,
    clearInputOnSelect: inputId !== 'trainer_name_search' // false for trainer_name_search, true otherwise
  });
  console.log(`[EmployeeSearch] initAutocomplete called for #${inputId} with clearInputOnSelect: ${inputId !== 'trainer_name_search'}`);
}

// Function to find an employee by email in the employee list
function findEmployeeByEmail(email) {
  if (!window.employeeList || window.employeeList.length === 0) {
    console.warn(
      "findEmployeeByEmail: employeeList is not available or empty. Fetching fresh list.",
    );
    // Optionally, trigger a load here or return a promise after loading
    return null; // Or handle appropriately
  }
  return window.employeeList.find(
    (emp) => emp.email && emp.email.toLowerCase() === email.toLowerCase(),
  );
}

// Core function to add a trainee
function addTrainee(name, email, department) {
  console.log("Adding trainee:", { name, email, department });

  // Check if trainee already exists
  if (trainees.some((t) => t.email === email)) {
    console.log("Trainee already exists:", email);
    return false;
  }

  // Add to trainees array
  trainees.push({
    name: name,
    email: email,
    department: department || "Engineering"
  });

  console.log("Updated trainees array:", trainees);

  // Update UI and hidden fields
  updateTraineesUI();
  updateTraineesData();
  return true;
}

// Function to remove a trainee from the list
function removeTrainee(email) {
  trainees = trainees.filter((t) => t.email !== email);
  updateTraineesUI();
  updateTraineesData();
}

// Function to update trainees UI
function updateTraineesUI() {
  const traineesList = document.getElementById("trainees-list");
  const noTraineesMessage = document.getElementById("no-trainees-message");

  if (!traineesList || !noTraineesMessage) return;

  if (trainees.length === 0) {
    noTraineesMessage.style.display = "block";
    traineesList.innerHTML = "";
    return;
  }

  noTraineesMessage.style.display = "none";
  traineesList.innerHTML = "";

  // Create a row for every two trainees
  for (let i = 0; i < trainees.length; i += 2) {
    const row = document.createElement("div");
    row.className = "row g-2 mb-2";

    // First trainee in the row
    [0, 1].forEach((offset) => {
      const trainee = trainees[i + offset];
      if (trainee) {
        const col = document.createElement("div");
        col.className = "col-md-6";
        const traineeItem = document.createElement("div");
        traineeItem.className = "card trainee-card";
        traineeItem.innerHTML = `
          <div class="trainee-card-body">
            <div class="trainee-info">
              <strong class="trainee-name">${trainee.name}</strong><br>
              <small class="trainee-email">${trainee.email}</small><br>
              <small class="text-muted fst-italic">${trainee.department || "Engineering"}</small>
            </div>
            <button type="button" class="btn btn-sm btn-outline-danger remove-trainee remove-trainee-btn" data-email="${trainee.email}">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
              </svg>
              Remove
            </button>
          </div>
        `;
        col.appendChild(traineeItem);
        row.appendChild(col);
      }
    });
    traineesList.appendChild(row);
  }

  // Add event listeners to remove buttons
  document.querySelectorAll(".remove-trainee").forEach((button) => {
    button.addEventListener("click", function () {
      const email = this.getAttribute("data-email");
      removeTrainee(email);
    });
  });
}

// Function to update the hidden field with trainees data
function updateTraineesData() {
  console.log("Updating trainees data");
  console.log("Current trainees array:", trainees);

  // Store all trainees as JSON in the hidden field
  const traineesJson = JSON.stringify(trainees);
  console.log("Trainees JSON string:", traineesJson);

  const traineesDataField = document.getElementById("trainees_data");
  if (traineesDataField) {
    traineesDataField.value = traineesJson;
    console.log("Hidden input value after setting:", traineesDataField.value);
  }
}

// Function to validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

// Function to parse emails from text
function parseEmails(text) {
  // Split by commas or newlines and clean up
  const emails = text
    .split(/[,\n]/)
    .map((email) => email.trim())
    .filter((email) => email.length > 0);

  return emails;
}

// Function to add multiple trainees from emails
function addTraineesFromEmails(emails) {
  console.log("Adding trainees from emails:", emails);

  let results = {
    added: 0,
    invalid: [],
    duplicate: [],
    notFound: [] // Keep track of emails not found
  };

  emails.forEach((email) => {
    if (!isValidEmail(email)) {
      results.invalid.push(email);
      return;
    }

    // Try to find employee in the employee list
    const employee = findEmployeeByEmail(email);

    if (employee) {
      // Use existing addTrainee function with full employee data
      const added = addTrainee(
        employee.displayName,
        employee.email,
        employee.department
      );

      if (added) {
        results.added++;
      } else {
        results.duplicate.push(email);
      }
    } else {
      // Employee not found, add to notFound list
      results.notFound.push(email);
      console.log(`Employee not found for email: ${email}`); // Log not found emails
    }
  });

  // Show results, including which emails were not found
  let messages = [];
  if (results.added > 0) {
    messages.push(`Added ${results.added} trainee(s).`);
  }
  if (results.invalid.length > 0) {
    messages.push(`Invalid email format: ${results.invalid.join(", ")}`);
  }
  if (results.duplicate.length > 0) {
    messages.push(`Already added: ${results.duplicate.join(", ")}`);
  }
  // Updated message for not found emails
  if (results.notFound.length > 0) {
    messages.push(
      `Could not find/add employees for emails: ${results.notFound.join(", ")}`
    );
  }

  if (messages.length > 0) {
    alert(messages.join("\n"));
  }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  // Initialize trainer search
  const trainerSearchInput = document.getElementById("trainer_name_search");
  const trainerSearchResultsDivId = "trainer-search-results";
  if (trainerSearchInput && document.getElementById(trainerSearchResultsDivId)) {
    initEmployeeSearch(
      "trainer_name_search",
      trainerSearchResultsDivId,
      function (employee) {
        // Trainer selection callback
        // The actual input field value setting is now handled within the onSelect of initEmployeeSearch configuration
        console.log("[DOMContentLoaded] Trainer selected in callback:", employee.name);
      },
      {
        hiddenFieldId: "trainer_name_hidden",
        // The old `clearInput: false` for initEmployeeSearch options is not directly relevant here anymore,
        // as initAutocomplete now controls clearing via `clearInputOnSelect`.
      }
    );
  }

  // Initialize trainee search
  const traineeSearchInput = document.getElementById("trainee-search-input");
  const traineeSearchResultsDivId = "trainee-search-results"; 
  if (traineeSearchInput && document.getElementById(traineeSearchResultsDivId)) {
    initEmployeeSearch(
      "trainee-search-input",
      traineeSearchResultsDivId, 
      function (employee) {
        // Trainee selection callback
        console.log("[DOMContentLoaded] Trainee selected in callback:", employee.name);
      },
      {
        addToTrainees: true, 
        focusInput: true
      }
    );
  }

  // Handle add trainee button
  const addTraineeBtn = document.getElementById("add-trainee-btn");
  if (addTraineeBtn) {
    addTraineeBtn.addEventListener("click", function () {
      const searchValue = document
        .getElementById("trainee-search-input")
        .value.trim();
      if (searchValue) {
        const employee = window.employeeList.find(
          (e) =>
            e.displayName.toLowerCase().includes(searchValue.toLowerCase()) ||
            e.email.toLowerCase().includes(searchValue.toLowerCase())
        );

        if (employee) {
          addTrainee(employee.displayName, employee.email, employee.department);
          document.getElementById("trainee-search-input").value = "";
          document.getElementById("trainee-search-input").focus();
        } else {
          alert(
            "Employee not found. Please search and select from the dropdown."
          );
        }
      }
    });
  }

  // Handle the bulk add trainees button and modal
  const bulkAddTraineesBtn = document.getElementById("bulk-add-trainees-btn");
  if (bulkAddTraineesBtn) {
    bulkAddTraineesBtn.addEventListener("click", function () {
      // Check if Bootstrap is available
      if (typeof bootstrap !== "undefined") {
        const modal = new bootstrap.Modal(
          document.getElementById("bulkAddModal")
        );
        modal.show();
      } else {
        console.error("Bootstrap not loaded. Cannot show modal.");
        // Fallback if Bootstrap is not available
        alert(
          "Modal functionality requires Bootstrap. Please ensure it is loaded properly."
        );
      }
    });
  }

  // Handle trainee emails field
  const traineeEmailsField = document.getElementById("trainee_emails");
  const addEmailsBtn = document.getElementById("add-emails-btn");

  if (traineeEmailsField && addEmailsBtn) {
    // Add event listener to the button
    addEmailsBtn.addEventListener("click", function () {
      const emailsText = traineeEmailsField.value.trim();
      if (emailsText) {
        const emails = parseEmails(emailsText);
        if (emails.length > 0) {
          addTraineesFromEmails(emails);
          // Clear the input
          traineeEmailsField.value = "";

          // Close the modal after adding
          if (typeof bootstrap !== "undefined") {
            const modal = bootstrap.Modal.getInstance(
              document.getElementById("bulkAddModal")
            );
            if (modal) {
              modal.hide();
            }
          }
        }
      }
    });
  }

  // Initialize trainees array from hidden field if editing
  const traineesDataField = document.getElementById("trainees_data");
  if (traineesDataField && traineesDataField.value) {
    try {
      const existingTrainees = JSON.parse(traineesDataField.value);
      if (Array.isArray(existingTrainees)) {
        trainees = existingTrainees;
        updateTraineesUI();
        console.log("Initialized trainees from existing data:", trainees);
      }
    } catch (e) {
      console.error("Error parsing trainees data:", e);
    }
  }

  // Handle manual trainee addition
  const saveManualTraineeBtn = document.getElementById("save-manual-trainee");
  if (saveManualTraineeBtn) {
    saveManualTraineeBtn.addEventListener("click", function () {
      // Get form values
      const firstName = document
        .getElementById("manual-first-name")
        .value.trim();
      const lastName = document.getElementById("manual-last-name").value.trim();
      const department = document
        .getElementById("manual-department")
        .value.trim();
      const email = document.getElementById("manual-email").value.trim();

      // Validate required fields
      if (!firstName || !lastName || !email) {
        alert("Please fill in all required fields.");
        return;
      }

      // Validate email format
      if (!isValidEmail(email)) {
        alert("Please enter a valid email address.");
        return;
      }

      // Create trainee object
      const trainee = {
        name: `${firstName} ${lastName}`,
        email: email,
        department: department || "Engineering"
      };

      // Add trainee
      const added = addTrainee(trainee.name, trainee.email, trainee.department);

      if (added) {
        // Clear form
        document.getElementById("manual-first-name").value = "";
        document.getElementById("manual-last-name").value = "";
        document.getElementById("manual-department").value = "Engineering";
        document.getElementById("manual-email").value = "";

        // Close modal
        const modal = bootstrap.Modal.getInstance(
          document.getElementById("manualAddModal")
        );
        if (modal) {
          modal.hide();
        }

        // Focus back on search input
        const searchInput = document.getElementById("trainee-search-input");
        if (searchInput) {
          searchInput.focus();
        }
      }
    });
  }
});
