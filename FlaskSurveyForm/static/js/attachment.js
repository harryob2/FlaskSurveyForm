console.log("Attachments script loaded");

document.addEventListener("DOMContentLoaded", function () {
  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("file-input");
  const attachmentTable = document
    .getElementById("attachment-table")
    .querySelector("tbody");
  const form = document.getElementById("training-form");

  let attachments = [];

  // Handle file drag over
  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.classList.add("dragging");
  });

  // Handle drag leave
  dropzone.addEventListener("dragleave", () => {
    dropzone.classList.remove("dragging");
  });

  // Handle file drop
  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.classList.remove("dragging");
    handleFiles(e.dataTransfer.files);
  });

  // Handle file browse
  dropzone.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => handleFiles(fileInput.files));

  function handleFiles(files) {
    Array.from(files).forEach((file) => {
      const attachment = { file, description: "" };
      attachments.push(attachment);
      addAttachmentRow(attachment);
    });
    fileInput.value = ""; // Reset file input
    toggleAttachmentTable();
  }

  function addAttachmentRow(attachment) {
    const row = document.createElement("tr");

    // File name column
    const fileNameCell = document.createElement("td");
    fileNameCell.textContent = attachment.file.name;
    row.appendChild(fileNameCell);

    // Description column
    const descriptionCell = document.createElement("td");
    const descriptionInput = document.createElement("input");
    descriptionInput.type = "text";
    descriptionInput.className = "form-control";
    descriptionInput.placeholder = "Enter description";
    descriptionInput.addEventListener("input", (e) => {
      attachment.description = e.target.value;
    });
    descriptionCell.appendChild(descriptionInput);
    row.appendChild(descriptionCell);

    // Actions column
    const actionsCell = document.createElement("td");
    const removeButton = document.createElement("button");
    removeButton.className = "btn btn-danger btn-sm";
    removeButton.textContent = "Remove";
    removeButton.addEventListener("click", () => {
      attachments = attachments.filter((att) => att !== attachment);
      row.remove();
      toggleAttachmentTable();
    });
    actionsCell.appendChild(removeButton);
    row.appendChild(actionsCell);

    attachmentTable.appendChild(row);
  }

  function toggleAttachmentTable() {
    if (attachments.length > 0) {
      attachmentTable.parentElement.classList.remove("d-none");
    } else {
      attachmentTable.parentElement.classList.add("d-none");
    }
  }

  // Handle form submission
  if (form) {
    form.addEventListener("submit", function(e) {
      // Create hidden file input fields for each attachment
      attachments.forEach((attachment, index) => {
        // Create a hidden input for the file
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.style.display = 'none';
        fileInput.name = 'attachments';
        
        // Create a DataTransfer object to create a FileList
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(attachment.file);
        fileInput.files = dataTransfer.files;
        
        // Create a hidden input for the description
        const descInput = document.createElement('input');
        descInput.type = 'hidden';
        descInput.name = 'attachment_descriptions[]';
        descInput.value = attachment.description || '';
        
        // Append both to the form
        form.appendChild(fileInput);
        form.appendChild(descInput);
      });

      // Log what we're submitting
      console.log('Submitting form with', attachments.length, 'attachments');
      attachments.forEach((att, i) => {
        console.log(`Attachment ${i + 1}:`, att.file.name, 'Description:', att.description);
      });
    });
  }
});
