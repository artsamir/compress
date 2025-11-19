// Reduce Image Size JavaScript Functionality
class ImageReducer {
    constructor() {
        this.selectedFiles = [];
        console.log('ImageReducer initialized');
        this.initializeElements();
        this.attachEventListeners();
        this.setupDragAndDrop();
    }

    initializeElements() {
        this.dragDropArea = document.getElementById('dragDropArea');
        this.fileInput = document.getElementById('fileInput');
        this.gallerySection = document.getElementById('gallerySection');
        this.imageGallery = document.getElementById('imageGallery');
        this.controlsSection = document.getElementById('controlsSection');
        this.convertButton = document.getElementById('convertButton');
        this.resultsSection = document.getElementById('resultsSection');
        this.resultsContainer = document.getElementById('resultsContainer');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.presetSize = document.getElementById('presetSize');
        this.widthInput = document.getElementById('width');
        this.heightInput = document.getElementById('height');
        this.customControls = document.getElementById('customControls');
        this.downloadAllBtn = document.getElementById('downloadAllBtn');
        this.maxFileSizeSelect = document.getElementById('maxFileSize');
        this.customTargetSizeInput = document.getElementById('customTargetSize');
        this.sizeUnitSelect = document.getElementById('sizeUnit');

        console.log('Elements initialized:', {
            dragDropArea: !!this.dragDropArea,
            fileInput: !!this.fileInput,
            gallerySection: !!this.gallerySection
        });
    }

