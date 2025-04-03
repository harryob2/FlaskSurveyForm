console.log('Attachments script loaded');

document.addEventListener('DOMContentLoaded', function() {
    // Handle file upload previews
    const fileInput = document.querySelector('input[type="file"]');
    const descriptionInput = document.querySelector('#attachment_descriptions');
    
    if (fileInput) {
        fileInput.addEventListener('change', function() {
            const files = Array.from(this.files);
            const descriptions = Array(descriptionInput.value.split('\n'));
            
            // Update description placeholder
            descriptionInput.placeholder = `Enter ${files.length} description${files.length > 1 ? 's' : ''} (one per line)`;
            
            // Clear existing descriptions if file selection changes
            if (files.length !== descriptions.length) {
                descriptionInput.value = '';
            }
        });
    }
});
