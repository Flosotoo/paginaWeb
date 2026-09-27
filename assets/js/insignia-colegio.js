/* Etapa 30: solo insignia. Se conserva la paleta original de EduSaldo. */
(()=>{
  'use strict';
  const STORAGE_KEY='edusaldo2_insignia_colegio';
  const MAX_INPUT_BYTES=8*1024*1024;
  const MAX_SIDE=400;
  const TYPES=['image/png','image/jpeg','image/webp'];
  const byId=id=>document.getElementById(id);
  const saved=()=>{try{const v=localStorage.getItem(STORAGE_KEY);return v&&/^data:image\/(png|jpeg|webp);base64,/.test(v)?v:null}catch{return null}};
  const family=byId('family-school-logo');
  if(family){
    const original=byId('family-original-art');
    const showFamily=src=>{if(!src)return;family.onload=()=>{family.classList.remove('hidden');if(original)original.classList.add('hidden')};family.onerror=()=>{family.classList.add('hidden');if(original)original.classList.remove('hidden')};family.src=src};
    showFamily(saved());
  }
  const file=byId('school-logo-file');
  if(!file)return;
  const preview=byId('school-logo-preview'),placeholder=byId('school-logo-placeholder'),feedback=byId('school-logo-feedback');
  let pending=null;
  const message=(text,error=false)=>{feedback.textContent=text;feedback.className='form-feedback '+(error?'feedback-error':'feedback-success')};
  const showPreview=src=>{preview.classList.toggle('hidden',!src);placeholder.classList.toggle('hidden',!!src);if(src)preview.src=src;else preview.removeAttribute('src')};
  showPreview(saved());
  file.addEventListener('change',()=>{
    pending=null;
    const selected=file.files&&file.files[0];
    if(!selected){showPreview(saved());return}
    if(!TYPES.includes(selected.type)){message('Selecciona una imagen PNG, JPG o WebP.',true);file.value='';showPreview(saved());return}
    if(selected.size>MAX_INPUT_BYTES){message('La imagen supera 8 MB. Selecciona una imagen más pequeña.',true);file.value='';showPreview(saved());return}
    const reader=new FileReader();
    reader.onerror=()=>message('No se pudo leer la imagen.',true);
    reader.onload=()=>{
      const img=new Image();
      img.onload=()=>{
        try{
          const scale=Math.min(1,MAX_SIDE/Math.max(img.naturalWidth,img.naturalHeight));
          const canvas=document.createElement('canvas');
          canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));
          canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
          const ctx=canvas.getContext('2d');
          if(!ctx)throw Error('Canvas no disponible');
          ctx.clearRect(0,0,canvas.width,canvas.height);
          ctx.drawImage(img,0,0,canvas.width,canvas.height);
          // PNG conserva la transparencia; nunca se rellena el lienzo de blanco.
          pending=canvas.toDataURL('image/png');
          showPreview(pending);
          message('Vista previa lista, con transparencia si la imagen original la tiene. Presiona Guardar insignia.');
        }catch{message('No se pudo preparar la imagen. Prueba con otro archivo.',true);showPreview(saved())}
      };
      img.onerror=()=>{message('El archivo no contiene una imagen válida.',true);showPreview(saved())};
      img.src=reader.result;
    };
    reader.readAsDataURL(selected);
  });
  byId('school-logo-save').addEventListener('click',()=>{
    if(!pending){message('Selecciona primero una insignia nueva.',true);return}
    try{localStorage.setItem(STORAGE_KEY,pending);pending=null;file.value='';message('Insignia guardada. Se mostrará junto al saludo del apoderado.')}
    catch{message('No se pudo guardar la imagen: el navegador podría tener el almacenamiento lleno. No borres tus datos; avísanos para revisar el problema.',true)}
  });
  byId('school-logo-remove').addEventListener('click',()=>{
    try{localStorage.removeItem(STORAGE_KEY);pending=null;file.value='';showPreview(null);message('Insignia quitada. Volverá a mostrarse la ilustración del cuaderno.')}
    catch{message('No se pudo quitar la insignia.',true)}
  });
})();
