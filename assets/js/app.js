/* EduSaldo 2.0 · Etapa 2. Interfaz y selección de alumno con datos ficticios. */
(()=>{'use strict';
const KEY='edusaldo2_sesion',DATA='edusaldo2_demo',SELECT='edusaldo2_hijo';
const users=[{mail:'apoderado@edusaldo.cl',pass:'1234',name:'Pamela',role:'apoderado'},{mail:'encargado@edusaldo.cl',pass:'1234',name:'Encargado',role:'libreria'},{mail:'admin@edusaldo.cl',pass:'1234',name:'Administrador',role:'administrador'}];
const seed={children:[{id:1,name:'Sofía Pérez',rut:'12.345.678-5',age:9,course:'3° Básico',balance:18000},{id:2,name:'Tomás Pérez',rut:'23.456.789-6',age:13,course:'8° Básico',balance:12500}],movements:[{child:1,type:'Abono de saldo',date:'2026-09-20',amount:10000},{child:1,type:'Entrega de materiales',date:'2026-09-19',amount:-2500},{child:2,type:'Abono de saldo',date:'2026-09-18',amount:12500},{child:1,type:'Abono de saldo',date:'2026-09-15',amount:5000},{child:2,type:'Entrega de materiales',date:'2026-09-12',amount:-1800}],reservations:[],products:[{id:101,name:'Cuaderno universitario',category:'Cuadernos',price:1250,stock:25,barcode:'7800000000101'},{id:102,name:'Cuaderno College Matemática',category:'Cuadernos',price:900,stock:18,barcode:'7800000000102'},{id:103,name:'Cuaderno College Lineal',category:'Cuadernos',price:900,stock:20,barcode:'7800000000103'},{id:104,name:'Block de dibujo 1/4',category:'Papeles',price:1500,stock:12,barcode:'7800000000104'},{id:105,name:'Lápiz grafito HB',category:'Escritura',price:450,stock:30,barcode:'7800000000105'},{id:106,name:'Goma de borrar',category:'Escritura',price:350,stock:25,barcode:'7800000000106'},{id:107,name:'Caja lápices de colores 12',category:'Arte',price:2800,stock:10,barcode:'7800000000107'},{id:108,name:'Regla 30 cm',category:'Geometría',price:750,stock:14,barcode:'7800000000108'},{id:109,name:'Calculadora científica',category:'Ciencias y tecnología',price:11990,stock:8,barcode:'7800000000109'},{id:110,name:'Kit de circuito eléctrico básico',category:'Ciencias y tecnología',price:6990,stock:7,barcode:'7800000000110'},{id:111,name:'Pila de 9 V',category:'Ciencias y tecnología',price:1990,stock:15,barcode:'7800000000111'},{id:112,name:'Portapilas',category:'Ciencias y tecnología',price:950,stock:12,barcode:'7800000000112'},{id:113,name:'Cables con pinzas cocodrilo (set)',category:'Ciencias y tecnología',price:3490,stock:10,barcode:'7800000000113'},{id:114,name:'LED surtidos (set)',category:'Ciencias y tecnología',price:1890,stock:14,barcode:'7800000000114'},{id:115,name:'Protoboard pequeña',category:'Ciencias y tecnología',price:3990,stock:6,barcode:'7800000000115'},{id:116,name:'Transportador 180°',category:'Geometría',price:690,stock:15,barcode:'7800000000116'},{id:117,name:'Compás escolar',category:'Geometría',price:1790,stock:9,barcode:'7800000000117'},{id:118,name:'Cartulina de color',category:'Papeles',price:350,stock:40,barcode:'7800000000118'},{id:119,name:'Papel lustre (sobre)',category:'Papeles',price:790,stock:25,barcode:'7800000000119'},{id:120,name:'Témpera 12 colores',category:'Arte',price:3590,stock:12,barcode:'7800000000120'},{id:121,name:'Pinceles escolares (set)',category:'Arte',price:1690,stock:10,barcode:'7800000000121'},{id:122,name:'Pegamento en barra',category:'Otros materiales',price:990,stock:30,barcode:'7800000000122'},{id:123,name:'Tijera escolar',category:'Otros materiales',price:1490,stock:16,barcode:'7800000000123'},{id:124,name:'Cinta adhesiva',category:'Otros materiales',price:790,stock:24,barcode:'7800000000124'},{id:125,name:'Carpeta con acoclip',category:'Otros materiales',price:690,stock:20,barcode:'7800000000125'},{id:126,name:'Pendrive 32 GB',category:'Otros materiales',price:5990,stock:8,barcode:'7800000000126'},{id:127,name:'Delantal para arte',category:'Otros materiales',price:4990,stock:6,barcode:'7800000000127'}]};
// Etapa 29: credenciales de DEMOSTRACIÓN, exclusivamente locales; no aptas para uso real.
const ACCOUNT_KEY='edusaldo2_demo_credenciales';
function demoAccounts(){try{const value=JSON.parse(localStorage.getItem(ACCOUNT_KEY));return value&&typeof value==='object'&&!Array.isArray(value)?value:{}}catch{return {}}}
function demoPassword(mail){const saved=demoAccounts()[mail];return typeof saved==='string'?saved:users.find(u=>u.mail===mail)?.pass}
function storeDemoPassword(mail,pass){const all=demoAccounts();all[mail]=pass;localStorage.setItem(ACCOUNT_KEY,JSON.stringify(all))}
const $=id=>document.getElementById(id),money=n=>'$'+Math.trunc(Number(n)||0).toString().replace(/\B(?=(\d{3})+(?!\d))/g,'.');const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function db(){try{const stored=JSON.parse(localStorage.getItem(DATA));if(stored?.children&&stored?.movements){const defaults=structuredClone(seed);const previous=Array.isArray(stored.products)?stored.products:[];const ids=new Set(previous.map(p=>p.id));return {...defaults,...stored,products:[...previous,...defaults.products.filter(p=>!ids.has(p.id))]}}return structuredClone(seed)}catch{return structuredClone(seed)}}function session(){try{return JSON.parse(sessionStorage.getItem(KEY))}catch{return null}}function root(){return document.body.dataset.root||'./'}function go(path){location.href=root()+path}
// Etapa 36.3: inicializar los datos compartidos incluso cuando el primer acceso es Encargado.
// No sobrescribir datos existentes: conservar saldos, reservas, entregas e inventarios.
try {
  const raw=localStorage.getItem(DATA);
  if(raw===null){localStorage.setItem(DATA,JSON.stringify(structuredClone(seed)))}
  else {
    const stored=JSON.parse(raw);
    if(stored&&typeof stored==='object'&&!Array.isArray(stored)){
      let changed=false;
      if(!Array.isArray(stored.children)){stored.children=structuredClone(seed.children);changed=true}
      if(!Array.isArray(stored.movements)){stored.movements=structuredClone(seed.movements);changed=true}
      if(!Array.isArray(stored.reservations)){stored.reservations=[];changed=true}
      if(!Array.isArray(stored.products)){stored.products=structuredClone(seed.products);changed=true}
      if(changed)localStorage.setItem(DATA,JSON.stringify(stored));
    }
  }
} catch(e){console.warn('EduSaldo: no se pudo inicializar la información local.',e)}
const login=$('login-form');if(login){login.addEventListener('submit',e=>{e.preventDefault();const mail=$('correo').value.trim().toLowerCase(),pass=$('clave').value;const u=users.find(x=>x.mail===mail&&demoPassword(x.mail)===pass);if(!u){$('login-error').textContent='Revisa el correo y la contraseña de demostración.';$('login-error').classList.remove('hidden');return}sessionStorage.setItem(KEY,JSON.stringify({name:u.name,role:u.role}));const routes={apoderado:'pages/apoderado/inicio.html',libreria:'pages/libreria/inicio.html',administrador:'pages/administrador/inicio.html'};go(routes[u.role])})}
const required=document.body.dataset.role;if(required){const s=session();if(!s||s.role!==required){go('index.html');return}document.querySelectorAll('[data-user]').forEach(n=>n.textContent=s.name);document.querySelectorAll('[data-initial]').forEach(n=>n.textContent=s.name.charAt(0));const logout=$('logout');if(logout)logout.onclick=()=>{sessionStorage.removeItem(KEY);go('index.html')}}
// Recuperación simulada: código visible EN PANTALLA, sin envío de correo ni validación de identidad.
const recoveryForm=$('recovery-form');
if(recoveryForm){
  const feedback=$('recovery-feedback'),codeStep=$('recovery-code-step');
  let pendingMail='',pendingCode='';
  const show=(message,error=false)=>{feedback.textContent=message;feedback.className='form-feedback '+(error?'feedback-error':'feedback-success')};
  $('recovery-open').addEventListener('click',()=>{$('recovery-panel').classList.remove('hidden');$('recovery-panel').scrollIntoView({behavior:'smooth',block:'nearest'})});
  $('recovery-close').addEventListener('click',()=>{$('recovery-panel').classList.add('hidden');recoveryForm.reset();codeStep.classList.add('hidden');feedback.textContent='';pendingMail='';pendingCode='' });
  $('recovery-request').addEventListener('click',()=>{
    const mail=$('recovery-mail').value.trim().toLowerCase();
    if(!users.some(u=>u.mail===mail&&u.role==='apoderado')){show('En esta demostración solo se puede recuperar la cuenta ficticia del apoderado.',true);return}
    pendingMail=mail;pendingCode=String(Math.floor(100000+Math.random()*900000));
    $('recovery-demo-code').textContent=pendingCode;codeStep.classList.remove('hidden');show('Código generado solo para esta demostración. No se ha enviado ningún correo.');
  });
  recoveryForm.addEventListener('submit',event=>{
    event.preventDefault();const pass=$('recovery-new').value;
    if(!pendingMail||$('recovery-code').value.trim()!==pendingCode){show('Revisa el código de demostración.',true);return}
    if(pass.length<8||pass.length>72||!/[A-Za-z]/.test(pass)||!/[0-9]/.test(pass)){show('Usa entre 8 y 72 caracteres, con letras y números.',true);return}
    if(pass!==$('recovery-confirm').value){show('Las contraseñas nuevas no coinciden.',true);return}
    try{storeDemoPassword(pendingMail,pass)}catch{show('No fue posible guardar la contraseña en este navegador.',true);return}
    recoveryForm.reset();codeStep.classList.add('hidden');pendingMail='';pendingCode='';show('Contraseña de demostración actualizada. Ya puedes iniciar sesión.');
  });
}
const changeForm=$('change-password-form');
if(changeForm){
  const feedback=$('password-feedback');
  changeForm.addEventListener('submit',event=>{
    event.preventDefault();const mail='apoderado@edusaldo.cl',old=$('password-current').value,next=$('password-new').value;
    const show=(message,error=false)=>{feedback.textContent=message;feedback.className='form-feedback '+(error?'feedback-error':'feedback-success')};
    if(old!==demoPassword(mail)){show('La contraseña actual no coincide.',true);return}
    if(next.length<8||next.length>72||!/[A-Za-z]/.test(next)||!/[0-9]/.test(next)){show('Usa entre 8 y 72 caracteres, con letras y números.',true);return}
    if(next===old){show('La nueva contraseña debe ser diferente de la actual.',true);return}
    if(next!==$('password-confirm').value){show('La confirmación no coincide con la nueva contraseña.',true);return}
    try{storeDemoPassword(mail,next)}catch{show('No fue posible guardar la contraseña en este navegador.',true);return}
    changeForm.reset();show('Contraseña de demostración actualizada correctamente.');
  });
}
const children=$('children');
const d=db();
function fecha(m){return new Intl.DateTimeFormat('es-CL',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(m.date+'T12:00:00Z'))}
function recent(a,b){return (b.createdAt||b.date).localeCompare(a.createdAt||a.date)}
function moveHtml(m,showChild){const c=d.children.find(x=>x.id===m.child);return `<div class="movement family-movement"><span class="movement-icon ${m.amount>=0?'credit':'debit'}">${m.amount>=0?'↙':'▣'}</span><span class="movement-desc"><strong>${esc(m.type)}</strong><small>${showChild?esc(c?.name||'')+' · ':''}${fecha(m)}</small></span><strong class="${m.amount>=0?'plus':'minus'}">${m.amount>=0?'+':'−'}${money(Math.abs(m.amount))}</strong></div>`}
if(children){children.innerHTML=d.children.map((c,i)=>`<a href="hijo.html?id=${c.id}" class="child-choice family-child ${i===1?'second-child':''}"><span class="child-top"><span class="child-avatar">${esc(c.name.charAt(0))}</span><span class="choice-state">Seleccionar alumno ↗</span></span><strong>${esc(c.name)}</strong><small>${esc(c.course)} · ${c.age} años</small><span class="choice-bottom"><span>Saldo disponible</span><b>${money(c.balance)}</b></span></a>`).join('');$('movements').innerHTML=d.movements.slice().sort((a,b)=>recent(a,b)).slice(0,5).map(m=>moveHtml(m,true)).join('')||'<p class="empty">Todavía no hay movimientos.</p>'}
const selectedId=Number(new URLSearchParams(location.search).get('id'));
const selectedChild=d.children.find(x=>x.id===selectedId);
const detail=$('detail-name');
if(detail){
  if(!selectedChild){go('pages/apoderado/inicio.html');return}
  const c=selectedChild;
  detail.textContent=c.name;
  $('detail-avatar').textContent=c.name.charAt(0);
  $('detail-course').textContent=`${c.course} · ${c.age} años`;
  $('detail-balance').textContent=money(c.balance);
  const options=[
    {icon:'＋',name:'Abonar saldo',status:'Continuar',enabled:true,url:`aportar-saldo.html?id=${c.id}`},
    ...(c.age<12?[{icon:'▤',name:'Reservar materiales',status:'Elegir materiales',enabled:true,url:`reservar-materiales.html?id=${c.id}`},{icon:'◷',name:'Mis reservas',status:'Consultar pedidos',enabled:true,url:`mis-reservas.html?id=${c.id}`}]:[]),
    {icon:'↗',name:'Visualizar movimientos',status:'Ver cartola',enabled:true,url:`movimientos.html?id=${c.id}`}
  ];
  $('detail-actions').innerHTML=options.map(o=>`<${o.enabled?'a':'div'} class="detail-action ${o.enabled?'is-available':'is-pending'}" ${o.enabled?`href="${o.url}"`:'aria-disabled="true"'}><span class="detail-action-icon" aria-hidden="true">${o.icon}</span><span class="detail-action-copy"><strong>${esc(o.name)}</strong><small>${esc(o.status)}</small></span><span class="detail-action-arrow" aria-hidden="true">${o.enabled?'→':'·'}</span></${o.enabled?'a':'div'}>`).join('');
}
const cartola=$('detail-movements');
if(cartola){
  if(!selectedChild){go('pages/apoderado/inicio.html');return}
  $('cartola-title').textContent=`Movimientos de ${selectedChild.name}`;
  $('back-to-child').href=`hijo.html?id=${selectedChild.id}`;
  cartola.innerHTML=d.movements.filter(m=>m.child===selectedChild.id).sort((a,b)=>recent(a,b)).map(m=>moveHtml(m,false)).join('')||'<p class="empty">Todavía no hay movimientos para esta cuenta.</p>';
}
// Etapa 12: aporte de saldo y pasarela Webpay SIMULADA, sin pagos reales.
const aporteForm=$('aporte-form');
if(aporteForm){
  if(!selectedChild){go('pages/apoderado/inicio.html');return}
  const c=selectedChild, input=$('aporte-monto'), error=$('aporte-error'), feedback=$('aporte-feedback');
  $('aporte-nombre').textContent=c.name;
  $('aporte-curso').textContent=`${c.course} · ${c.age} años`;
  $('aporte-saldo').textContent=money(c.balance);
  $('aporte-avatar').textContent=c.name.charAt(0);
  $('aporte-volver').href=`hijo.html?id=${c.id}`;
  // La cartola se enlaza desde la confirmación del abono y la cuenta del alumno.
  const confirmation=$('aporte-confirmar');
  const digits=()=>input.value.replace(/\D/g,'');
  const amountValue=()=>Number(digits());
  function validAmount(){const raw=digits();const n=Number(raw);return raw&&Number.isSafeInteger(n)&&n>0&&n<=100000000?n:null}
  function updatePreview(){
    const raw=digits().slice(0,9);
    const n=raw?Number(raw):null;
    input.value=raw?raw.replace(/\B(?=(\d{3})+(?!\d))/g,'.'):'';
    const valid=validAmount();
    $('aporte-resumen-monto').textContent=valid?money(valid):'—';
    $('aporte-resumen-total').textContent=valid?money(c.balance+valid):'—';
    confirmation.checked=false;
    error.textContent='';
  }
  input.addEventListener('input',updatePreview);
  input.addEventListener('change',updatePreview);
  input.addEventListener('blur',updatePreview);
  updatePreview();
  aporteForm.addEventListener('submit',e=>{
    e.preventDefault();const n=validAmount();
    if(!n){error.textContent='Ingresa un monto válido entre $1 y $100.000.000, sin decimales.';input.focus();return}
    if(!Number.isSafeInteger(c.balance+n)){error.textContent='El monto ingresado es demasiado alto.';return}
    if(!confirmation.checked){error.textContent='Confirma el monto mostrado antes de continuar.';confirmation.focus();return}
    $('pago-alumno').textContent=c.name;$('pago-monto').textContent=money(n);
    $('pago-saldo').textContent=money(c.balance+n);
    $('aporte-step').classList.add('hidden');$('pago-step').classList.remove('hidden');feedback.textContent='';
  });
  $('pago-volver').addEventListener('click',()=>{$('pago-step').classList.add('hidden');$('aporte-step').classList.remove('hidden')});
  $('pago-rechazar').addEventListener('click',()=>{$('pago-step').classList.add('hidden');$('aporte-step').classList.remove('hidden');feedback.textContent='Pago simulado rechazado. No se registró ningún aporte ni se modificó el saldo.';feedback.className='form-feedback feedback-error';});
  $('pago-aprobar').addEventListener('click',()=>{
    const n=validAmount();if(!n){$('pago-step').classList.add('hidden');$('aporte-step').classList.remove('hidden');error.textContent='Revisa el monto del aporte.';return}
    const current=db(),student=current.children.find(x=>x.id===c.id);
    if(!student||!Number.isSafeInteger(student.balance+n)){error.textContent='No fue posible validar la cuenta.';return}
    student.balance+=n;
    const now=new Date();
    current.movements.push({child:c.id,type:'Abono de saldo',date:new Intl.DateTimeFormat('en-CA',{timeZone:'America/Santiago',year:'numeric',month:'2-digit',day:'2-digit'}).format(now),createdAt:now.toISOString(),amount:n,reference:`SIM-${Date.now()}`});
    try{localStorage.setItem(DATA,JSON.stringify(current))}catch{$('pago-step').classList.add('hidden');$('aporte-step').classList.remove('hidden');feedback.textContent='No se pudo guardar el aporte. Comprueba el almacenamiento del navegador.';feedback.className='form-feedback feedback-error';return}
    $('pago-step').classList.add('hidden');$('aporte-ok').classList.remove('hidden');
    $('aporte-ok-monto').textContent=money(n);$('aporte-ok-saldo').textContent=money(student.balance);$('aporte-saldo').textContent=money(student.balance);
    $('aporte-ok-cuenta').href=`hijo.html?id=${c.id}`;$('aporte-ok-cartola').href=`movimientos.html?id=${c.id}`;
  });
}

// Etapa 16: reservas de menores de 12 años. No se descuenta saldo ni stock hasta la entrega.
const reservaRoot=$('reserva-app');
if(reservaRoot){
  if(!selectedChild){go('pages/apoderado/inicio.html');return}
  if(selectedChild.age>=12){reservaRoot.innerHTML='<p class="form-feedback feedback-error">Esta cuenta no requiere reserva anticipada.</p>';return}
  const student=selectedChild;
  const pending=()=> (db().reservations||[]).filter(r=>['PENDIENTE','EN_PREPARACION','ETIQUETA_PENDIENTE','PREPARADA'].includes(r.status));
  const committed=()=>pending().filter(r=>r.child===student.id).reduce((sum,r)=>sum+r.total,0);
  const available=()=>Math.max(0,db().children.find(x=>x.id===student.id).balance-committed());
  const reservedStock=id=>pending().reduce((sum,r)=>sum+(r.items.find(i=>i.id===id)?.qty||0),0);
  let cart=[];let category=null;let searchTerm='';
  $('reserva-nombre').textContent=student.name;
  $('reserva-curso').textContent=`${student.course} · ${student.age} años`;
  $('reserva-avatar').textContent=student.name.charAt(0);
  $('reserva-volver').href=`hijo.html?id=${student.id}`;
  const products=db().products;
  const cartTotal=()=>cart.reduce((sum,i)=>sum+i.price*i.qty,0);
  function render(){
    $('reserva-saldo').textContent=money(available());
    $('reserva-comprometido').textContent=money(committed());
    $('reserva-total').textContent=money(cartTotal());
    $('reserva-restante').textContent=money(available()-cartTotal());
    $('reserva-confirmar').disabled=!cart.length||cartTotal()>available();
    $('reserva-categorias').innerHTML=['Todos',...new Set(products.map(p=>p.category))].map(cat=>`<button type="button" class="category-chip ${category===cat?'active':''}" data-category="${esc(cat)}" aria-pressed="${category===cat}">${esc(cat)}</button>`).join('');
    const visible=products.filter(p=>searchTerm?p.name.toLocaleLowerCase('es').includes(searchTerm.toLocaleLowerCase('es')):category==='Todos'||p.category===category).sort((a,b)=>a.name.localeCompare(b.name,'es',{sensitivity:'base'}));
    $('reserva-productos').innerHTML=(!searchTerm&&!category)?'<p class="reserva-empty">Busca un material por nombre o selecciona una categoría para ver los productos. No se muestra toda la lista automáticamente.</p>':!visible.length?'<p class="reserva-empty">No encontramos materiales con ese nombre. Prueba otra búsqueda o categoría.</p>':`<div class="reserva-list-head" aria-hidden="true"><span>Material</span><span>Precio</span><span>Cantidad</span><span>Agregar</span></div>`+visible.map(p=>{
      const left=Math.max(0,p.stock-reservedStock(p.id)-(cart.find(i=>i.id===p.id)?.qty||0));
      return `<article class="reserva-product-row"><div class="reserva-product-name"><strong>${esc(p.name)}</strong><small>${esc(p.category)} · ${left?`Disponibles: ${left}`:'Sin unidades disponibles'}</small></div><span class="reserva-product-price">${money(p.price)}</span><div class="reserva-row-qty"><label class="sr-only" for="qty-${p.id}">Cantidad de ${esc(p.name)}</label><input id="qty-${p.id}" type="number" inputmode="numeric" min="1" max="${left}" value="1" ${left?'':'disabled'}></div><button type="button" class="reserva-row-add" data-add="${p.id}" ${left?'':'disabled'}>Agregar +</button></article>`}).join('');
    $('reserva-carrito').innerHTML=cart.length?cart.map(i=>`<div class="cart-line"><div><strong>${esc(i.name)}</strong><small>${i.qty} × ${money(i.price)}</small></div><strong>${money(i.qty*i.price)}</strong><button type="button" data-remove="${i.id}" aria-label="Quitar ${esc(i.name)}">×</button></div>`).join(''):'<p class="muted">Aún no has agregado materiales.</p>';
  }
  $('reserva-categorias').addEventListener('click',e=>{const b=e.target.closest('[data-category]');if(b){category=b.dataset.category;searchTerm='';$('reserva-buscar').value='';render()}});
  $('reserva-buscar').addEventListener('input',e=>{searchTerm=e.target.value.trim();category=null;render()});
  $('reserva-productos').addEventListener('click',e=>{
    const b=e.target.closest('[data-add]');if(!b)return;
    const p=products.find(x=>x.id===Number(b.dataset.add));const field=$(`qty-${p.id}`),qty=Number(field.value);
    const error=$('reserva-error');error.textContent='';
    if(!Number.isSafeInteger(qty)||qty<1){error.textContent='Ingresa una cantidad entera mayor que cero.';return}
    if(qty>p.stock-reservedStock(p.id)-(cart.find(i=>i.id===p.id)?.qty||0)){error.textContent='No hay suficientes unidades disponibles.';return}
    if(cartTotal()+p.price*qty>available()){error.textContent='El total supera el saldo disponible para reservar.';return}
    const old=cart.find(i=>i.id===p.id);if(old)old.qty+=qty;else cart.push({id:p.id,name:p.name,price:p.price,qty});render();
  });
  $('reserva-carrito').addEventListener('click',e=>{const b=e.target.closest('[data-remove]');if(b){cart=cart.filter(i=>i.id!==Number(b.dataset.remove));$('reserva-error').textContent='';render()}});
  $('reserva-confirmar').addEventListener('click',()=>{
    const error=$('reserva-error');error.textContent='';const current=db();
    const currentStudent=current.children.find(x=>x.id===student.id);
    const pend=(current.reservations||[]).filter(r=>['PENDIENTE','EN_PREPARACION','ETIQUETA_PENDIENTE','PREPARADA'].includes(r.status));
    const committedNow=pend.filter(r=>r.child===student.id).reduce((sum,r)=>sum+r.total,0);
    const total=cartTotal();
    if(!cart.length||!currentStudent||total>currentStudent.balance-committedNow){error.textContent='No se pudo confirmar: revisa el saldo disponible.';return}
    if(cart.some(i=>{const p=current.products.find(p=>p.id===i.id);return !p||i.qty>p.stock-pend.reduce((n,r)=>n+(r.items.find(x=>x.id===i.id)?.qty||0),0)})){error.textContent='Cambió la disponibilidad de materiales. Revisa el carrito.';return}
    const ref=`RES-${Date.now()}`;
    current.reservations.push({id:ref,child:student.id,items:cart.map(i=>({...i})),total,status:'PENDIENTE',createdAt:new Date().toISOString()});
    try{localStorage.setItem(DATA,JSON.stringify(current))}catch{error.textContent='No se pudo guardar la reserva en este navegador.';return}
    $('reserva-app').classList.add('hidden');$('reserva-exito').classList.remove('hidden');
    $('reserva-codigo').textContent=ref;$('reserva-exito-total').textContent=money(total);
    $('reserva-exito-saldo').textContent=money(currentStudent.balance-committedNow-total);
    $('reserva-exito-volver').href=`hijo.html?id=${student.id}`;
    $('reserva-exito-listado').href=`mis-reservas.html?id=${student.id}`;
  });
  render();
}
const reservationsList=$('mis-reservas-list');
if(reservationsList){
  if(!selectedChild){go('pages/apoderado/inicio.html');return}
  $('mis-reservas-alumno').textContent=selectedChild.name;
  $('mis-reservas-volver').href=`hijo.html?id=${selectedChild.id}`;
  const list=(db().reservations||[]).filter(r=>r.child===selectedChild.id).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  reservationsList.innerHTML=list.length?list.map(r=>`<article class="reservation-card"><div class="reservation-heading"><strong>${esc(r.id)}</strong><span class="reservation-status">${esc(r.status)}</span></div><p>${new Intl.DateTimeFormat('es-CL',{dateStyle:'medium'}).format(new Date(r.createdAt))}</p>${r.items.map(i=>`<div class="reservation-item"><span>${esc(i.name)} · ${i.qty} unidad(es)</span><strong>${money(i.qty*i.price)}</strong></div>`).join('')}<div class="reservation-item reservation-total"><strong>${['PENDIENTE','EN_PREPARACION','ETIQUETA_PENDIENTE','PREPARADA'].includes(r.status)?'Total comprometido':'Total de materiales'}</strong><strong>${money(r.total)}</strong></div></article>`).join(''):'<p class="muted">Este alumno todavía no tiene reservas.</p>';
}

const reset=$('reset-demo');if(reset)reset.onclick=()=>{localStorage.removeItem(DATA);location.reload()};
})();