// Employee list data for autocomplete
window.employeeList = [];

// Function to load employee data
function loadEmployeeData() {
  console.log("Loading employee data...");
  fetch("/api/employees")
    .then((response) => response.json())
    .then((data) => {
      console.log(`Loaded ${data.length} employees`);
      // Clear the array and add the new data
      window.employeeList.length = 0;
      window.employeeList.push(...data);

      // Log the first few employee records for debugging
      if (data.length > 0) {
        console.log("Sample employee data:", data.slice(0, 3));
      }
    })
    .catch((error) => console.error("Error loading employee data:", error));
}

// Initialize the employee data when the page loads
document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM loaded, loading employee data...");
  loadEmployeeData();
});
