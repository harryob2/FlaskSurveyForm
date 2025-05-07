import { initAutocomplete } from './autocomplete.js';

document.addEventListener("DOMContentLoaded", function () {
    console.log("[FormSetup] DOMContentLoaded, initializing components...");

    // Initialize Training Catalog Search
    const trainingCatalogSearchInput = document.getElementById("training_catalog_search_input");
    const trainingCatalogSearchResultsDivId = "training_catalog_search_results";
    
    if (trainingCatalogSearchInput && document.getElementById(trainingCatalogSearchResultsDivId)) {
        console.log("[FormSetup] Setting up Training Catalog Search.");
        initAutocomplete({
            inputId: "training_catalog_search_input",
            resultsId: trainingCatalogSearchResultsDivId,
            lookupUrl: "/api/lookup/trainings",
            fuseKeys: ['name', 'area', 'course_code'], // searchable fields from catalog
            renderItem: (training) => {
                if (training.id === 0 && training.name === "Other (Manual Entry)") { // Special rendering for "Other"
                    return `<div class="fw-bold p-2">${training.name}</div>`;
                }
                return `
                    <div class="fw-medium">${training.name}</div>
                    <div class="text-muted small">${training.area || ''} ${training.course_code ? `(${training.course_code})` : ''}</div>
                `;
            },
            onSelect: (training) => {
                const trainingDescField = document.getElementById('training_description');
                const trainingIdField = document.getElementById('training_catalog_id'); 

                if (trainingIdField) {
                    trainingIdField.value = training.id;
                    trainingIdField.dispatchEvent(new Event('change'));
                }

                if (trainingDescField) {
                    if (training.id === 0) { // "Other" selected
                        trainingDescField.value = ""; 
                        trainingDescField.placeholder = "Please describe the training (course title, area, etc.)";
                    } else {
                        trainingDescField.value = training.name; 
                        trainingDescField.placeholder = ""; 
                    }
                }
                console.log(`[TrainingCatalogSearch] Selected: ID=${training.id}, Name=${training.name}`);
            },
            clearInputOnSelect: true, 
            showOtherOptionOnNoResults: true,
            noResultsText: "No matching trainings. Select 'Other' to enter manually.",
            otherOptionText: "Other (Manually Enter Training Details)",
            otherOptionValue: { id: 0, name: "Other (Manual Entry)" }
        });
    } else {
        console.warn("[FormSetup] Training Catalog Search input or results container not found. Skipping init.");
    }

    // Future: Other form-wide component initializations can go here.
    // For example, if you had a general date picker setup not specific to one form element.
}); 