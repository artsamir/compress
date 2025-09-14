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

    fetch("/api/merge-remove", { method: "POST", body: formData })
        .then(res => res.json())
        .then(data => {
            if (data.processed) {
                const image = new Image();
                image.onload = () => {
                    callback(image);
                    if (callback === ((img) => { img1 = img; img1Ready = true; checkReady(); })) img1Ready = true;
                    if (callback === ((img) => { img2 = img; img2Ready = true; checkReady(); })) img2Ready = true;
                    checkReady();
                };
                image.src = data.processed;
            }
        })
        .catch(err => console.error("Error:", err));
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
        alert("Please wait until both images are processed!");
        return;
    }
    setCanvasSizeFromSelect();
    let [w, h] = sizeSelect.value.split("x").map(Number);

    // Only create images array if it's empty (or after new upload)
    if (images.length !== 2) {
        images = [
            { img: img1, x: w * 0.1, y: h * 0.1, w: w * 0.35, h: h * 0.8 },
            { img: img2, x: w * 0.55, y: h * 0.1, w: w * 0.35, h: h * 0.8 }
        ];
        selected = images[0]; // Select first image by default so handles show
    }

    previewLoading.style.display = 'flex';
    setTimeout(() => {
        previewLoading.style.display = 'none';
        drawCanvas();
        downloadBtn.disabled = false;
    }, 900);
});

// Background color and image logic
const bgColorPicker = document.getElementById('bgColorPicker');
const bgImageInput = document.getElementById('bgImageInput');
const bgImageBtn = document.getElementById('bgImageBtn');
let bgImage = null;
let bgColor = '#ffffff';

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
function drawHandles(obj) {
    const handles = [
        [obj.x, obj.y], // top-left
        [obj.x + obj.w, obj.y], // top-right
        [obj.x, obj.y + obj.h], // bottom-left
        [obj.x + obj.w, obj.y + obj.h] // bottom-right
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
    if (bgImage) {
        ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
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
    let mx = e.offsetX, my = e.offsetY;
    isMouseDown = true;
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
            drawCanvas();
            found = true;
            return;
        }
        if (mx >= obj.x && mx <= obj.x + obj.w && my >= obj.y && my <= obj.y + obj.h) {
            selected = obj;
            dragging = obj;
            offsetX = mx - obj.x;
            offsetY = my - obj.y;
            drawCanvas();
            found = true;
            return;
        }
    }
    if (!found) {
        selected = null;
        drawCanvas();
    }
});

canvas.addEventListener("mousemove", e => {
    if (!isMouseDown) return;
    let mx = e.offsetX, my = e.offsetY;
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
        return;
    }
    if (dragging) {
        dragging.x = mx - offsetX;
        dragging.y = my - offsetY;
        drawCanvas();
        return;
    }
});

canvas.addEventListener("mouseup", () => {
    isMouseDown = false;
    dragging = null;
    resizing = null;
    resizeDir = null;
    drawCanvas();
});
canvas.addEventListener("mouseout", () => {
    isMouseDown = false;
    dragging = null;
    resizing = null;
    resizeDir = null;
    drawCanvas();
});

// Touch events
canvas.addEventListener("touchstart", function(e) {
    isTouching = true;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const mx = touch.clientX - rect.left;
    const my = touch.clientY - rect.top;
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
            drawCanvas();
            found = true;
            return;
        }
        if (mx >= obj.x && mx <= obj.x + obj.w && my >= obj.y && my <= obj.y + obj.h) {
            selected = obj;
            dragging = obj;
            offsetX = mx - obj.x;
            offsetY = my - obj.y;
            drawCanvas();
            found = true;
            return;
        }
    }
    if (!found) {
        selected = null;
        drawCanvas();
    }
}, { passive: false });

canvas.addEventListener("touchmove", function(e) {
    if (!isTouching) return;
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const mx = touch.clientX - rect.left;
    const my = touch.clientY - rect.top;
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
        return;
    }
    if (dragging) {
        dragging.x = mx - offsetX;
        dragging.y = my - offsetY;
        drawCanvas();
        return;
    }
}, { passive: false });

canvas.addEventListener("touchend", function() {
    isTouching = false;
    dragging = null;
    resizing = null;
    resizeDir = null;
    drawCanvas();
}, { passive: false });

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

// --- Download ---
downloadBtn.addEventListener("click", () => {
    const link = document.createElement("a");
    link.download = "merged.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
});

document.addEventListener('DOMContentLoaded', function() {
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  navToggle?.addEventListener('click', function() {
    navLinks.classList.toggle('open');
  });
});

function setCanvasSizeFromSelect() {
    let [w, h] = sizeSelect.value.split("x").map(Number);
    canvas.width = w;
    canvas.height = h;
    // For mobile: scale canvas visually to fit screen, but keep pixel size for download
    if (window.innerWidth < 600) {
        // Set CSS size for preview only
        const maxW = Math.min(window.innerWidth - 32, 340); // 16px margin each side
        const scale = maxW / w;
        canvas.style.width = (w * scale) + "px";
        canvas.style.height = (h * scale) + "px";
    } else {
        canvas.style.width = w + "px";
        canvas.style.height = h + "px";
    }
}

// Call this on merge and on size change
sizeSelect.addEventListener("change", () => {
    setCanvasSizeFromSelect();
    drawCanvas();
});


