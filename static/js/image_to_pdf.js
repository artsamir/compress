// Similar flow; thumbnails replaced with a PDF badge, extension .pdf, endpoints '/api/image-to-pdf'
const S={ uploaded:[], converted:[], view:'list', user:false };
const $=id=>document.getElementById(id);
const uploadBox=$('uploadBox'), imageInput=$('imageInput'), browseBtn=$('browseBtn'), pre=$('preUploadPreview');
const convertBtn=$('convertBtn'), pb=$('progressBar'), pf=$('progressFill'), pt=$('progressText');
const listView=$('listView'), grid=$('galleryView'), listBtn=$('listViewBtn'), gridBtn=$('galleryViewBtn'), toggle=document.querySelector('.view-toggle'), zipBtn=$('downloadZipBtn');

['dragover','dragenter'].forEach(evn=>uploadBox.addEventListener(evn,e=>{e.preventDefault();uploadBox.classList.add('dragover');}));
['dragleave','drop'].forEach(evn=>uploadBox.addEventListener(evn,e=>{e.preventDefault();uploadBox.classList.remove('dragover');}));
uploadBox.addEventListener('drop', e => e.dataTransfer?.files?.length && handle(Array.from(e.dataTransfer.files)));
browseBtn?.addEventListener('click', ()=> imageInput.click());
imageInput?.addEventListener('change', e=>{ if(e.target.files?.length) handle(Array.from(e.target.files)); e.target.value=''; });
$('addNewBtn')?.addEventListener('click', ()=> imageInput.click());

function handle(files){
  S.uploaded=[...S.uploaded,...files].slice(0,100);
  if(!S.uploaded.length) return;
  uploadBox.style.display='none'; pre.style.display='grid'; renderPre(); convertBtn.disabled=false;
  if(!S.user){ S.view = S.uploaded.length>1?'gallery':'list'; updateBtns(); }
}
function renderPre(){
  pre.innerHTML='';
  S.uploaded.forEach(f=>{
    const u = URL.createObjectURL(f);
    const d=document.createElement('div'); d.className='upload-preview-item';
    d.innerHTML=`<img src="${u}"><div class="filename" title="${f.name}">${f.name.length>20?f.name.slice(0,17)+'...':f.name}</div>`;
    pre.appendChild(d);
  });
}
function updateBtns(){ listBtn?.classList.toggle('active',S.view==='list'); gridBtn?.classList.toggle('active',S.view!=='list'); }
listBtn?.addEventListener('click',()=>{S.view='list';S.user=true;updateBtns();render();});
gridBtn?.addEventListener('click',()=>{S.view='gallery';S.user=true;updateBtns();render();});

convertBtn?.addEventListener('click', ()=>{
  if(!S.uploaded.length) return;
  pb.style.display='block'; convertBtn.disabled=true; S.converted=new Array(S.uploaded.length);
  let done=0;
  S.uploaded.forEach((f,i)=>{
    const fd=new FormData(); fd.append('file',f);
    fetch('/api/image-to-pdf',{method:'POST',body:fd,headers:{'Accept':'application/json'}})
      .then(r=>{ if(!r.ok) throw 0; return r.json(); })
      .then(d=>{ S.converted[i]={ name:f.name.replace(/\.[^/.]+$/,'.pdf'), size:d.size, pixels:d.pixels, url:d.url }; })
      .catch(()=>{ S.converted[i]=null; })
      .finally(()=>{
        done++; const pct=Math.round((done/S.uploaded.length)*100); pf.style.width=pct+'%'; pt.textContent=pct+'%';
        if(done===S.uploaded.length){ convertBtn.disabled=false; pre.style.display='none'; toggle.style.display='flex'; render(); zipBtn.disabled=!S.converted.filter(Boolean).length; }
      });
  });
});
function render(){
  listView.innerHTML=''; grid.innerHTML='';
  S.converted.forEach(f=>{
    if(!f) return;
    const li=document.createElement('div'); li.className='list-item';
    li.innerHTML=`<div class="list-meta"><div class="line" title="${f.name}"><i class="fas fa-file-pdf" style="color:#ef4444;margin-right:8px;"></i>${f.name}</div><div class="line">${f.pixels} • ${(f.size/1024).toFixed(1)} KB</div></div><button class="list-download"><i class="fas fa-download"></i> Download</button>`;
    li.querySelector('.list-download').onclick=()=>dl(f.url,f.name); listView.appendChild(li);

    const gi=document.createElement('div'); gi.className='gallery-item';
    gi.innerHTML=`<div style="height:140px;display:flex;align-items:center;justify-content:center;background:#f3f4f6;border-radius:8px;"><i class="fas fa-file-pdf" style="font-size:48px;color:#ef4444;"></i></div><div class="gallery-meta" title="${f.name}">${f.pixels} • ${(f.size/1024).toFixed(1)} KB • ${f.name.length>22?f.name.slice(0,19)+'...':f.name}</div><button class="gallery-download"><i class="fas fa-download"></i> Download</button>`;
    gi.querySelector('.gallery-download').onclick=()=>dl(f.url,f.name); grid.appendChild(gi);
  });
  listView.style.display=S.view==='list'?'flex':'none'; grid.style.display=S.view==='gallery'?'grid':'none';
}
function dl(url,name){ const a=document.createElement('a'); a.href=url; a.download=name; document.body.appendChild(a); a.click(); a.remove(); }
zipBtn?.addEventListener('click', ()=>{
  const files=S.converted.filter(Boolean).map(x=>x.url); if(!files.length) return;
  fetch('/api/image-to-pdf-zip',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({files})})
    .then(r=>r.blob()).then(b=>{ const a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download='converted_pdfs.zip'; document.body.appendChild(a); a.click(); a.remove(); });
});