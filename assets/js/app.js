/* EduSaldo 2.0 · Etapa 2. Interfaz y selección de alumno con datos ficticios. */
(()=>{'use strict';
const KEY='edusaldo2_sesion',DATA='edusaldo2_demo',SELECT='edusaldo2_hijo';
const users=[{mail:'apoderado@edusaldo.cl',pass:'1234',name:'Pamela',role:'apoderado'},{mail:'encargado@edusaldo.cl',pass:'1234',name:'Encargado',role:'libreria'},{mail:'admin@edusaldo.cl',pass:'1234',name:'Administrador',role:'administrador'}];
const seed={children:[{id:1,name:'Sofía Pérez',age:9,course:'3° Básico',balance:18000},{id:2,name:'Tomás Pérez',age:13,course:'8° Básico',balance:12500}],movements:[{child:1,type:'Aporte de saldo',date:'2026-09-20',amount:10000},{child:1,type:'Entrega de materiales',date:'2026-09-19',amount:-2500},{child:2,type:'Aporte de saldo',date:'2026-09-18',amount:12500},{child:1,type:'Aporte de saldo',date:'2026-09-15',amount:5000},{child:2,type:'Entrega de materiales',date:'2026-09-12',amount:-1800}]};
const $=id=>document.getElementById(id),money=n=>'$'+Math.trunc(Number(n)||0).toString().replace(/\B(?=(\d{3})+(?!\d))/g,'.');const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function db(){try{const stored=JSON.parse(localStorage.getItem(DATA));return stored?.children&&stored?.movements?stored:structuredClone(seed)}catch{return structuredClone(seed)}}function session(){try{return JSON.parse(sessionStorage.getItem(KEY))}catch{return null}}function root(){return document.body.dataset.root||'./'}function go(path){location.href=root()+path}
const login=$('login-form');if(login){login.addEventListener('submit',e=>{e.preventDefault();const mail=$('correo').value.trim().toLowerCase(),pass=$('clave').value;const u=users.find(x=>x.mail===mail&&x.pass===pass);if(!u){$('login-error').textContent='Revisa el correo y la contraseña de demostración.';$('login-error').classList.remove('hidden');return}sessionStorage.setItem(KEY,JSON.stringify({name:u.name,role:u.role}));const routes={apoderado:'pages/apoderado/inicio.html',libreria:'pages/libreria/inicio.html',administrador:'pages/administrador/inicio.html'};go(routes[u.role])})}
const required=document.body.dataset.role;if(required){const s=session();if(!s||s.role!==required){go('index.html');return}document.querySelectorAll('[data-user]').forEach(n=>n.textContent=s.name);document.querySelectorAll('[data-initial]').forEach(n=>n.textContent=s.name.charAt(0));const logout=$('logout');if(logout)logout.onclick=()=>{sessionStorage.removeItem(KEY);go('index.html')}}
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
    {icon:'＋',name:'Aportar saldo',status:'Continuar',enabled:true,url:`aportar-saldo.html?id=${c.id}`},
    ...(c.age<12?[{icon:'▤',name:'Reservar materiales',status:'Próximamente',enabled:false}]:[]),
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
    current.movements.push({child:c.id,type:'Aporte de saldo',date:new Intl.DateTimeFormat('en-CA',{timeZone:'America/Santiago',year:'numeric',month:'2-digit',day:'2-digit'}).format(now),createdAt:now.toISOString(),amount:n,reference:`SIM-${Date.now()}`});
    try{localStorage.setItem(DATA,JSON.stringify(current))}catch{$('pago-step').classList.add('hidden');$('aporte-step').classList.remove('hidden');feedback.textContent='No se pudo guardar el aporte. Comprueba el almacenamiento del navegador.';feedback.className='form-feedback feedback-error';return}
    $('pago-step').classList.add('hidden');$('aporte-ok').classList.remove('hidden');
    $('aporte-ok-monto').textContent=money(n);$('aporte-ok-saldo').textContent=money(student.balance);$('aporte-saldo').textContent=money(student.balance);
    $('aporte-ok-cuenta').href=`hijo.html?id=${c.id}`;$('aporte-ok-cartola').href=`movimientos.html?id=${c.id}`;
  });
}
const reset=$('reset-demo');if(reset)reset.onclick=()=>{localStorage.removeItem(DATA);location.reload()};
})();