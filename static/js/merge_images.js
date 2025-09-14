const upload1 = document.getElementById("image1");
const upload2 = document.getElementById("image2");
const mergeBtn = document.getElementById("mergeBtn");
const downloadBtn = document.getElementById("downloadBtn");
const sizeSelect = document.getElementById("sizeSelect");
const preview1 = document.getElementById("preview1");
const preview2 = document.getElementById("preview2");
const uploadBox1 = document.getElementById("uploadBox1");
const uploadBox2 = document.getElementById("uploadBox2");

const canvas = document.getElementById("mergeCanvas");
const ctx = canvas.getContext("2d");

let img1 = null, img2 = null;
let img1Ready = false, img2Ready = false;
let images = []; // global
let dragging = null;
let offsetX, offsetY;
let resizing = null;
let resizeDir = null;
const HANDLE_SIZE = 12;
let selected = null; // Track selected image
let isProcessing = false;

// --- Preview and Upload Logic ---
function checkReady() {
    mergeBtn.disabled = !(img1Ready && img2Ready);
}

function setupUpload(box, input, preview, setImg, setReady) {
    box.addEventListener('click', () => input.click());
    input.addEventListener('change', function() {
        if (input.files && input.files[0]) {
            images = []; // Reset images array so new merge will re-create it
            selected = null; // Reset selection
            const reader = new FileReader();
            reader.onload = function(e) {
                preview.src = e.target.result;
                preview.style.display = 'block';
                box.classList.add('uploaded');
            };
            reader.readAsDataURL(input.files[0]);
            setReady(false);
            loadImage(input.files[0], (image) => {
                setImg(image);
                setReady(true);
                checkReady();
            });
        }
    });

    // Drag and drop
    box.addEventListener('dragover', (e) => {
        e.preventDefault();
        box.classList.add('dragover');
    });
    box.addEventListener('dragleave', (e) => {
        e.preventDefault();
        box.classList.remove('dragover');
    });
    box.addEventListener('drop', (e) => {
        e.preventDefault();
        box.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file) {
            input.files = e.dataTransfer.files;
            const event = new Event('change');
            input.dispatchEvent(event);
        }
    });
}

function loadImage(file, callback) {
    const formData = new FormData();
    formData.append("file", file);

    fetch("/api/merge-remove", { 
        method: "POST", 
        body: formData 
    })
    .then(res => res.json())
    .then(data => {
        if (data.processed) {
            const image = new Image();
            image.onload = () => {
                callback(image);
                checkReady();
                // Remove auto-trigger
                // if (img1Ready && img2Ready) {
                //     mergeBtn.click();
                // }
            };
            image.src = data.processed;
        }
    })
    .catch(err => {
        console.error("Error:", err);
        alert("Failed to process image. Please try again.");
    });
}

setupUpload(uploadBox1, upload1, preview1, (image) => { img1 = image; }, (ready) => { img1Ready = ready; });
setupUpload(uploadBox2, upload2, preview2, (image) => { img2 = image; }, (ready) => { img2Ready = ready; });

const previewArea = document.getElementById('previewArea');
const previewLoading = document.getElementById('previewLoading');
const canvasWrapper = document.querySelector('.canvas-wrapper');

// Hide preview area initially
// previewArea.style.display = 'none';


// --- Merge and Canvas Logic ---
mergeBtn.addEventListener("click", () => {
    if (!img1Ready || !img2Ready) {
        alert("Please upload both images first!");
        return;
    }

    // Show loading immediately
    if (previewLoading) {
        previewLoading.style.display = 'flex';
    }
    
    try {
        // Set canvas size first
        const [w, h] = sizeSelect.value.split("x").map(dim => Math.round(dim * MM_TO_PX));
        canvas.width = w;
        canvas.height = h;

        // Scale the canvas for display
        const maxH = window.innerWidth < 600 ? 300 : 400;
        const scale = maxH / h;
        canvas.style.width = (w * scale) + "px";
        canvas.style.height = (h * scale) + "px";

        // Create or update images array with proper positioning
        images = [
            { 
                img: img1, 
                x: Math.round(w * 0.1),  // 10% from left
                y: Math.round(h * 0.1),  // 10% from top
                w: Math.round(w * 0.35), // 35% of width
                h: Math.round(h * 0.8)   // 80% of height
            },
            { 
                img: img2, 
                x: Math.round(w * 0.55), // 55% from left
                y: Math.round(h * 0.1),  // 10% from top
                w: Math.round(w * 0.35), // 35% of width
                h: Math.round(h * 0.8)   // 80% of height
            }
        ];

        // Select first image by default to show handles
        selected = images[0];

        // Draw the canvas
        drawCanvas();
        
        // Enable download button
        downloadBtn.disabled = false;

    } catch (error) {
        console.error('Merge error:', error);
        alert('Failed to merge images. Please try again.');
    } finally {
        // Hide loading
        if (previewLoading) {
            previewLoading.style.display = 'none';
        }
    }
});

