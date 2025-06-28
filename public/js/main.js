// Main JavaScript file for blog application

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initializeRichTextEditor();
    initializeLikeButtons();
    initializeImagePreviews();
    initializeFormValidation();
    initializeSearchFilters();
    initializeAnimations();
    initializeLightbox();
    
    // Standardize existing images on page load
    standardizeExistingImages();
});

// Rich Text Editor Initialization
function initializeRichTextEditor() {
    const editorContainer = document.getElementById('editor');
    if (editorContainer) {
        const quill = new Quill('#editor', {
            theme: 'snow',
            modules: {
                toolbar: [
                    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'color': [] }, { 'background': [] }],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    [{ 'indent': '-1'}, { 'indent': '+1' }],
                    [{ 'align': [] }],
                    ['blockquote', 'code-block'],
                    ['link', 'image'],
                    ['clean']
                ]
            },
            placeholder: 'Start writing your blog content...'
        });

        // Sync content with hidden textarea
        const contentInput = document.getElementById('content');
        if (contentInput) {
            // Set initial content
            if (contentInput.value) {
                quill.root.innerHTML = contentInput.value;
            }

            // Update textarea on content change
            quill.on('text-change', function() {
                // Standardize images before saving
                standardizeImages(quill.root);
                contentInput.value = quill.root.innerHTML;
            });
        }

        // Handle image insertion
        quill.getModule('toolbar').addHandler('image', function() {
            const input = document.createElement('input');
            input.setAttribute('type', 'file');
            input.setAttribute('accept', 'image/*');
            input.click();

            input.onchange = function() {
                const file = input.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        const range = quill.getSelection();
                        quill.insertEmbed(range.index, 'image', e.target.result);
                        
                        // Standardize the newly inserted image
                        setTimeout(() => {
                            standardizeImages(quill.root);
                        }, 100);
                    };
                    reader.readAsDataURL(file);
                }
            };
        });
    }
}

// Like Button Functionality
function initializeLikeButtons() {
    const likeButtons = document.querySelectorAll('.like-btn');
    
    likeButtons.forEach(button => {
        button.addEventListener('click', async function(e) {
            e.preventDefault();
            
            const blogId = this.dataset.blogId;
            const icon = this.querySelector('i');
            const countSpan = this.querySelector('.like-count');
            
            try {
                const response = await fetch(`/blogs/${blogId}/like`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });
                
                const data = await response.json();
                
                if (data.success) {
                    // Update UI
                    if (data.liked) {
                        icon.classList.remove('far');
                        icon.classList.add('fas');
                        this.classList.add('liked');
                    } else {
                        icon.classList.remove('fas');
                        icon.classList.add('far');
                        this.classList.remove('liked');
                    }
                    
                    if (countSpan) {
                        countSpan.textContent = data.likeCount;
                    }
                    
                    // Animate button
                    this.style.transform = 'scale(1.2)';
                    setTimeout(() => {
                        this.style.transform = 'scale(1)';
                    }, 150);
                }
            } catch (error) {
                console.error('Error toggling like:', error);
                showNotification('Error updating like status', 'error');
            }
        });
    });
}

// Image Preview Functionality
function initializeImagePreviews() {
    const imageInputs = document.querySelectorAll('input[type="file"][accept*="image"]');
    
    imageInputs.forEach(input => {
        input.addEventListener('change', function(e) {
            const files = e.target.files;
            const previewContainer = document.getElementById('image-previews');
            
            if (previewContainer) {
                previewContainer.innerHTML = '';
                
                Array.from(files).forEach((file, index) => {
                    if (file.type.startsWith('image/')) {
                        const reader = new FileReader();
                        
                        reader.onload = function(e) {
                            const previewDiv = document.createElement('div');
                            previewDiv.className = 'col-md-4 mb-3';
                            previewDiv.innerHTML = `
                                <div class="card">
                                    <img src="${e.target.result}" class="card-img-top" style="height: 200px; object-fit: cover;">
                                    <div class="card-body">
                                        <input type="text" class="form-control form-control-sm" 
                                               name="imageCaption_${index}" placeholder="Caption (optional)">
                                        <button type="button" class="btn btn-sm btn-danger mt-2 remove-image" 
                                                data-index="${index}">Remove</button>
                                    </div>
                                </div>
                            `;
                            previewContainer.appendChild(previewDiv);
                        };
                        
                        reader.readAsDataURL(file);
                    }
                });
                
                // Add remove functionality
                setTimeout(() => {
                    document.querySelectorAll('.remove-image').forEach(button => {
                        button.addEventListener('click', function() {
                            this.closest('.col-md-4').remove();
                        });
                    });
                }, 100);
            }
        });
    });
}

// Form Validation
function initializeFormValidation() {
    const forms = document.querySelectorAll('.needs-validation');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            if (!form.checkValidity()) {
                e.preventDefault();
                e.stopPropagation();
            }
            
            form.classList.add('was-validated');
        });
    });
    
    // Real-time validation for specific fields
    const emailInputs = document.querySelectorAll('input[type="email"]');
    emailInputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateEmail(this);
        });
    });
    
    const passwordInputs = document.querySelectorAll('input[name="password"]');
    passwordInputs.forEach(input => {
        input.addEventListener('input', function() {
            validatePassword(this);
        });
    });
}

