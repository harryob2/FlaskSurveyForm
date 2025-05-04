// Employee search and autocomplete functionality

// Log that employee search script is loaded
console.log("Employee search script loaded");

// Global variables for trainees management
let trainees = [];

// General employee search function that can be used for different input fields
function initEmployeeSearch(
  inputId,
  resultsContainer,
  onSelectCallback,
  options = {}
) {
  console.log(`Initializing search for ${inputId}`);
  console.log(
    `Current employee list length: ${
      window.employeeList ? window.employeeList.length : 0
    }`
  );
  const inputElement = document.getElementById(inputId);
  if (!inputElement) return;

  // Default options
  const {
    hiddenFieldId = null,
    clearInput = true,
    focusInput = false,
    addToTrainees = false
  } = options;

  // Function to search and display results
  function performSearch(searchValue) {
    // Clear previous results
    resultsContainer.innerHTML = "";

    // Debug info
    console.log(`Searching for: "${searchValue}"`);

    if (searchValue.length < 2) {
      resultsContainer.style.display = "none";
      return;
    }

    searchValue = searchValue.toLowerCase();

    // Filter employees
    const matchingEmployees = window.employeeList
      .filter((employee) => {
        return (
          (employee.name &&
            employee.name.toLowerCase().includes(searchValue)) ||
          (employee.email &&
            employee.email.toLowerCase().includes(searchValue)) ||
          (employee.displayName &&
            employee.displayName.toLowerCase().includes(searchValue))
        );
      })
      .slice(0, 10); // Limit to 10 results

    console.log(`Found ${matchingEmployees.length} matching employees`);

    // Show results container
    resultsContainer.style.display = "block";

    // If no results found, show manual add button
    if (matchingEmployees.length === 0) {
      resultsContainer.innerHTML = `
        <div class="no-results-found p-3 text-center">
          <p class="mb-2">No matching employees found</p>
          <button type="button" class="btn btn-outline-primary btn-sm manual-add-trainee">
            <i class="bi bi-plus-lg"></i> Add trainee manually
          </button>
        </div>
      `;

      // Add click handler for manual add button
      const manualAddBtn = resultsContainer.querySelector(
        ".manual-add-trainee"
      );
      if (manualAddBtn) {
        manualAddBtn.addEventListener("click", () => {
          // Show manual add modal
          const modal = new bootstrap.Modal(
            document.getElementById("manualAddModal")
          );
          modal.show();
          // Clear the search input and results
          inputElement.value = "";
          resultsContainer.style.display = "none";
        });
      }
      return;
    }

    // Add matching employees to the dropdown
    matchingEmployees.forEach((employee) => {
      const itemDiv = document.createElement("div");
      itemDiv.className = "p-2 autocomplete-item";
      itemDiv.style.cursor = "pointer";
      itemDiv.style.borderBottom = "1px solid #dee2e6";
      itemDiv.style.backgroundColor = "var(--bs-body-bg)";
      itemDiv.style.color = "var(--bs-body-color)";

      // Make it stand out visually on hover
      itemDiv.addEventListener("mouseenter", function () {
        this.style.backgroundColor = "var(--bs-secondary-bg)";
      });

      itemDiv.addEventListener("mouseleave", function () {
        this.style.backgroundColor = "var(--bs-body-bg)";
      });

      // Create a safe copy of the employee data for the callback to avoid reference issues
      const employeeCopy = {
        displayName: employee.displayName || "",
        name: employee.displayName || employee.name || "Unknown",
        email: employee.email || "",
        department: employee.department || "Engineering",
        firstName: employee.firstName || "",
        lastName: employee.lastName || ""
      };

      // Create HTML for display with name, email and department
      itemDiv.innerHTML = `
                  <div class="fw-medium">${employeeCopy.name}</div>
                  ${
                    employeeCopy.email
                      ? `<div class="text-muted small">${employeeCopy.email}</div>`
                      : ""
                  }
                  ${
                    employeeCopy.department
                      ? `<div class="text-muted small fst-italic">${employeeCopy.department}</div>`
                      : ""
                  }
              `;

      // Click handler to select an employee
      itemDiv.addEventListener("click", function () {
        console.log(`Employee selected: ${employeeCopy.name}`);

        // Update hidden field if specified
        if (hiddenFieldId) {
          const hiddenField = document.getElementById(hiddenFieldId);
          if (hiddenField) {
            hiddenField.value = employeeCopy.name;
            // Trigger change event to update any dependent form validations
            hiddenField.dispatchEvent(new Event("change"));
          }
        }

        // Add to trainees if specified
        if (addToTrainees) {
          addTrainee(
            employeeCopy.name,
            employeeCopy.email,
            employeeCopy.department
          );
        }

        // Call the callback with the employee data
        onSelectCallback(employeeCopy);

        // Clear input if specified
        if (clearInput) {
          inputElement.value = "";
        }

        // Focus input if specified
        if (focusInput) {
          inputElement.focus();
        }

        resultsContainer.style.display = "none";
      });

      resultsContainer.appendChild(itemDiv);
    });
  }

  // Input event handler for searching
  inputElement.addEventListener("input", function () {
    performSearch(this.value);
  });

  // Close results when clicking outside
  document.addEventListener("click", function (e) {
    if (e.target !== inputElement && !resultsContainer.contains(e.target)) {
      resultsContainer.style.display = "none";
    }
  });

  // Handle keyboard navigation
  inputElement.addEventListener("keydown", function (e) {
    const items = resultsContainer.querySelectorAll(".autocomplete-item");
    if (items.length === 0 || resultsContainer.style.display === "none") return;

    // Find active item
    let activeIndex = -1;
    for (let i = 0; i < items.length; i++) {
      if (items[i].classList.contains("active")) {
        activeIndex = i;
        break;
      }
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (activeIndex < items.length - 1) {
        items[activeIndex + 1].classList.add("active");
        if (activeIndex >= 0) {
          items[activeIndex].classList.remove("active");
        }
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (activeIndex > 0) {
        items[activeIndex - 1].classList.add("active");
        items[activeIndex].classList.remove("active");
      }
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      items[activeIndex].click();
    }
  });
}

// Function to find an employee by email in the employee list
function findEmployeeByEmail(email) {
  return window.employeeList.find(
    (e) => e.email.toLowerCase() === email.toLowerCase()
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
  const trainerSearchResults = document.getElementById(
    "trainer-search-results"
  );
  if (trainerSearchResults) {
    initEmployeeSearch(
      "trainer_name_search",
      trainerSearchResults,
      function (employee) {
        // Trainer selection callback
        console.log("Trainer selected:", employee.name);
        // Update the visible input field with the selected trainer's name
        const trainerSearchInput = document.getElementById(
          "trainer_name_search"
        );
        if (trainerSearchInput) {
          trainerSearchInput.value = employee.name;
        }
      },
      {
        hiddenFieldId: "trainer_name_hidden",
        clearInput: false
      }
    );
  }

  // Initialize trainee search
  const traineeSearchResults = document.getElementById(
    "trainee-search-results"
  );
  if (traineeSearchResults) {
    initEmployeeSearch(
      "trainee-search-input",
      traineeSearchResults,
      function (employee) {
        // Trainee selection callback
        console.log("Trainee selected:", employee.name);
      },
      {
        addToTrainees: true,
        clearInput: true,
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
