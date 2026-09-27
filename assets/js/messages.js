/* EduSaldo · mensajes visuales, sin bibliotecas externas */
(()=>{'use strict';
  let queue=Promise.resolve();
  function toast(message,type='success'){
    let host=document.getElementById('es-toast-host');
    if(!host){host=document.createElement('div');host.id='es-toast-host';host.className='es-toast-host';host.setAttribute('aria-live','polite');document.body.append(host)}
    const el=document.createElement('div');el.className='es-toast es-toast-'+(type==='error'?'error':type==='warning'?'warning':'success');el.setAttribute('role',type==='error'?'alert':'status');
    const symbol=document.createElement('span');symbol.className='es-toast-symbol';symbol.textContent=type==='error'?'!':type==='warning'?'!':'✓';
    const text=document.createElement('span');text.textContent=String(message);
    const close=document.createElement('button');close.type='button';close.className='es-toast-close';close.textContent='×';close.setAttribute('aria-label','Cerrar notificación');
    const dismiss=()=>{el.classList.add('es-toast-out');setTimeout(()=>el.remove(),220)};
    close.addEventListener('click',dismiss);el.append(symbol,text,close);host.append(el);
    setTimeout(dismiss,5000);
  }
  function showConfirm({title='Confirmar acción',message='',confirmText='Confirmar',cancelText='Cancelar'}={}){
    return new Promise(resolve=>{
      const previous=document.activeElement;
      const overlay=document.createElement('div');overlay.className='es-dialog-overlay';
      const panel=document.createElement('section');panel.className='es-dialog';panel.setAttribute('role','alertdialog');panel.setAttribute('aria-modal','true');
      const heading=document.createElement('h2');heading.id='es-dialog-heading';heading.textContent=title;panel.setAttribute('aria-labelledby',heading.id);
      const body=document.createElement('p');body.id='es-dialog-message';body.textContent=message;panel.setAttribute('aria-describedby',body.id);
      const badge=document.createElement('div');badge.className='es-dialog-icon';badge.textContent='?';badge.setAttribute('aria-hidden','true');
      const actions=document.createElement('div');actions.className='es-dialog-actions';
      const cancel=document.createElement('button');cancel.type='button';cancel.className='es-dialog-cancel';cancel.textContent=cancelText;
      const ok=document.createElement('button');ok.type='button';ok.className='es-dialog-ok';ok.textContent=confirmText;
      let finished=false;
      const finish=result=>{if(finished)return;finished=true;document.removeEventListener('keydown',keys,true);overlay.remove();previous?.focus?.();resolve(result)};
      const keys=e=>{if(e.key==='Escape'){e.preventDefault();finish(false)}else if(e.key==='Tab'){const target=e.shiftKey?cancel:ok;if(document.activeElement===target){e.preventDefault();(e.shiftKey?ok:cancel).focus()}}};
      cancel.addEventListener('click',()=>finish(false));ok.addEventListener('click',()=>finish(true));
      overlay.addEventListener('click',e=>{if(e.target===overlay)finish(false)});
      actions.append(cancel,ok);panel.append(badge,heading,body,actions);overlay.append(panel);document.body.append(overlay);
      document.addEventListener('keydown',keys,true);cancel.focus();
    });
  }
  // Encola confirmaciones para evitar diálogos simultáneos.
  const confirm=options=>{const result=queue.then(()=>showConfirm(options));queue=result.then(()=>undefined,()=>undefined);return result};
  window.EduSaldoUI={toast,confirm};
})();
