/* ========================================
   CUTCOMPRESS TOOLS - COMMON JAVASCRIPT
   Theme Toggle | Utilities | Animations
======================================== */

// Theme Management
function initTheme() {
    const savedTheme = localStorage.getItem('cutcompress-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('cutcompress-theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const toggle = document.querySelector('.theme-toggle');
    if (toggle) {
        const sunIcon = toggle.querySelector('.icon-sun');
        const moonIcon = toggle.querySelector('.icon-moon');
        if (theme === 'dark') {
            if (sunIcon) sunIcon.style.display = 'inline';
            if (moonIcon) moonIcon.style.display = 'none';
        } else {
            if (sunIcon) sunIcon.style.display = 'none';
            if (moonIcon) moonIcon.style.display = 'inline';
        }
    }
}

// Initialize theme on load
document.addEventListener('DOMContentLoaded', initTheme);

// Copy to Clipboard
function copyToClipboard(text, button) {
    navigator.clipboard.writeText(text).then(() => {
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i> Copied!';
        button.classList.add('copied');
        setTimeout(() => {
            button.innerHTML = originalText;
            button.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy:', err);
        showAlert('Failed to copy to clipboard', 'error');
    });
}

// Show Alert
function showAlert(message, type = 'info') {
    const alertsContainer = document.querySelector('.alerts-container') || createAlertsContainer();
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    alert.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i> ${message}`;
    alertsContainer.appendChild(alert);
    
    setTimeout(() => {
        alert.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => alert.remove(), 300);
    }, 4000);
}

function createAlertsContainer() {
    const container = document.createElement('div');
    container.className = 'alerts-container';
    container.style.cssText = 'position: fixed; top: 80px; left: 50%; transform: translateX(-50%); z-index: 1000; width: 90%; max-width: 500px;';
    document.body.appendChild(container);
    return container;
}

// File Upload Utilities
function setupDragAndDrop(dropZone, fileInputOrCallback, handleFiles) {
    // Support two calling patterns:
    // 1. setupDragAndDrop(dropZone, fileInput, handleFiles) - original
    // 2. setupDragAndDrop(dropZone, callback) - simplified for drop-only
    
    let fileInput = null;
    let callback = null;
    
    if (typeof fileInputOrCallback === 'function') {
        // Pattern 2: callback function passed directly
        callback = fileInputOrCallback;
    } else {
        // Pattern 1: file input element passed
        fileInput = fileInputOrCallback;
        callback = (files) => handleFiles(files);
    }
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.add('dragover');
        });
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.remove('dragover');
        });
    });
    
    dropZone.addEventListener('drop', (e) => {
        callback(e);
    });
    
    if (fileInput) {
        dropZone.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', () => callback({ dataTransfer: { files: fileInput.files } }));
    }
}

// Format File Size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Download File
function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Download Canvas as Image
function downloadCanvas(canvas, filename, format = 'png') {
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL(`image/${format}`, 1.0);
    link.click();
}

// Progress Bar
function updateProgress(percent, containerId = 'progressContainer') {
    const container = document.getElementById(containerId);
    const fill = container?.querySelector('.progress-fill');
    const text = container?.querySelector('.progress-text');
    
    if (container) {
        container.classList.add('active');
        if (fill) fill.style.width = `${percent}%`;
        if (text) text.textContent = `${Math.round(percent)}%`;
    }
}

function hideProgress(containerId = 'progressContainer') {
    const container = document.getElementById(containerId);
    if (container) {
        container.classList.remove('active');
    }
}

// Show/Hide Loading
function showLoading(containerId = 'loadingSpinner') {
    const spinner = document.getElementById(containerId);
    if (spinner) spinner.classList.add('active');
}

function hideLoading(containerId = 'loadingSpinner') {
    const spinner = document.getElementById(containerId);
    if (spinner) spinner.classList.remove('active');
}

// Tab Switching
function setupTabs(tabsContainer) {
    const tabs = tabsContainer.querySelectorAll('.tab');
    const contents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;
            
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            document.getElementById(target)?.classList.add('active');
        });
    });
}

// Validate Email
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Debounce Function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Load Image as Promise
function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

// Generate Random ID
function generateId(length = 8) {
    return Math.random().toString(36).substring(2, 2 + length);
}

// Export functions for use in other scripts
window.CutcompressTools = {
    initTheme,
    toggleTheme,
    copyToClipboard,
    showAlert,
    setupDragAndDrop,
    formatFileSize,
    downloadFile,
    downloadCanvas,
    updateProgress,
    hideProgress,
    showLoading,
    hideLoading,
    setupTabs,
    isValidEmail,
    debounce,
    loadImage,
    generateId
};