    setupDragAndDrop() {
        if (!this.dragDropArea) {
            console.error('Drag drop area not found!');
            return;
        }

        // Prevent default drag behaviors on document
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            document.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            }, false);
        });

        // Highlight drop area when item is dragged over it
        ['dragenter', 'dragover'].forEach(eventName => {
            this.dragDropArea.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.dragDropArea.classList.add('drag-over');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            this.dragDropArea.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.dragDropArea.classList.remove('drag-over');
            }, false);
        });

        // Handle dropped files
        this.dragDropArea.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Files dropped!');
            
            const files = Array.from(e.dataTransfer.files);
            console.log('Dropped files:', files);
            
            const imageFiles = files.filter(file => file.type.startsWith('image/'));
            console.log('Image files:', imageFiles);
            
            if (imageFiles.length > 0) {
                this.handleFileSelect(imageFiles);
            } else {
                alert('Please drop only image files (JPG, PNG, WEBP, GIF, BMP)');
            }
        }, false);
    }

    attachEventListeners() {
        // Click to open file dialog
        if (this.dragDropArea) {
            this.dragDropArea.addEventListener('click', () => {
                console.log('Drag area clicked');
                this.fileInput.click();
            });
        }

        // File input change
        if (this.fileInput) {
            this.fileInput.addEventListener('change', (e) => {
                console.log('File input changed');
                const files = Array.from(e.target.files).filter(file => file.type.startsWith('image/'));
                this.handleFileSelect(files);
            });
        }

        // Preset size change
        if (this.presetSize) {
            this.presetSize.addEventListener('change', () => this.handlePresetChange());
        }

        // Convert button
        if (this.convertButton) {
            this.convertButton.addEventListener('click', () => this.convertImages());
        }

        // Download all button
        if (this.downloadAllBtn) {
            this.downloadAllBtn.addEventListener('click', () => this.downloadAll());
        }
    }

    handleFileSelect(files) {
        if (!files || files.length === 0) {
            console.log('No files selected');
            return;
        }

        console.log('Processing files:', files);

        // Add new files to selectedFiles array
        Array.from(files).forEach(file => {
            if (file.type.startsWith('image/')) {
                const fileObj = {
                    file: file,
                    id: Date.now() + Math.random(),
                    name: file.name,
                    size: file.size,
                    url: URL.createObjectURL(file)
                };
                this.selectedFiles.push(fileObj);
                console.log('Added file:', fileObj.name);
            }
        });

        console.log('Total selected files:', this.selectedFiles.length);
        this.updateGallery();
        this.showControlsIfNeeded();
    }

    updateGallery() {
        if (this.selectedFiles.length === 0) {
            this.gallerySection.style.display = 'none';
            this.controlsSection.style.display = 'none';
            this.convertButton.disabled = true;
            return;
        }

        this.gallerySection.style.display = 'block';
        this.imageGallery.innerHTML = '';

        this.selectedFiles.forEach(fileObj => {
            const galleryItem = this.createGalleryItem(fileObj);
            this.imageGallery.appendChild(galleryItem);
        });
    }

    createGalleryItem(fileObj) {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.innerHTML = `
            <img src="${fileObj.url}" alt="${fileObj.name}" class="gallery-image">
            <div class="gallery-info">
                <div class="gallery-filename">${fileObj.name}</div>
                <div class="gallery-size">${this.formatFileSize(fileObj.size)}</div>
            </div>
            <button class="remove-btn" data-file-id="${fileObj.id}">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add event listener to the remove button
        const removeBtn = item.querySelector('.remove-btn');
        removeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.removeFile(fileObj.id);
        });
        
        return item;
    }

    removeFile(fileId) {
        this.selectedFiles = this.selectedFiles.filter(file => file.id !== fileId);
        this.updateGallery();
        this.showControlsIfNeeded();
    }

    showControlsIfNeeded() {
        if (this.selectedFiles.length > 0) {
            this.controlsSection.style.display = 'block';
            this.convertButton.disabled = false;
        } else {
            this.controlsSection.style.display = 'none';
            this.convertButton.disabled = true;
        }
    }

    handlePresetChange() {
        const presetValue = this.presetSize.value;
        
        if (presetValue) {
            // Disable custom width/height inputs
            this.widthInput.disabled = true;
            this.heightInput.disabled = true;
            this.customControls.style.opacity = '0.5';
            
            // Set preset values for reference
            const presets = {
                '1024x768': { width: 1024, height: 768 },
                '800x800': { width: 800, height: 800 },
                '800x600': { width: 800, height: 600 },
                '640x480': { width: 640, height: 480 },
                '350x270': { width: 350, height: 270 }
            };
            
            if (presets[presetValue]) {
                this.widthInput.value = presets[presetValue].width;
                this.heightInput.value = presets[presetValue].height;
            }
        } else {
            // Enable custom width/height inputs
            this.widthInput.disabled = false;
            this.heightInput.disabled = false;
            this.customControls.style.opacity = '1';
        }
    }

    async convertImages() {
        if (this.selectedFiles.length === 0) return;

        this.showLoading(true);

        try {
            const formData = new FormData();
            
            // Add files
            this.selectedFiles.forEach(fileObj => {
                formData.append('files[]', fileObj.file);
            });

            // Add settings
            const presetSize = this.presetSize.value;
            const width = this.widthInput.value;
            const height = this.heightInput.value;
            const maxFileSize = this.maxFileSizeSelect.value;
            const customTargetSize = this.customTargetSizeInput.value;
            const sizeUnit = this.sizeUnitSelect.value;

            if (presetSize) {
                formData.append('preset_size', presetSize);
            } else {
                if (width) formData.append('width', width);
                if (height) formData.append('height', height);
            }
            
            if (maxFileSize) {
                formData.append('max_file_size', maxFileSize);
            }
            
            if (customTargetSize) {
                formData.append('custom_target_size', customTargetSize);
                formData.append('size_unit', sizeUnit);
            }

            const response = await fetch('/api/reduce-images', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                this.displayResults(result.results);
                this.resultsSection.style.display = 'block';
                // Scroll to results
                this.resultsSection.scrollIntoView({ behavior: 'smooth' });
            } else {
                throw new Error(result.error || 'Conversion failed');
            }
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    displayResults(results) {
        this.resultsContainer.innerHTML = '';

        results.forEach(result => {
            const resultItem = this.createResultItem(result);
            this.resultsContainer.appendChild(resultItem);
        });
    }

    createResultItem(result) {
        const item = document.createElement('div');
        item.className = 'result-item';
        
        // Calculate size change
        const originalSize = result.original_size;
        const finalSize = result.final_size;
        const sizeDifference = finalSize - originalSize;
        const isReduced = sizeDifference < 0;
        const isIncreased = sizeDifference > 0;
        
        let changeText = '';
        let changeColor = '';
        
        if (isReduced) {
            // Size was reduced
            const reductionPercentage = ((originalSize - finalSize) / originalSize * 100).toFixed(1);
            changeText = `Reduced by ${reductionPercentage}% (${this.formatFileSize(Math.abs(sizeDifference))} saved)`;
            changeColor = '#52c41a'; // Green for reduction
        } else if (isIncreased) {
            // Size was increased
            const increasePercentage = ((finalSize - originalSize) / originalSize * 100).toFixed(1);
            changeText = `Increased by ${increasePercentage}% (${this.formatFileSize(sizeDifference)} added)`;
            changeColor = '#1890ff'; // Blue for increase
        } else {
            // Size stayed the same
            changeText = 'Size unchanged';
            changeColor = '#666';
        }
        
        item.innerHTML = `
            <div class="result-preview-container">
                <img src="${result.download_url}" alt="${result.output_filename}" class="result-preview">
            </div>
            <div class="result-info">
                <h4>${result.output_filename}</h4>
                <p style="color: ${changeColor}; font-weight: 600;">${changeText}</p>
            </div>
            <div class="result-size">
                <div>Original: ${this.formatFileSize(result.original_size)}</div>
                <div style="color: #52c41a; font-weight: bold;">Final: ${this.formatFileSize(result.final_size)}</div>
            </div>
            <div class="result-dimensions">
                <div>Original: ${result.original_dimensions}</div>
                <div>Final: ${result.final_dimensions}</div>
            </div>
            <button class="download-btn" onclick="window.location.href='${result.download_url}'">
                <i class="fas fa-download"></i> Download
            </button>
        `;
        
        return item;
    }

    downloadAll() {
        window.location.href = '/api/download-all';
    }

    showLoading(show) {
        this.loadingOverlay.style.display = show ? 'block' : 'none';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
}

// Initialize the image reducer when the page loads
let imageReducer;
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing ImageReducer...');
    imageReducer = new ImageReducer();
});