// Search and Filter Functionality
function initializeSearchFilters() {
    const categoryFilter = document.getElementById('categoryFilter');
    const sortFilter = document.getElementById('sortFilter');
    const searchForm = document.querySelector('form[action="/search"]');
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function() {
            updateFilters();
        });
    }
    
    if (sortFilter) {
        sortFilter.addEventListener('change', function() {
            updateFilters();
        });
    }
    
    // Live search functionality
    const searchInput = document.querySelector('input[name="q"]');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                if (this.value.length > 2) {
                    performLiveSearch(this.value);
                }
            }, 500);
        });
    }
}

// Animation Initialization
function initializeAnimations() {
    // Fade in elements on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    }, observerOptions);
    
    // Observe all cards and content sections
    document.querySelectorAll('.card, .blog-card, .category-card').forEach(el => {
        observer.observe(el);
    });
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Utility Functions
function validateEmail(input) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(input.value);
    
    input.classList.toggle('is-valid', isValid);
    input.classList.toggle('is-invalid', !isValid);
    
    return isValid;
}

function validatePassword(input) {
    const password = input.value;
    const requirements = {
        length: password.length >= 6,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /\d/.test(password)
    };
    
    const strength = Object.values(requirements).filter(Boolean).length;
    const strengthIndicator = document.getElementById('password-strength');
    
    if (strengthIndicator) {
        const strengthTexts = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
        const strengthColors = ['danger', 'warning', 'info', 'primary', 'success'];
        
        strengthIndicator.textContent = strengthTexts[strength - 1] || 'Very Weak';
        strengthIndicator.className = `text-${strengthColors[strength - 1] || 'danger'}`;
    }
    
    input.classList.toggle('is-valid', strength >= 3);
    input.classList.toggle('is-invalid', strength < 3);
    
    return strength >= 3;
}

function updateFilters() {
    const category = document.getElementById('categoryFilter')?.value || 'all';
    const sort = document.getElementById('sortFilter')?.value || 'newest';
    const searchQuery = document.querySelector('input[name="q"]')?.value || '';
    
    const url = new URL(window.location);
    url.searchParams.set('category', category);
    url.searchParams.set('sort', sort);
    if (searchQuery) {
        url.searchParams.set('q', searchQuery);
    }
    
    window.location.href = url.toString();
}

function performLiveSearch(query) {
    // This could be enhanced with AJAX for live search results
    // Implementation for future enhancement
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Comment functionality
function initializeComments() {
    // Reply to comment
    document.querySelectorAll('.reply-btn').forEach(button => {
        button.addEventListener('click', function() {
            const commentId = this.dataset.commentId;
            const replyForm = document.getElementById(`reply-form-${commentId}`);
            
            if (replyForm) {
                replyForm.style.display = replyForm.style.display === 'none' ? 'block' : 'none';
            }
        });
    });
    
    // Edit comment
    document.querySelectorAll('.edit-comment-btn').forEach(button => {
        button.addEventListener('click', function() {
            const commentId = this.dataset.commentId;
            const commentText = document.getElementById(`comment-text-${commentId}`);
            const editForm = document.getElementById(`edit-form-${commentId}`);
            
            if (commentText && editForm) {
                commentText.style.display = 'none';
                editForm.style.display = 'block';
            }
        });
    });
    
    // Cancel edit
    document.querySelectorAll('.cancel-edit-btn').forEach(button => {
        button.addEventListener('click', function() {
            const commentId = this.dataset.commentId;
            const commentText = document.getElementById(`comment-text-${commentId}`);
            const editForm = document.getElementById(`edit-form-${commentId}`);
            
            if (commentText && editForm) {
                commentText.style.display = 'block';
                editForm.style.display = 'none';
            }
        });
    });
}

// Initialize comments when page loads
document.addEventListener('DOMContentLoaded', initializeComments);

// File upload progress
function showUploadProgress(input) {
    const progressContainer = document.getElementById('upload-progress');
    if (progressContainer && input.files.length > 0) {
        progressContainer.style.display = 'block';
        
        // Simulate upload progress (in real app, this would be actual progress)
        let progress = 0;
        const progressBar = progressContainer.querySelector('.progress-bar');
        
        const interval = setInterval(() => {
            progress += Math.random() * 20;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                setTimeout(() => {
                    progressContainer.style.display = 'none';
                }, 1000);
            }
            
            progressBar.style.width = progress + '%';
            progressBar.textContent = Math.round(progress) + '%';
        }, 200);
    }
}

// Theme toggle (if implementing dark mode)
function toggleTheme() {
    const currentTheme = localStorage.getItem('theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Update theme toggle button
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        icon.className = newTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }
}

