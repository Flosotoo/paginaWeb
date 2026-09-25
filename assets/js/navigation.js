// Etapa 27: menú accesible y adaptable. No modifica la lógica de EduSaldo.
(()=>{
 const toggle=document.querySelector('.mobile-nav-toggle');
 const nav=document.querySelector('.site-header .header-nav');
 if(toggle&&nav){
   const close=()=>{nav.classList.remove('is-open');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Abrir menú');toggle.querySelector('[aria-hidden]').textContent='☰'};
   toggle.addEventListener('click',()=>{
     const open=!nav.classList.contains('is-open');
     nav.classList.toggle('is-open',open);
     toggle.setAttribute('aria-expanded',String(open));
     toggle.setAttribute('aria-label',open?'Cerrar menú':'Abrir menú');
     toggle.querySelector('[aria-hidden]').textContent=open?'✕':'☰';
   });
   nav.addEventListener('click',event=>{if(event.target.closest('a'))close()});
   document.addEventListener('keydown',event=>{if(event.key==='Escape')close()});
   window.matchMedia('(min-width: 1051px)').addEventListener('change',event=>{if(event.matches)close()});
 }
 const adminToggle=document.querySelector('.admin-nav-toggle');
 const sidebar=document.querySelector('#admin-sidebar');
 if(adminToggle&&sidebar){
   adminToggle.addEventListener('click',()=>{
     const open=sidebar.classList.toggle('is-open');
     adminToggle.setAttribute('aria-expanded',String(open));
     adminToggle.textContent=open?'✕ Cerrar menú':'☰ Menú';
   });
 }
})();
