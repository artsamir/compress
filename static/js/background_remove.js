document.addEventListener('DOMContentLoaded', () => {
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const loader = document.getElementById('loader');
    const resultSection = document.getElementById('result-section');
    const beforeImage = document.getElementById('before-image');
    const afterImage = document.getElementById('after-image');
    const slider = document.getElementById('slider');
    const bgColor = document.getElementById('bg-color');
    const bgUpload = document.getElementById('bg-upload');
    const resetBtn = document.getElementById('reset-btn');
    const downloadBtn = document.getElementById('download-btn');
    const predefinedBgs = document.querySelectorAll('.bg-option');

    let originalSrc = '';
    let processedSrc = '';
    let currentBg = null;  // {type: 'color'|'image', value: color or dataURL}
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
        fetch('/tool/background-remove', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) throw new Error(data.error);
            originalSrc = data.original;
            processedSrc = data.processed;
            showResult();
        })
        .catch(error => {
            console.error(error);
            alert('Error processing image');
            resetUpload();
        });
    }

    // Show Result
    function showResult() {
        loader.classList.add('hidden');
        resultSection.classList.remove('hidden');
        beforeImage.style.backgroundImage = `url(${originalSrc})`;
        updateAfterImage();
        initSlider();
    }

    // Update After Image (with BG)
    function updateAfterImage() {
        const img = new Image();
        img.src = processedSrc;
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (currentBg) {
                if (currentBg.type === 'color') {
                    ctx.fillStyle = currentBg.value;
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                } else if (currentBg.type === 'image') {
                    const bgImg = new Image();
                    bgImg.src = currentBg.value;
                    bgImg.onload = () => {
                        ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
                        ctx.drawImage(img, 0, 0);
                        afterImage.style.backgroundImage = `url(${canvas.toDataURL()})`;
                    };
                    return;
                }
            }
            ctx.drawImage(img, 0, 0);
            afterImage.style.backgroundImage = `url(${canvas.toDataURL()})`;
        };
    }

    // Slider Functionality
    function initSlider() {
        let isDragging = false;
        slider.addEventListener('mousedown', () => isDragging = true);
        document.addEventListener('mouseup', () => isDragging = false);
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const container = slider.parentElement;
            const rect = container.getBoundingClientRect();
            let x = e.clientX - rect.left;
            x = Math.max(0, Math.min(x, rect.width));
            const percent = (x / rect.width) * 100;
            slider.style.left = `${percent}%`;
            afterImage.style.clipPath = `inset(0 ${100 - percent}% 0 0)`;
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
        a.href = canvas.toDataURL('image/png');
        a.download = 'processed_image.png';
        a.click();
    });

    // Reset Upload on Error
    function resetUpload() {
        loader.classList.add('hidden');
        uploadArea.classList.remove('hidden');
        resultSection.classList.add('hidden');
    }
});