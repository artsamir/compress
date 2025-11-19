const uploadBox = document.getElementById('uploadBox');
const imageInput = document.getElementById('imageInput');
const browseBtn = document.getElementById('browseBtn');

const progressBar = document.getElementById('progressBar');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');

const listView = document.getElementById('listView');
const galleryView = document.getElementById('galleryView');
const listViewBtn = document.getElementById('listViewBtn');
const galleryViewBtn = document.getElementById('galleryViewBtn');
const downloadZipBtn = document.getElementById('downloadZipBtn');
const convertBtn = document.getElementById('convertBtn');
const addNewBtn = document.getElementById('addNewBtn');
const preUploadPreview = document.getElementById('preUploadPreview');

let uploadedFiles = [];
let convertedImages = [];
let currentView = 'list';
let userChoseView = false; // don't override once user clicks

function truncateName(name, max = 18) {
  if (name.length <= max) return name;
  const ext = (name.includes('.') ? name.slice(name.lastIndexOf('.')) : '');
  const base = name.replace(ext, '');
  return base.slice(0, Math.max(3, max - ext.length - 3)) + '...' + ext;
}

// Drag & drop
['dragover','dragenter'].forEach(evt =>
  uploadBox.addEventListener(evt, e => { e.preventDefault(); uploadBox.classList.add('dragover'); })
);
['dragleave','drop'].forEach(evt =>
  uploadBox.addEventListener(evt, e => { e.preventDefault(); uploadBox.classList.remove('dragover'); })
);
uploadBox.addEventListener('drop', e => {
  if (e.dataTransfer?.files?.length) handleFiles(e.dataTransfer.files, true);
});

browseBtn?.addEventListener('click', () => imageInput.click());
imageInput?.addEventListener('change', (e) => {
  if (e.target.files?.length) handleFiles(e.target.files, true);
  // reset input to allow selecting same files again
  e.target.value = '';
});

addNewBtn?.addEventListener('click', () => imageInput.click());

function handleFiles(fileList, append = true) {
  const incoming = Array.from(fileList).slice(0, 100);
  if (append) uploadedFiles = [...uploadedFiles, ...incoming].slice(0, 100);
  else uploadedFiles = incoming;

  // Hide upload box after first selection
  if (uploadedFiles.length) {
    uploadBox.style.display = 'none';
    preUploadPreview.style.display = 'grid';
    renderPreUploadPreview();
    convertBtn.disabled = false;

    // Set initial view only once (based on count)
    if (!userChoseView) {
      currentView = uploadedFiles.length > 1 ? 'gallery' : 'list';
      updateViewButtons();
    }
  }
}

function renderPreUploadPreview() {
  preUploadPreview.innerHTML = '';
  uploadedFiles.forEach(file => {
    const url = URL.createObjectURL(file);
    const item = document.createElement('div');
    item.className = 'upload-preview-item';
    item.innerHTML = `
      <img src="${url}" alt="">
      <div class="filename" title="${file.name}">${truncateName(file.name, 20)}</div>
    `;
    preUploadPreview.appendChild(item);
  });
}

// Convert
convertBtn?.addEventListener('click', () => {
  if (!uploadedFiles.length) return;
  progressBar.style.display = 'block';
  progressFill.style.width = '0%';
  progressText.textContent = '0%';
  downloadZipBtn.disabled = true;
  convertBtn.disabled = true;

  convertedImages = new Array(uploadedFiles.length);
  let completed = 0;

  uploadedFiles.forEach((file, idx) => {
    const formData = new FormData();
    formData.append('file', file);

    fetch('/api/image-to-jpg', { method: 'POST', body: formData, headers: { 'Accept':'application/json' } })
      .then(res => {
        if (!res.ok) throw new Error('Convert failed');
        return res.json();
      })
      .then(data => {
        convertedImages[idx] = {
          name: file.name.replace(/\.[^/.]+$/, '.jpg'),
          size: data.size,
          pixels: data.pixels,
          url: data.url
        };
      })
      .catch(() => {
        convertedImages[idx] = null;
      })
      .finally(() => {
        completed++;
        const pct = Math.round((completed / uploadedFiles.length) * 100);
        progressFill.style.width = pct + '%';
        progressText.textContent = pct + '%';

        if (completed === uploadedFiles.length) {
          convertBtn.disabled = false;
          // Hide pre-upload preview after convert completes (keep views only)
          preUploadPreview.style.display = 'none';
          document.querySelector('.view-toggle').style.display = 'flex';
          // Respect user's choice; otherwise keep initial rule
          renderViews();
          downloadZipBtn.disabled = !convertedImages.filter(Boolean).length;
        }
      });
  });
});

function updateViewButtons() {
  if (currentView === 'list') {
    listViewBtn?.classList.add('active');
    galleryViewBtn?.classList.remove('active');
  } else {
    galleryViewBtn?.classList.add('active');
    listViewBtn?.classList.remove('active');
  }
}

listViewBtn?.addEventListener('click', () => {
  currentView = 'list';
  userChoseView = true;
  updateViewButtons();
  renderViews();
});
galleryViewBtn?.addEventListener('click', () => {
  currentView = 'gallery';
  userChoseView = true;
  updateViewButtons();
  renderViews();
});

function renderViews() {
  // Render List
  listView.innerHTML = '';
  convertedImages.forEach(img => {
    if (!img) return;
    const el = document.createElement('div');
    el.className = 'list-item';
    el.innerHTML = `
      <img src="${img.url}" alt="Converted">
      <div class="list-meta">
        <div class="line" title="${img.name}">${img.name}</div>
        <div class="line">${img.pixels} • ${(img.size/1024).toFixed(1)} KB</div>
      </div>
      <button class="list-download"><i class="fas fa-download"></i> Download</button>
    `;
    el.querySelector('.list-download').addEventListener('click', () => downloadSingle(img.url, img.name));
    listView.appendChild(el);
  });

  // Render Gallery
  galleryView.innerHTML = '';
  convertedImages.forEach(img => {
    if (!img) return;
    const el = document.createElement('div');
    el.className = 'gallery-item';
    el.innerHTML = `
      <img src="${img.url}" alt="Converted">
      <div class="gallery-meta" title="${img.name}">${img.pixels} • ${(img.size/1024).toFixed(1)} KB • ${truncateName(img.name, 22)}</div>
      <button class="gallery-download"><i class="fas fa-download"></i> Download</button>
    `;
    el.querySelector('.gallery-download').addEventListener('click', () => downloadSingle(img.url, img.name));
    galleryView.appendChild(el);
  });

  // Toggle visibility
  listView.style.display = currentView === 'list' ? 'flex' : 'none';
  galleryView.style.display = currentView === 'gallery' ? 'grid' : 'none';
}

function downloadSingle(url, name) {
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Download ZIP
downloadZipBtn?.addEventListener('click', () => {
  const files = convertedImages.filter(Boolean).map(img => img.url);
  if (!files.length) return;

  fetch('/api/image-to-jpg-zip', {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify({ files })
  })
  .then(res => res.blob())
  .then(blob => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'converted_images.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  });
});