/**
 * Initializes a generic autocomplete component with Fuse.js for fuzzy searching.
 *
 * @param {object} config - Configuration object for the autocomplete.
 * @param {string} config.inputId - The ID of the input field for searching.
 * @param {string} config.resultsId - The ID of the container to display search results.
 * @param {string} config.lookupUrl - The URL to fetch the data from (expects JSON array).
 * @param {string[]} config.fuseKeys - An array of keys within the data objects to search on.
 * @param {function} config.renderItem - A function that takes a result item and returns an HTML string for display.
 * @param {function} config.onSelect - A callback function executed when an item is selected. It receives the selected item object.
 * @param {object} [config.fuseOptions] - Optional Fuse.js options (e.g., { threshold: 0.3, minMatchCharLength: 2 }).
 * @param {string} [config.noResultsText] - Text to display when no results are found (default: "No results found").
 * @param {number} [config.minSearchLength=2] - Minimum characters to type before searching.
 * @param {boolean} [config.clearInputOnSelect=true] - Whether to clear the input after selecting an item.
 * @param {boolean} [config.showOtherOptionOnNoResults=false] - Whether to show an "Other" option when no results are found.
 * @param {string} [config.otherOptionText="Other (Manual Entry)"] - Text for the "Other" option.
 * @param {object} [config.otherOptionValue={id: 0, name: "Other (Manual Entry)"}] - Value for the "Other" option.
 */