// Background color and image logic
const bgColorPicker = document.getElementById('bgColorPicker');
const bgImageInput = document.getElementById('bgImageInput');
const bgImageBtn = document.getElementById('bgImageBtn');
let bgImage = null;
let bgColor = 'transparent'; // instead of '#ffffff'

if (bgColorPicker) {
    bgColorPicker.addEventListener('input', function() {
        bgColor = this.value;
        bgImage = null;
        drawCanvas();
    });
}
if (bgImageBtn && bgImageInput) {
    bgImageBtn.addEventListener('click', () => bgImageInput.click());
    bgImageInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new window.Image();
                img.onload = function() {
                    bgImage = img;
                    drawCanvas();
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(this.files[0]);
        }
    });
}

// --- Drawing and Handles ---
function getCanvasCoords(e) {
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if (e.touches && e.touches.length) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }
    // Scale mouse/touch position to canvas coordinates
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
    };
}

function getHandleAt(mx, my, obj) {
    const handles = [
        { dir: "nw", x: obj.x, y: obj.y },
        { dir: "ne", x: obj.x + obj.w, y: obj.y },
        { dir: "sw", x: obj.x, y: obj.y + obj.h },
        { dir: "se", x: obj.x + obj.w, y: obj.y + obj.h }
    ];
    
    for (let h of handles) {
        if (Math.abs(mx - h.x) <= HANDLE_SIZE/2 && 
            Math.abs(my - h.y) <= HANDLE_SIZE/2) {
            return h.dir;
        }
    }
    return null;
}

function drawHandles(obj) {
    const handles = [
        [obj.x, obj.y],
        [obj.x + obj.w, obj.y],
        [obj.x, obj.y + obj.h],
        [obj.x + obj.w, obj.y + obj.h]
    ];
    ctx.save();
    ctx.fillStyle = "#007bff";
    handles.forEach(([x, y]) => {
        ctx.fillRect(x - HANDLE_SIZE/2, y - HANDLE_SIZE/2, HANDLE_SIZE, HANDLE_SIZE);
    });
    ctx.restore();
}

function drawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Only draw background if specifically set
    if (bgImage) {
        ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
    } else if (bgColor !== 'transparent') {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    // Otherwise leave transparent for checkboard to show through
    
    images.forEach(obj => {
        ctx.drawImage(obj.img, obj.x, obj.y, obj.w, obj.h);
        if (obj === selected) {
            drawHandles(obj);
        }
    });
}

// --- Mouse events for move/resize/select ---
let isMouseDown = false;
let isTouching = false;

// Mouse events
canvas.addEventListener("mousedown", e => {
    const { x: mx, y: my } = getCanvasCoords(e);
    let found = false;

    for (let i = images.length - 1; i >= 0; i--) {
        let obj = images[i];
        let handle = getHandleAt(mx, my, obj);
        
        if (handle) {
            selected = obj;
            resizing = obj;
            resizeDir = handle;
            offsetX = mx - obj.x;
            offsetY = my - obj.y;
            found = true;
            break;
        }
        
        if (mx >= obj.x && mx <= obj.x + obj.w && 
            my >= obj.y && my <= obj.y + obj.h) {
            selected = obj;
            dragging = obj;
            offsetX = mx - obj.x;
            offsetY = my - obj.y;
            found = true;
            break;
        }
    }

    if (!found) {
        selected = null;
    }
    drawCanvas();
});

