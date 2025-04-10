console.log("Attachments script loaded");

document.addEventListener("DOMContentLoaded", function () {
  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("file-input");
  const attachmentTable = document
    .getElementById("attachment-table")
    .querySelector("tbody");
  const form = document.getElementById("training-form");

  let attachments = [];

  // Initialize existing attachments if any
  const existingAttachments = document.querySelectorAll('.existing-attachment');
  console.log("Found existing attachments elements:", existingAttachments.length);
  
  if (existingAttachments.length > 0) {
    console.log("Processing existing attachments");
    existingAttachments.forEach(att => {
      console.log("Attachment data:", {
        id: att.dataset.id,
        filename: att.dataset.filename,
        description: att.dataset.description
      });
      
      const attachment = {
        id: att.dataset.id,
        filename: att.dataset.filename,
        description: att.dataset.description || '',
        isExisting: true
      };
      attachments.push(attachment);
      addAttachmentRow(attachment);
    });
    // Make sure the table is visible if we have existing attachments
    toggleAttachmentTable();
  }

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
      const attachment = { file, description: "", isExisting: false };
      attachments.push(attachment);
      addAttachmentRow(attachment);
    });
    fileInput.value = ""; // Reset file input
    toggleAttachmentTable();
  }

  function addAttachmentRow(attachment) {
    console.log("Adding attachment row:", attachment);
    const row = document.createElement("tr");

    // File name column
    const fileNameCell = document.createElement("td");
    if (attachment.isExisting) {
      fileNameCell.textContent = attachment.filename;
    } else {
      fileNameCell.textContent = attachment.file.name;
    }
    row.appendChild(fileNameCell);

    // Description column
    const descriptionCell = document.createElement("td");
    const descriptionInput = document.createElement("input");
    descriptionInput.type = "text";
    descriptionInput.className = "form-control";
    descriptionInput.placeholder = "Enter description";
    descriptionInput.value = attachment.description || "";
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
      if (attachment.isExisting) {
        // Add a hidden input to mark this attachment for deletion
        const deleteInput = document.createElement('input');
        deleteInput.type = 'hidden';
        deleteInput.name = 'delete_attachments[]';
        deleteInput.value = attachment.id;
        form.appendChild(deleteInput);
      }
      attachments = attachments.filter((att) => att !== attachment);
      row.remove();
      toggleAttachmentTable();
    });
    actionsCell.appendChild(removeButton);
    row.appendChild(actionsCell);

    attachmentTable.appendChild(row);
  }

  function toggleAttachmentTable() {
    console.log("Toggling attachment table. Attachments count:", attachments.length);
    if (attachments.length > 0) {
      attachmentTable.parentElement.classList.remove("d-none");
    } else {
      attachmentTable.parentElement.classList.add("d-none");
    }
  }

  // Handle form submission
  if (form) {
    form.addEventListener("submit", function(e) {
      // Create hidden file input fields for each new attachment
      attachments.forEach((attachment, index) => {
        if (!attachment.isExisting) {
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
        } else {
          // For existing attachments, just update the description if changed
          const descInput = document.createElement('input');
          descInput.type = 'hidden';
          descInput.name = 'update_attachment_descriptions[]';
          descInput.value = JSON.stringify({
            id: attachment.id,
            description: attachment.description
          });
          form.appendChild(descInput);
        }
      });

      // Log what we're submitting
      console.log('Submitting form with', attachments.length, 'attachments');
      attachments.forEach((att, i) => {
        console.log(`Attachment ${i + 1}:`, att.isExisting ? att.filename : att.file.name, 'Description:', att.description);
      });
    });
  }
});
