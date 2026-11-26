import { useEffect, useId, useRef, useState } from "react";
import "./modalConfirmacion.css";
import "./nominaUsuarios.css";

type Credencial = { nombre: string; identificador: string; clave: string };
export function ModalCredenciales({ credenciales, finalizar }: { credenciales: Credencial[]; finalizar: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const tituloId = useId();
  const [visibles, setVisibles] = useState<Record<number, boolean>>({});
  const [aviso, setAviso] = useState("");
  useEffect(() => {
    const el = ref.current;
    if (el && !el.open) el.showModal();
    return () => { if (el?.open) el.close(); };
  }, []);
  async function copiar(texto: string) {
    try { await navigator.clipboard.writeText(texto); setAviso("Copiado. Entrega los datos de forma privada."); }
    catch { setAviso("No se pudo copiar. Puedes mostrar la clave y copiarla manualmente."); }
  }
  return <dialog ref={ref} className="edu-confirmacion edu-credenciales" aria-labelledby={tituloId} onCancel={e => { e.preventDefault(); finalizar(); }}>
    <header className="edu-confirmacion-titulo"><span aria-hidden="true">✓</span><h2 id={tituloId}>Credenciales de acceso</h2></header>
    <p>Entrega las claves de forma privada. El primer acceso requiere cambiar la contraseña.</p>
    <div className="edu-credenciales-lista">{credenciales.map((c, i) => <section key={`${c.identificador}-${i}`} className="edu-credencial">
      <h3>{c.nombre}</h3>
      <label>Usuario de acceso</label><div className="edu-credencial-campo"><span>{c.identificador}</span></div>
      <label>Contraseña temporal</label><div className="edu-credencial-campo"><span>{visibles[i] ? c.clave : "••••••••••••"}</span><button type="button" className="btn secondary" aria-pressed={Boolean(visibles[i])} onClick={() => setVisibles(v => ({...v, [i]: !v[i]}))}>{visibles[i] ? "Ocultar" : "Mostrar"}</button></div>
      <button type="button" className="btn secondary" onClick={() => void copiar(`Usuario: ${c.identificador}\nContraseña temporal: ${c.clave}`)}>Copiar credenciales</button>
    </section>)}</div>
    {aviso && <p role="status">{aviso}</p>}
    <p className="edu-confirmacion-detalle">Al finalizar, las claves dejarán de estar disponibles en esta pantalla.</p>
    <div className="edu-confirmacion-acciones"><button type="button" className="btn" onClick={finalizar}>Finalizar</button></div>
  </dialog>;
}
