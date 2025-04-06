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

    if (matchingEmployees.length > 0) {
      // Important: use display style directly instead of classList
      resultsContainer.style.display = "block";

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
    } else {
      // Show a "no results" message instead of hiding
      resultsContainer.style.display = "block";
      const noResults = document.createElement("div");
      noResults.className = "p-2 text-muted";
      noResults.textContent = "No matching employees found";
      noResults.style.backgroundColor = "#fff";
      noResults.style.color = "#6c757d";
      resultsContainer.appendChild(noResults);
    }
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

// Function to add a trainee to the list
function addTrainee(name, email, department) {
  console.log("Adding trainee:", { name, email, department });

  // Check if trainee already exists
  if (trainees.some((t) => t.email === email)) {
    console.log("Trainee already exists:", email);
    alert("This trainee is already added.");
    return;
  }

  // Add to trainees array
  trainees.push({
    name: name,
    email: email,
    department: department || "Engineering"
  });

  console.log("Updated trainees array:", trainees);

  // Update UI
  updateTraineesUI();

  // Update hidden fields for form submission
  updateTraineesData();
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

  // Create a list of trainees with option to remove
  trainees.forEach((trainee) => {
    const traineeItem = document.createElement("div");
    traineeItem.className = "card mb-2";

    traineeItem.innerHTML = `
            <div class="card-body py-2">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${trainee.name}</strong><br>
                        <small class="text-muted">${trainee.email}</small><br>
                        <small class="text-muted fst-italic">${
                          trainee.department || "Engineering"
                        }</small>
                    </div>
                    <button type="button" class="btn btn-sm btn-outline-danger remove-trainee" data-email="${
                      trainee.email
                    }">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
                            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                            <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                        </svg>
                        Remove
                    </button>
                </div>
            </div>
        `;

    traineesList.appendChild(traineeItem);
  });

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
});
