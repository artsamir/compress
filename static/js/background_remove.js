document.addEventListener('DOMContentLoaded', () => {
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const loader = document.getElementById('loader');
    const resultSection = document.getElementById('result-section');
    const beforeImage = document.getElementById('before-image');
    const afterImage = document.getElementById('after-image');
    const slider = document.querySelector('.slider');
    const bgColor = document.getElementById('bg-color');
    const bgUpload = document.getElementById('bg-upload');
    const resetBtn = document.getElementById('reset-btn');
    const downloadBtn = document.getElementById('download-btn');
    const predefinedBgs = document.querySelectorAll('.bg-option');

    let originalSrc = '';
    let processedSrc = '';
    let currentBg = null;
    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');

    // Drag and Drop
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#f43f5e';
        uploadArea.classList.add('drag-active');
    });
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = '#2dd4bf';
        uploadArea.classList.remove('drag-active');
    });
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#2dd4bf';
        uploadArea.classList.remove('drag-active');
        const file = e.dataTransfer.files[0];
        if (file) uploadImage(file);
    });
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) uploadImage(file);
    });

    // Upload to Backend
    function uploadImage(file) {
        loader.classList.remove('hidden');
        uploadArea.classList.add('hidden');
        const formData = new FormData();
        formData.append('file', file);

        console.log("Uploading image:", file.name, file.size, "bytes");
        fetch('/tool/background-remove', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            console.log("Fetch response status:", response.status);
            return response.json();
        })
        .then(data => {
            console.log("Response from backend:", data);
            if (!data.original || !data.processed) {
                throw new Error("Invalid data from backend");
            }
            originalSrc = data.original;
            processedSrc = data.processed;
            showResult();
        })
        .catch(error => {
            console.error("Upload error:", error);
            alert(`Error processing image: ${error.message}`);
            resetUpload();
        });
    }

    // Show Result
    function showResult() {
        loader.classList.add('hidden');
        resultSection.classList.remove('hidden');
        beforeImage.style.backgroundImage = `url(${originalSrc})`;
        console.log("Original image set:", originalSrc.substring(0, 50) + "...");
        console.log("Processed image set:", processedSrc.substring(0, 50) + "...");
        updateAfterImage();
        initSlider();
    }

    // Update After Image
    function updateAfterImage() {
        let overlay = afterImage.querySelector('.overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'overlay';
            afterImage.appendChild(overlay);
        }

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = processedSrc;
        img.onload = () => {
            console.log("Processed image loaded:", img.width, img.height);
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw checkerboard only if no custom background
            if (!currentBg) {
                const patternSize = 20;
                for (let y = 0; y < canvas.height; y += patternSize) {
                    for (let x = 0; x < canvas.width; x += patternSize) {
                        ctx.fillStyle = ((x / patternSize + y / patternSize) % 2 === 0) ? "#eee" : "#ccc";
                        ctx.fillRect(x, y, patternSize, patternSize);
                    }
                }
            }

            // Draw processed image on top
            ctx.drawImage(img, 0, 0);

            // Apply custom background if selected
            if (currentBg) {
                if (currentBg.type === 'color') {
                    ctx.fillStyle = currentBg.value;
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0);
                    console.log("Applied color background:", currentBg.value);
                } else if (currentBg.type === 'image') {
                    const bgImg = new Image();
                    bgImg.crossOrigin = "anonymous";
                    bgImg.src = currentBg.value;
                    bgImg.onload = () => {
                        ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
                        ctx.drawImage(img, 0, 0);
                        overlay.style.backgroundImage = `url(${canvas.toDataURL()})`;
                        console.log("Applied background image:", currentBg.value);
                    };
                    return;
                }
            }

            overlay.style.backgroundImage = `url(${canvas.toDataURL()})`;
            console.log("Overlay updated with canvas data URL");
        };
        img.onerror = () => {
            console.error("Failed to load processed image:", processedSrc.substring(0, 50) + "...");
            alert("Error loading processed image");
        };
    }

    // Slider Functionality
    function initSlider() {
        let isDragging = false;
        slider.addEventListener('mousedown', () => {
            isDragging = true;
            console.log("Slider drag started");
        });
        document.addEventListener('mouseup', () => {
            isDragging = false;
            console.log("Slider drag ended");
        });
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const container = slider.parentElement;
            const rect = container.getBoundingClientRect();
            let x = e.clientX - rect.left;
            x = Math.max(0, Math.min(x, rect.width));
            const percent = (x / rect.width) * 100;
            slider.style.left = `${percent}%`;
            afterImage.style.clipPath = `inset(0 ${100 - percent}% 0 0)`;
            console.log("Slider position:", percent, "Clip path:", afterImage.style.clipPath);
            console.log("After image visibility:", afterImage.offsetWidth, afterImage.offsetHeight);
        });
    }

    // BG Color Change
    bgColor.addEventListener('input', (e) => {
        currentBg = { type: 'color', value: e.target.value };
        updateAfterImage();
    });

    // Predefined BG
    predefinedBgs.forEach(bg => {
        bg.addEventListener('click', () => {
            predefinedBgs.forEach(b => b.classList.remove('selected'));
            bg.classList.add('selected');
            currentBg = { type: 'image', value: bg.dataset.url };
            updateAfterImage();
        });
    });

    // Upload BG
    bgUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                currentBg = { type: 'image', value: ev.target.result };
                updateAfterImage();
            };
            reader.readAsDataURL(file);
        }
    });

    // Reset
    resetBtn.addEventListener('click', () => {
        currentBg = null;
        bgColor.value = '#ffffff';
        predefinedBgs.forEach(b => b.classList.remove('selected'));
        bgUpload.value = '';
        updateAfterImage();
    });

    // Download
    downloadBtn.addEventListener('click', () => {
        const a = document.createElement('a');
        a.href = processedSrc;
        a.download = 'processed_image.png';
        a.click();
        console.log("Download initiated for processed image");
    });

    // Reset Upload on Error
    function resetUpload() {
        loader.classList.add('hidden');
        uploadArea.classList.remove('hidden');
        resultSection.classList.add('hidden');
    }
});