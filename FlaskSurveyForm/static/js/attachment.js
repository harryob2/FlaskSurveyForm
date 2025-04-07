console.log("Attachments script loaded");

document.addEventListener("DOMContentLoaded", function () {
  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("file-input");
  const attachmentTable = document
    .getElementById("attachment-table")
    .querySelector("tbody");

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
});