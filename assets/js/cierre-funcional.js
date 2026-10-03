/* EduSaldo 2.0 · Etapa 38 · Cierre funcional del prototipo previo a microservicios. */
(()=>{'use strict';
const DATA='edusaldo2_demo', CFG='edusaldo2_config_funcional', AUD='edusaldo2_auditoria', USERS='edusaldo2_users';
const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}},write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const now=()=>new Date().toISOString(), money=n=>'$'+Math.trunc(Number(n)||0).toLocaleString('es-CL');
const cfg=()=>({...{lowBalanceThreshold:3000,reviewDays:3},...read(CFG,{})});
function audit(action,entity,id,before=null,after=null){const a=read(AUD,[]);let s={name:'Sistema',role:'SISTEMA'};try{s=JSON.parse(sessionStorage.getItem('edusaldo2_sesion'))||s}catch{};a.push({id:`AUD-${Date.now()}`,at:now(),user:s.name,role:s.role,action,entity,entityId:id,before,after});write(AUD,a)}
window.EduSaldoFunctional={read,write,audit,cfg,keys:{DATA,CFG,AUD,USERS}};
function lowBalance(){if(document.body.dataset.role!=='apoderado')return;const d=read(DATA,null);if(!d?.children)return;const threshold=cfg().lowBalanceThreshold;d.lowBalanceAlerts??={};let changed=false;const activeReservations=(d.reservations||[]).filter(r=>['PENDIENTE','EN_PREPARACION','ETIQUETA_PENDIENTE','PREPARADA','LISTA_PARA_RETIRO'].includes(r.status));const alerts=[];
for(const c of d.children.filter(x=>x.active!==false)){const committed=activeReservations.filter(r=>r.child===c.id).reduce((n,r)=>n+Number(r.total||0),0),available=Number(c.balance||0)-committed,key=String(c.id),prev=d.lowBalanceAlerts[key];if(available<=threshold){alerts.push({c,available});if(!prev?.active){d.lowBalanceAlerts[key]={active:true,emailedAt:now()};changed=true;audit('ALERTA_SALDO_BAJO_EMAIL_SIMULADO','ALUMNO',c.id,null,{saldoDisponible:available,umbral:threshold})}}else if(prev?.active){d.lowBalanceAlerts[key]={...prev,active:false,resolvedAt:now()};changed=true}}
if(changed)write(DATA,d);if(alerts.length){const main=document.querySelector('main');if(main){const box=document.createElement('section');box.className='functional-alert';box.innerHTML=`<strong>⚠ Saldo bajo</strong><p>${alerts.map(x=>`${x.c.name}: <b>${money(x.available)}</b>`).join(' · ')}. El aviso permanecerá visible hasta que el saldo disponible supere ${money(threshold)}. Se genera un solo correo por cada episodio de saldo bajo.</p>`;main.insertBefore(box,main.firstChild)}}}
function migrate(){const d=read(DATA,null);if(!d)return;let ch=false;for(const c of d.children||[]){if(c.active===undefined){c.active=true;ch=true}}for(const r of d.reservations||[]){if(r.status==='PREPARADA'){r.status='LISTA_PARA_RETIRO';ch=true}}if(ch)write(DATA,d)}
migrate();lowBalance();
})();
