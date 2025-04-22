console.log("Attachments script loaded");

document.addEventListener("DOMContentLoaded", function () {
  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("file-input");
  const attachmentTable = document.getElementById("attachment-table").querySelector("tbody");
  const attachmentPreviewsContainer = document.getElementById("attachment-previews");
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
      addAttachmentPreview(attachment);
    });
  }

  // Improved drag and drop event handling
  ["dragenter", "dragover", "dragleave", "drop"].forEach(eventName => {
    dropzone.addEventListener(eventName, preventDefaults, false);
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  // Visual feedback for drag actions
  ["dragenter", "dragover"].forEach(eventName => {
    dropzone.addEventListener(eventName, highlight, false);
  });

  ["dragleave", "drop"].forEach(eventName => {
    dropzone.addEventListener(eventName, unhighlight, false);
  });

  function highlight() {
    dropzone.classList.add("dragging");
  }

  function unhighlight() {
    dropzone.classList.remove("dragging");
  }

  // Handle file drop
  dropzone.addEventListener("drop", (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
  });

  // Handle file browse
  dropzone.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => handleFiles(fileInput.files));

  function handleFiles(files) {
    Array.from(files).forEach(file => {
      const attachment = { file, description: "", isExisting: false };
      attachments.push(attachment);
      addAttachmentPreview(attachment);
    });
    fileInput.value = ""; // Reset file input
  }

  function addAttachmentPreview(attachment) {
    console.log("Adding attachment preview:", attachment);
    
    // Create preview container
    const previewContainer = document.createElement("div");
    previewContainer.className = "attachment-preview d-flex align-items-center gap-3 mb-2 p-2 border rounded";
    
    // Create thumbnail element
    const thumbnailEl = document.createElement("img");
    thumbnailEl.className = "rounded";
    thumbnailEl.style.width = "48px";
    thumbnailEl.style.height = "48px";
    thumbnailEl.style.objectFit = "cover";
    
    // Default icon for non-image files
    thumbnailEl.src = "/static/images/file-icon.png";
    thumbnailEl.alt = "File";
    
    // For new attachments, try to create a thumbnail if it's an image
    if (!attachment.isExisting && attachment.file) {
      const fileType = attachment.file.type;
      if (fileType.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
          thumbnailEl.src = e.target.result;
        };
        reader.readAsDataURL(attachment.file);
      }
    }
    
    // Create content container
    const contentContainer = document.createElement("div");
    contentContainer.className = "flex-grow-1";
    
    // Add filename
    const filenameEl = document.createElement("div");
    filenameEl.className = "attachment-filename small";
    filenameEl.textContent = attachment.isExisting ? attachment.filename : attachment.file.name;
    contentContainer.appendChild(filenameEl);
    
    // Add progress bar
    const progressContainer = document.createElement("div");
    progressContainer.className = "progress";
    progressContainer.style.height = "8px";
    
    const progressBar = document.createElement("div");
    progressBar.className = "progress-bar bg-success";
    progressBar.role = "progressbar";
    progressBar.style.width = "0%";
    progressBar.setAttribute("aria-valuenow", "0");
    progressBar.setAttribute("aria-valuemin", "0");
    progressBar.setAttribute("aria-valuemax", "100");
    
    progressContainer.appendChild(progressBar);
    contentContainer.appendChild(progressContainer);
    
    // Add description input
    const descriptionInput = document.createElement("input");
    descriptionInput.type = "text";
    descriptionInput.className = "form-control form-control-sm mt-1";
    descriptionInput.placeholder = "Description (optional)";
    descriptionInput.value = attachment.description || "";
    descriptionInput.addEventListener("input", (e) => {
      attachment.description = e.target.value;
    });
    contentContainer.appendChild(descriptionInput);
    
    // Create remove button
    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "btn btn-sm btn-outline-danger remove-attachment-btn";
    removeButton.innerHTML = "×";
    removeButton.setAttribute("aria-label", "Remove");
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
      previewContainer.remove();
    });
    
    // Assemble the preview element
    previewContainer.appendChild(thumbnailEl);
    previewContainer.appendChild(contentContainer);
    previewContainer.appendChild(removeButton);
    
    // Add to the document
    attachmentPreviewsContainer.appendChild(previewContainer);
    
    // Animate progress bar for visual feedback
    setTimeout(() => {
      progressBar.style.width = "100%";
      progressBar.setAttribute("aria-valuenow", "100");
    }, 50);
  }

  // Prepare attachments for form submission (to be called manually)
  window.prepareAttachmentsForSubmit = function() {
    // Clear any previously added temp inputs to avoid duplicates
    form.querySelectorAll('input[name="attachments"], input[name="attachment_descriptions[]"], input[name="update_attachment_descriptions[]"]').forEach(input => {
        input.remove();
    });

    // Create hidden fields for each attachment
    attachments.forEach((attachment, index) => {
        if (!attachment.isExisting) {
            // Create a hidden input for the file
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.style.display = 'none';
            fileInput.name = 'attachments';
            fileInput.setAttribute('data-attachment-temp', 'true');
            
            // Create a DataTransfer object to create a FileList
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(attachment.file);
            fileInput.files = dataTransfer.files;
            
            // Create a hidden input for the description
            const descInput = document.createElement('input');
            descInput.type = 'hidden';
            descInput.name = 'attachment_descriptions[]';
            descInput.value = attachment.description || '';
            descInput.setAttribute('data-attachment-temp', 'true');
            
            // Append both to the form
            form.appendChild(fileInput);
            form.appendChild(descInput);
        } else {
            // For existing attachments, just add the description update info
            const descInput = document.createElement('input');
            descInput.type = 'hidden';
            descInput.name = 'update_attachment_descriptions[]';
            descInput.setAttribute('data-attachment-temp', 'true');
            descInput.value = JSON.stringify({
                id: attachment.id,
                description: attachment.description
            });
            form.appendChild(descInput);
        }
    });

    console.log('Prepared form for submission with', attachments.length, 'attachments logic.');
  };
});