canvas.addEventListener("mousemove", e => {
    const { x: mx, y: my } = getCanvasCoords(e);
    
    if (resizing) {
        let obj = resizing;
        let minSize = 30;
        
        switch (resizeDir) {
            case "nw":
                obj.w += obj.x - mx;
                obj.h += obj.y - my;
                obj.x = mx;
                obj.y = my;
                break;
            case "ne":
                obj.w = mx - obj.x;
                obj.h += obj.y - my;
                obj.y = my;
                break;
            case "sw":
                obj.w += obj.x - mx;
                obj.x = mx;
                obj.h = my - obj.y;
                break;
            case "se":
                obj.w = mx - obj.x;
                obj.h = my - obj.y;
                break;
        }
        
        obj.w = Math.max(minSize, obj.w);
        obj.h = Math.max(minSize, obj.h);
        drawCanvas();
    }
    
    if (dragging) {
        dragging.x = mx - offsetX;
        dragging.y = my - offsetY;
        drawCanvas();
    }
});

canvas.addEventListener("mouseup", () => {
    dragging = null;
    resizing = null;
    resizeDir = null;
    drawCanvas();
});

// Touch events
canvas.addEventListener("touchstart", e => {
    e.preventDefault();
    const { x: mx, y: my } = getCanvasCoords(e);
    let found = false;

    for (let i = images.length - 1; i >= 0; i--) {
        let obj = images[i];
        let handle = getHandleAt(mx, my, obj);
        
        if (handle) {
            selected = obj;
            resizing = obj;
            resizeDir = handle;
            offsetX = mx - obj.x;
            offsetY = my - obj.y;
            found = true;
            break;
        }
        
        if (mx >= obj.x && mx <= obj.x + obj.w && 
            my >= obj.y && my <= obj.y + obj.h) {
            selected = obj;
            dragging = obj;
            offsetX = mx - obj.x;
            offsetY = my - obj.y;
            found = true;
            break;
        }
    }

    if (!found) {
        selected = null;
    }
    drawCanvas();
}, { passive: false });

canvas.addEventListener("touchmove", e => {
    e.preventDefault();
    const { x: mx, y: my } = getCanvasCoords(e);
    
    if (resizing) {
        let obj = resizing;
        let minSize = 30;
        
        switch (resizeDir) {
            case "nw":
                obj.w += obj.x - mx;
                obj.h += obj.y - my;
                obj.x = mx;
                obj.y = my;
                break;
            case "ne":
                obj.w = mx - obj.x;
                obj.h += obj.y - my;
                obj.y = my;
                break;
            case "sw":
                obj.w += obj.x - mx;
                obj.x = mx;
                obj.h = my - obj.y;
                break;
            case "se":
                obj.w = mx - obj.x;
                obj.h = my - obj.y;
                break;
        }
        
        obj.w = Math.max(minSize, obj.w);
        obj.h = Math.max(minSize, obj.h);
        drawCanvas();
    }
    
    if (dragging) {
        dragging.x = mx - offsetX;
        dragging.y = my - offsetY;
        drawCanvas();
    }
}, { passive: false });

canvas.addEventListener("touchend", e => {
    e.preventDefault();
    dragging = null;
    resizing = null;
    resizeDir = null;
    drawCanvas();
}, { passive: false });

