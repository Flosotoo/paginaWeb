import { useState } from "react";
import type { Cuenta, MovimientoSaldo, Abono } from "../../services/familia";

type Consulta<T> = { datos: T | null; cargando: boolean; error: string | null };
interface Props {
  cuenta: Consulta<Cuenta>;
  movimientos: Consulta<MovimientoSaldo[]>;
  abonos: Consulta<Abono[]>;
  esApoderado: boolean;
  volver: () => void;
}
const pesos = (n: number) => `$${Math.abs(n).toLocaleString("es-CL")}`;
const fechaLocal = (valor: string) => {
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};
function clasificar(m: MovimientoSaldo) {
  const tipo = m.tipo.toUpperCase();
  if (tipo === "LIBERACION_RESERVA" || tipo.includes("LIBERACION")) return { grupo: "reservas", concepto: "Liberación de reserva", monto: pesos(m.monto), nota: "Liberado", clase: "retencion" };
  if (tipo === "RESERVA" || tipo.includes("RETENCION") || tipo.includes("COMPROMISO")) return { grupo: "reservas", concepto: "Reserva de materiales", monto: pesos(m.monto), nota: "Retenido", clase: "retencion" };
  if (tipo === "ABONO" || tipo === "DEVOLUCION") return { grupo: "abonos", concepto: tipo === "ABONO" ? "Abono de saldo" : "Reintegro por devolución", monto: `+${pesos(m.monto)}`, nota: "", clase: "abono" };
  if (tipo === "ENTREGA") return { grupo: "cargos", concepto: "Entrega de materiales", monto: `−${pesos(m.monto)}`, nota: "", clase: "cargo" };
  return { grupo: "otros", concepto: m.tipo.replace(/_/g, " "), monto: m.monto < 0 ? `−${pesos(m.monto)}` : pesos(m.monto), nota: "", clase: "" };
}
export function CartolaFamilia({ cuenta, movimientos, abonos, esApoderado, volver }: Props) {
  const [tipo, setTipo] = useState("todos");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const fechaValida = (fecha: string) => (!desde || fechaLocal(fecha) >= desde) && (!hasta || fechaLocal(fecha) <= hasta);
  const filas = [...(movimientos.datos ?? [])].sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime() || b.id-a.id).filter(m => fechaValida(m.fecha) && (tipo === "todos" || clasificar(m).grupo === tipo));
  const noAcreditados = (abonos.datos ?? []).filter(a => !["APROBADO", "CONFIRMADO"].includes(a.estado.toUpperCase()) && fechaValida(a.fechaCreacion)).sort((a,b) => new Date(b.fechaCreacion).getTime()-new Date(a.fechaCreacion).getTime());
  return <section className="account-section cartola-familia">
    {!esApoderado && <button type="button" className="back-link secondary" onClick={volver}>← Volver a Mi Cuenta</button>}
    <div className="section-heading"><div><span className="eyebrow">FINANZAS</span><h2>Cartola de movimientos</h2></div></div>
    {cuenta.error && <p role="alert">{cuenta.error}</p>}
    <div className="family-v4-balance"><small>Saldo disponible</small><strong>{cuenta.datos ? pesos(cuenta.datos.saldoDisponible) : "—"}</strong><small>Saldo total: {cuenta.datos ? pesos(cuenta.datos.saldoActual) : "—"} · Comprometido: {cuenta.datos ? pesos(cuenta.datos.saldoComprometido) : "—"}</small></div>
    <div className="cartola-filtros">
      <label>Tipo de movimiento<select value={tipo} onChange={e=>setTipo(e.target.value)}><option value="todos">Todos los movimientos</option><option value="abonos">Abonos y reintegros</option><option value="cargos">Cargos</option><option value="reservas">Reservas y liberaciones</option><option value="otros">Otros movimientos</option></select></label>
      <div className="cartola-fechas"><label>Desde<input type="date" value={desde} onChange={e=>setDesde(e.target.value)}/></label><label>Hasta<input type="date" value={hasta} onChange={e=>setHasta(e.target.value)}/></label></div>
      {(tipo !== "todos" || desde || hasta) && <button type="button" className="btn secondary" onClick={()=>{setTipo("todos");setDesde("");setHasta("");}}>Limpiar filtros</button>}
    </div>
    {desde && hasta && desde > hasta && <p role="alert">La fecha inicial debe ser anterior o igual a la final.</p>}
    {movimientos.error && <p role="alert">{movimientos.error}</p>}
    {movimientos.cargando && <p role="status">Cargando movimientos…</p>}
    {!movimientos.cargando && !movimientos.error && movimientos.datos && <>
      <p className="muted cartola-nota">Las reservas retienen saldo, pero no son cobros. La columna saldo muestra el saldo total después de cada operación.</p>
      {filas.length ? <div className="cartola-tabla"><table><thead><tr><th scope="col">Fecha / Concepto</th><th scope="col">Monto</th><th scope="col">Saldo total</th></tr></thead><tbody>{filas.map(m=>{const v=clasificar(m);return <tr key={m.id}><td><small>{fechaLocal(m.fecha) ? new Date(m.fecha).toLocaleDateString("es-CL") : "Sin fecha"}</small><strong>{v.concepto}</strong></td><td className={v.clase}><strong>{v.monto}</strong>{v.nota && <small>{v.nota}</small>}</td><td>{pesos(m.saldoResultante)}</td></tr>;})}</tbody></table></div> : <p>No hay movimientos para los filtros seleccionados.</p>}
    </>}
    {esApoderado && abonos.error && <p role="alert">No se pudieron consultar los pagos: {abonos.error}</p>}
    {esApoderado && noAcreditados.length > 0 && <details className="cartola-pagos"><summary>Pagos no acreditados ({noAcreditados.length})</summary><p>Estos pagos no forman parte del saldo de la cuenta.</p>{noAcreditados.map(a=><p key={a.id}>{new Date(a.fechaCreacion).toLocaleDateString("es-CL")} · {pesos(a.monto)} · <span className="cartola-pago-estado">{a.estado.toUpperCase() === "RECHAZADO" ? "Pago rechazado" : a.estado.toUpperCase() === "PENDIENTE" ? "Pago pendiente" : a.estado.replace(/_/g, " ")}</span></p>)}</details>}
  </section>;
}
