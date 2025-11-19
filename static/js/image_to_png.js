// Same UI logic as JPG, only endpoints/ext differ
const statePNG = { uploaded:[], converted:[], view:'list', userSet:false };
const el = s => document.getElementById(s);
const uploadBox = el('uploadBox'), imageInput = el('imageInput'), browseBtn = el('browseBtn');
const prePreview = el('preUploadPreview'), convertBtn = el('convertBtn');
const progressBar = el('progressBar'), progressFill = el('progressFill'), progressText = el('progressText');
const listView = el('listView'), galleryView = el('galleryView');
const listBtn = el('listViewBtn'), gridBtn = el('galleryViewBtn'), dlZip = el('downloadZipBtn');
const viewToggle = document.querySelector('.view-toggle');
const truncate = (n, m=18)=> n.length<=m?n:(n.slice(0,m-3)+'...');

['dragover','dragenter'].forEach(evn=>uploadBox.addEventListener(evn,e=>{e.preventDefault();uploadBox.classList.add('dragover');}));
['dragleave','drop'].forEach(evn=>uploadBox.addEventListener(evn,e=>{e.preventDefault();uploadBox.classList.remove('dragover');}));
uploadBox.addEventListener('drop', e => e.dataTransfer?.files?.length && handle(Array.from(e.dataTransfer.files)));
browseBtn?.addEventListener('click', ()=> imageInput.click());
imageInput?.addEventListener('change', e => { if(e.target.files?.length) handle(Array.from(e.target.files)); e.target.value=''; });
el('addNewBtn')?.addEventListener('click', ()=> imageInput.click());

function handle(files){
  statePNG.uploaded = [...statePNG.uploaded, ...files].slice(0,100);
  if(!statePNG.uploaded.length) return;
  uploadBox.style.display='none';
  prePreview.style.display='grid';
  convertBtn.disabled=false;
  renderPre();
  if(!statePNG.userSet){ statePNG.view = statePNG.uploaded.length>1?'gallery':'list'; updateViewBtns(); }
}
function renderPre(){
  prePreview.innerHTML='';
  statePNG.uploaded.forEach(f=>{
    const url = URL.createObjectURL(f);
    const d = document.createElement('div');
    d.className='upload-preview-item';
    d.innerHTML = `<img src="${url}"><div class="filename" title="${f.name}">${truncate(f.name,20)}</div>`;
    prePreview.appendChild(d);
  });
}
function updateViewBtns(){
  listBtn?.classList.toggle('active', statePNG.view==='list');
  gridBtn?.classList.toggle('active', statePNG.view==='gallery');
}
listBtn?.addEventListener('click', ()=>{ statePNG.view='list'; statePNG.userSet=true; updateViewBtns(); render(); });
gridBtn?.addEventListener('click', ()=>{ statePNG.view='gallery'; statePNG.userSet=true; updateViewBtns(); render(); });

convertBtn?.addEventListener('click', ()=>{
  if(!statePNG.uploaded.length) return;
  progressBar.style.display='block'; convertBtn.disabled=true;
  statePNG.converted = new Array(statePNG.uploaded.length);
  let done=0;
  statePNG.uploaded.forEach((f,i)=>{
    const fd=new FormData(); fd.append('file',f);
    fetch('/api/image-to-png',{method:'POST',body:fd,headers:{'Accept':'application/json'}})
      .then(r=>{ if(!r.ok) throw 0; return r.json(); })
      .then(d=>{ statePNG.converted[i]={ name:f.name.replace(/\.[^/.]+$/,'.png'), size:d.size, pixels:d.pixels, url:d.url }; })
      .catch(()=>{ statePNG.converted[i]=null; })
      .finally(()=>{
        done++; const pct=Math.round((done/statePNG.uploaded.length)*100);
        progressFill.style.width=pct+'%'; progressText.textContent=pct+'%';
        if(done===statePNG.uploaded.length){
          convertBtn.disabled=false; prePreview.style.display='none'; viewToggle.style.display='flex';
          render(); dlZip.disabled=!statePNG.converted.filter(Boolean).length;
        }
      });
  });
});
function render(){
  listView.innerHTML=''; galleryView.innerHTML='';
  statePNG.converted.forEach(img=>{
    if(!img) return;
    const li = document.createElement('div');
    li.className='list-item';
    li.innerHTML = `<img src="${img.url}"><div class="list-meta"><div class="line" title="${img.name}">${img.name}</div><div class="line">${img.pixels} • ${(img.size/1024).toFixed(1)} KB</div></div><button class="list-download"><i class="fas fa-download"></i> Download</button>`;
    li.querySelector('.list-download').onclick=()=>download(img.url,img.name);
    listView.appendChild(li);

    const gi = document.createElement('div');
    gi.className='gallery-item';
    gi.innerHTML = `<img src="${img.url}"><div class="gallery-meta" title="${img.name}">${img.pixels} • ${(img.size/1024).toFixed(1)} KB • ${truncate(img.name,22)}</div><button class="gallery-download"><i class="fas fa-download"></i> Download</button>`;
    gi.querySelector('.gallery-download').onclick=()=>download(img.url,img.name);
    galleryView.appendChild(gi);
  });
  listView.style.display = statePNG.view==='list'?'flex':'none';
  galleryView.style.display = statePNG.view==='gallery'?'grid':'none';
}
function download(url,name){ const a=document.createElement('a'); a.href=url; a.download=name; document.body.appendChild(a); a.click(); a.remove(); }
dlZip?.addEventListener('click', ()=>{
  const files = statePNG.converted.filter(Boolean).map(x=>x.url);
  if(!files.length) return;
  fetch('/api/image-to-png-zip',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({files})})
    .then(r=>r.blob()).then(b=>{ const a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download='converted_images.zip'; document.body.appendChild(a); a.click(); a.remove(); });
});