export function initAutocomplete({
  inputId,
  resultsId,
  lookupUrl,
  fuseKeys,
  renderItem,
  onSelect,
  fuseOptions = { threshold: 0.4, minMatchCharLength: 1, includeScore: true, keys: fuseKeys },
  noResultsText = "No results found",
  minSearchLength = 2,
  clearInputOnSelect = true,
  showOtherOptionOnNoResults = false,
  otherOptionText = "Other (Manual Entry)",
  otherOptionValue = { id: 0, name: "Other (Manual Entry)" }
}) {
  console.log(`[Autocomplete] Initializing for input: #${inputId}, results: #${resultsId}, URL: ${lookupUrl}, clearOnSelect: ${clearInputOnSelect}, showOther: ${showOtherOptionOnNoResults}`); // Debug
  const inputElement = document.getElementById(inputId);
  const resultsContainer = document.getElementById(resultsId);
  let dataCache = [];
  let fuseInstance = null;

  if (!inputElement || !resultsContainer) {
    console.error(
      `[Autocomplete] Init failed: Input element (#${inputId}) or results container (#${resultsId}) not found.`,
    );
    return;
  }

  // Fetch data and initialize Fuse.js
  console.log(`[Autocomplete] Fetching data from: ${lookupUrl}`); // Debug
  fetch(lookupUrl)
    .then((response) => {
      if (!response.ok) {
        console.error(`[Autocomplete] HTTP error! status: ${response.status} for ${lookupUrl}`); // Debug
        throw new Error(`HTTP error! status: ${response.status} for ${lookupUrl}`);
      }
      return response.json();
    })
    .then((data) => {
      dataCache = data;
      console.log(`[Autocomplete] Data fetched for #${inputId}:`, dataCache.slice(0,3)); // Debug - show first 3 items
      const currentFuseOpts = { ...fuseOptions, keys: fuseKeys }; 
      fuseInstance = new Fuse(dataCache, currentFuseOpts);
      console.log(
        `[Autocomplete] Fuse.js initialized for #${inputId} with ${dataCache.length} items. Options:`, currentFuseOpts
      );
    })
    .catch((error) =>
      console.error(`[Autocomplete] Error fetching or initializing Fuse.js for ${lookupUrl}:`, error),
    );

  inputElement.addEventListener("input", function () {
    // console.log(`[Autocomplete] Input event on #${inputId}, value: '${this.value}'`); // Debug - can be too noisy
    if (!fuseInstance) {
        console.warn(`[Autocomplete] Fuse instance not ready for #${inputId}`); // Debug
        return; 
    }

    const searchValue = this.value;
    resultsContainer.innerHTML = "";

    if (searchValue.length < minSearchLength) {
      // console.log(`[Autocomplete] Search value '${searchValue}' too short for #${inputId}`); // Debug
      resultsContainer.style.display = "none";
      return;
    }
    console.log(`[Autocomplete] Searching for '${searchValue}' in #${inputId}`); // Debug

    const fuseResults = fuseInstance.search(searchValue).slice(0, 10);
    console.log(`[Autocomplete] Fuse results for '${searchValue}' in #${inputId}:`, fuseResults); // Debug

    if (fuseResults.length > 0) {
      resultsContainer.style.display = "block";
      fuseResults.forEach((result) => {
        const item = result.item;
        // console.log(`[Autocomplete] Rendering item for #${inputId}:`, item); // Debug - noisy
        const itemDiv = document.createElement("div");
        itemDiv.className = "autocomplete-item p-2"; // Using generic class + bootstrap padding
        itemDiv.style.cursor = "pointer";
        itemDiv.style.borderBottom = "1px solid #dee2e6"; 
        itemDiv.style.backgroundColor = "var(--bs-body-bg)";
        itemDiv.style.color = "var(--bs-body-color)";
        
        itemDiv.innerHTML = renderItem(item);

        itemDiv.addEventListener("mouseenter", function () {
          this.style.backgroundColor = "var(--bs-secondary-bg)";
        });
        itemDiv.addEventListener("mouseleave", function () {
          this.style.backgroundColor = "var(--bs-body-bg)";
        });

        itemDiv.addEventListener("click", function () {
          console.log(`[Autocomplete] Item selected in #${inputId}:`, item);
          onSelect(item);
          if (clearInputOnSelect) {
            inputElement.value = "";
          }
          resultsContainer.innerHTML = "";
          resultsContainer.style.display = "none";
        });
        resultsContainer.appendChild(itemDiv);
      });
    } else {
      resultsContainer.style.display = "block";
      const noResultsDiv = document.createElement("div");
      noResultsDiv.className = "p-2 text-muted";
      noResultsDiv.textContent = noResultsText;
      // console.log(`[Autocomplete] No results for '${searchValue}' in #${inputId}`); // Debug
      noResultsDiv.style.backgroundColor = "var(--bs-body-bg)";
      noResultsDiv.style.color = "var(--bs-body-color)";
      resultsContainer.appendChild(noResultsDiv);

      if (showOtherOptionOnNoResults) {
        const otherItemDiv = document.createElement("div");
        otherItemDiv.className = "autocomplete-item p-2 fw-bold"; // Style as an item, make bold
        otherItemDiv.style.cursor = "pointer";
        otherItemDiv.style.borderTop = "1px solid #dee2e6"; // Separator from "no results"
        otherItemDiv.style.backgroundColor = "var(--bs-body-bg)";
        otherItemDiv.style.color = "var(--bs-body-color)";
        otherItemDiv.textContent = otherOptionText;

        otherItemDiv.addEventListener("mouseenter", function () {
          this.style.backgroundColor = "var(--bs-secondary-bg)";
        });
        otherItemDiv.addEventListener("mouseleave", function () {
          this.style.backgroundColor = "var(--bs-body-bg)";
        });

        otherItemDiv.addEventListener("click", function () {
          console.log(`[Autocomplete] "Other" option selected in #${inputId}:`, otherOptionValue);
          onSelect(otherOptionValue);
          if (clearInputOnSelect) {
            inputElement.value = "";
          }
          resultsContainer.innerHTML = "";
          resultsContainer.style.display = "none";
        });
        resultsContainer.appendChild(otherItemDiv);
      }
    }
  });

  // Close results when clicking outside
  document.addEventListener("click", function (e) {
    if (e.target !== inputElement && !resultsContainer.contains(e.target)) {
      resultsContainer.style.display = "none";
    }
  });

  // Basic keyboard navigation (can be expanded)
  inputElement.addEventListener("keydown", function (e) {
    const items = resultsContainer.querySelectorAll(".autocomplete-item");
    if (items.length === 0 || resultsContainer.style.display === "none") return;

    let activeIndex = -1;
    items.forEach((item, index) => {
      if (item.classList.contains("active")) {
        activeIndex = index;
      }
    });

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (activeIndex < items.length - 1) {
        items[activeIndex + 1].classList.add("active");
        if (activeIndex >= 0) items[activeIndex].classList.remove("active");
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (activeIndex > 0) {
        items[activeIndex - 1].classList.add("active");
        items[activeIndex].classList.remove("active");
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex !== -1 && items[activeIndex]) {
        items[activeIndex].click();
      }
    }
  });
} 