// --- Download ---
downloadBtn.addEventListener("click", () => {
    try {
        // Get the exact size in pixels based on mm selection
        const [widthMM, heightMM] = sizeSelect.value.split("x").map(Number);
        const widthPX = Math.round(widthMM * MM_TO_PX);
        const heightPX = Math.round(heightMM * MM_TO_PX);

        // Create a temporary canvas at the exact required size
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = widthPX;
        tempCanvas.height = heightPX;
        const tempCtx = tempCanvas.getContext('2d');

        // Clear with transparency
        tempCtx.clearRect(0, 0, widthPX, heightPX);

        // Draw background if set
        if (bgImage) {
            tempCtx.drawImage(bgImage, 0, 0, widthPX, heightPX);
        } else if (bgColor !== 'transparent') {
            tempCtx.fillStyle = bgColor;
            tempCtx.fillRect(0, 0, widthPX, heightPX);
        }

        // Draw images at their exact positions and sizes
        images.forEach(obj => {
            // Calculate actual positions and sizes relative to the passport/ID size
            const x = Math.round((obj.x / canvas.width) * widthPX);
            const y = Math.round((obj.y / canvas.height) * heightPX);
            const w = Math.round((obj.w / canvas.width) * widthPX);
            const h = Math.round((obj.h / canvas.height) * heightPX);
            
            tempCtx.drawImage(obj.img, x, y, w, h);
        });

        // Create and trigger download with correct size
        const dataUrl = tempCanvas.toDataURL('image/png', 1.0);
        const link = document.createElement('a');
        link.download = `merged_${widthMM}x${heightMM}mm.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

    } catch (error) {
        console.error('Download error:', error);
        alert('Failed to download. Please try again.');
    }
});

document.addEventListener('DOMContentLoaded', function() {
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  navToggle?.addEventListener('click', function() {
    navLinks.classList.toggle('open');
  });
});

// Update your size select options in HTML first to use millimeters
// <select id="sizeSelect">
//     <option value="35x45">Passport (35x45 mm)</option>
//     <option value="20x25">Photo ID (20x25 mm)</option>
// </select>

// Add this conversion helper
const MM_TO_PX = 11.811; // 1mm = 11.811px at 300dpi

function setCanvasSizeFromSelect() {
    // Get exact size in pixels
    let [widthMM, heightMM] = sizeSelect.value.split("x").map(Number);
    const widthPX = Math.round(widthMM * MM_TO_PX);
    const heightPX = Math.round(heightMM * MM_TO_PX);

    // Set canvas actual size
    canvas.width = widthPX;
    canvas.height = heightPX;

    // Scale for display
    let scale;
    if (window.innerWidth < 600) {
        // Mobile: Scale to fit width with padding
        const maxWidth = window.innerWidth - 32;
        scale = maxWidth / widthPX;
    } else {
        // Desktop: Scale to reasonable height
        const maxHeight = 400;
        scale = maxHeight / heightPX;
    }

    // Apply visual scaling
    canvas.style.width = Math.round(widthPX * scale) + "px";
    canvas.style.height = Math.round(heightPX * scale) + "px";

    // Update image positions if they exist
    if (images.length === 2) {
        images.forEach(img => {
            // Keep relative positions
            img.x = Math.round(img.x * (widthPX / canvas.width));
            img.y = Math.round(img.y * (heightPX / canvas.height));
            img.w = Math.round(img.w * (widthPX / canvas.width));
            img.h = Math.round(img.h * (heightPX / canvas.height));
        });
        drawCanvas();
    }
}

// Call this on merge and on size change
sizeSelect.addEventListener("change", () => {
    setCanvasSizeFromSelect();
    drawCanvas();
});

// helper: send file to background-remove API and return an HTMLImageElement
function processFileAndLoadImage(file) {
    const formData = new FormData();
    formData.append("file", file);
    return fetch("/api/merge-remove", { method: "POST", body: formData })
        .then(res => {
            if (!res.ok) throw new Error("Network response was not ok");
            return res.json();
        })
        .then(data => {
            if (!data.processed) throw new Error("Processing failed");
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = data.processed;
            });
        });
}

// single merge handler — one click to process & merge
mergeBtn.addEventListener("click", async () => {
    if (isProcessing) return;
    // require both files present
    const file1 = upload1.files && upload1.files[0];
    const file2 = upload2.files && upload2.files[0];
    if (!file1 || !file2) {
        alert("Please upload both images.");
        return;
    }

    isProcessing = true;
    mergeBtn.disabled = true;
    downloadBtn.disabled = true;
    if (previewLoading) previewLoading.style.display = "flex";

    try {
        // process files only if not already ready
        if (!img1Ready) {
            img1 = await processFileAndLoadImage(file1);
            img1Ready = true;
            if (preview1) preview1.src = img1.src;
        }
        if (!img2Ready) {
            img2 = await processFileAndLoadImage(file2);
            img2Ready = true;
            if (preview2) preview2.src = img2.src;
        }

        // set canvas size & scale for preview
        setCanvasSizeFromSelect();
        const [w, h] = sizeSelect.value.split("x").map(dim => Math.round(dim * MM_TO_PX));

        // create images array (do not recreate on subsequent merges if you want to preserve manual adjustments)
        images = [
            { img: img1, x: Math.round(w * 0.1), y: Math.round(h * 0.1), w: Math.round(w * 0.35), h: Math.round(h * 0.8) },
            { img: img2, x: Math.round(w * 0.55), y: Math.round(h * 0.1), w: Math.round(w * 0.35), h: Math.round(h * 0.8) }
        ];
        selected = images[0];

        // draw merged preview (transparent background preserved in drawCanvas)
        drawCanvas();

        // enable download
        downloadBtn.disabled = false;
    } catch (err) {
        console.error("Merge/process error:", err);
        alert("Failed to process images. Try again.");
    } finally {
        if (previewLoading) previewLoading.style.display = "none";
        isProcessing = false;
        mergeBtn.disabled = false;
    }
});