// Initialize theme on page load
document.addEventListener('DOMContentLoaded', function() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl+S to save draft (if in editor)
    if (e.ctrlKey && e.key === 's') {
        const draftBtn = document.getElementById('save-draft-btn');
        if (draftBtn) {
            e.preventDefault();
            draftBtn.click();
        }
    }
    
    // Ctrl+Enter to publish (if in editor)
    if (e.ctrlKey && e.key === 'Enter') {
        const publishBtn = document.getElementById('publish-btn');
        if (publishBtn) {
            e.preventDefault();
            publishBtn.click();
        }
    }
    
    // Escape to close modals
    if (e.key === 'Escape') {
        const openModal = document.querySelector('.modal.show');
        if (openModal) {
            const modal = bootstrap.Modal.getInstance(openModal);
            modal.hide();
        }
    }
});

// Print functionality
function printBlog() {
    window.print();
}

// Share functionality
function shareBlog(url, title) {
    if (navigator.share) {
        navigator.share({
            title: title,
            url: url
        });
    } else {
        // Fallback to copying URL
        navigator.clipboard.writeText(url).then(() => {
            showNotification('Link copied to clipboard!', 'success');
        });
    }
}

// Reading progress indicator
function initializeReadingProgress() {
    const progressBar = document.getElementById('reading-progress');
    const article = document.querySelector('.blog-content');
    
    if (progressBar && article) {
        window.addEventListener('scroll', () => {
            const articleTop = article.offsetTop;
            const articleHeight = article.offsetHeight;
            const windowHeight = window.innerHeight;
            const scrollTop = window.scrollY;
            
            const progress = Math.min(
                100,
                Math.max(0, ((scrollTop - articleTop + windowHeight) / articleHeight) * 100)
            );
            
            progressBar.style.width = progress + '%';
        });
    }
}

// Initialize reading progress on blog pages
if (document.querySelector('.blog-content')) {
    document.addEventListener('DOMContentLoaded', initializeReadingProgress);
}

// Standardize images in the content
function standardizeImages(rootElement) {
    const images = rootElement.querySelectorAll('img');
    
    images.forEach(img => {
        // Standardization logic, e.g., set all images to a specific width
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        
        // Optionally, add a class for standardized images
        img.classList.add('standard-image');
    });
}

// Standardize images in blog content
function standardizeImages(container) {
    const images = container.querySelectorAll('img');
    
    images.forEach(img => {
        // Remove any existing size classes
        img.classList.remove('img-small', 'img-medium', 'img-large', 'img-full', 'img-left', 'img-right', 'img-center');
        
        // Apply default standardized styling
        img.style.maxWidth = '1000px';
        img.style.maxHeight = '550px';
        img.style.width = 'auto';
        img.style.height = 'auto';
        img.style.objectFit = 'cover';
        img.style.display = 'block';
        img.style.margin = '2rem auto';
        img.style.borderRadius = '12px';
        img.style.border = '1px solid #e2e8f0';
        img.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
        
        // Add loading attribute for better performance
        img.loading = 'lazy';
        
        // Add alt text if missing
        if (!img.alt || img.alt === '') {
            img.alt = 'Blog image';
        }
        
        // Add click handler for potential lightbox functionality
        img.style.cursor = 'pointer';
        img.setAttribute('data-lightbox', 'blog-images');
        
        // Check if image is too large and apply size class
        img.onload = function() {
            if (this.naturalWidth > 800) {
                this.classList.add('img-large');
            } else if (this.naturalWidth > 500) {
                this.classList.add('img-medium');
            } else {
                this.classList.add('img-small');
            }
        };
    });
}

// Apply standardization to existing blog content on page load
function standardizeExistingImages() {
    const blogContent = document.querySelector('.blog-content');
    if (blogContent) {
        standardizeImages(blogContent);
    }
}

// Simple lightbox functionality for blog images
function initializeLightbox() {
    // Create lightbox overlay
    const lightboxOverlay = document.createElement('div');
    lightboxOverlay.id = 'lightbox-overlay';
    lightboxOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        display: none;
        z-index: 9999;
        justify-content: center;
        align-items: center;
        cursor: pointer;
    `;
    
    const lightboxImg = document.createElement('img');
    lightboxImg.style.cssText = `
        max-width: 90%;
        max-height: 90%;
        object-fit: contain;
        border-radius: 12px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    `;
    
    lightboxOverlay.appendChild(lightboxImg);
    document.body.appendChild(lightboxOverlay);
    
    // Add click handlers to all blog images
    document.addEventListener('click', function(e) {
        if (e.target.matches('.blog-content img[data-lightbox]')) {
            lightboxImg.src = e.target.src;
            lightboxImg.alt = e.target.alt;
            lightboxOverlay.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    });
    
    // Close lightbox on overlay click
    lightboxOverlay.addEventListener('click', function() {
        this.style.display = 'none';
        document.body.style.overflow = 'auto';
    });
    
    // Close lightbox on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && lightboxOverlay.style.display === 'flex') {
            lightboxOverlay.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
}
