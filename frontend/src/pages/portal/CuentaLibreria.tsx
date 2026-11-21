import { useEffect, useMemo, useState } from "react";
import { mensajeError } from "../../services/api";
import { cuentaLibreriaService } from "../../services/cuentaLibreria";
import type { MovimientoLibreria, ResumenCuentaLibreria } from "../../services/cuentaLibreria";
import "./cuentaLibreria.css";

const pesos = (valor: number) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(valor);
const hoy = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; };
const fechaLocal = (valor: string) => {
  const [a, m, d] = valor.slice(0, 10).split("-");
  return `${d}-${m}-${a}`;
};
const csvCelda = (valor: string | number) => `"${String(valor).replace(/^[=+@\-\t\r]/, "'$&").replace(/"/g, '""')}"`;

export function CuentaLibreria() {
  const [mes, setMes] = useState(hoy);
  const [tipo, setTipo] = useState("TODOS");
  const [busqueda, setBusqueda] = useState("");
  const [resumen, setResumen] = useState<ResumenCuentaLibreria | null>(null);
  const [movimientos, setMovimientos] = useState<MovimientoLibreria[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const desde = `${mes}-01`;
  const hasta = `${mes}-${String(new Date(Number(mes.slice(0, 4)), Number(mes.slice(5, 7)), 0).getDate()).padStart(2, "0")}`;

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setError("");
    setResumen(null);
    setMovimientos([]);
    cuentaLibreriaService.consultar(desde, hasta)
      .then((datos) => { if (activo) { setResumen(datos.resumen); setMovimientos(datos.movimientos); } })
      .catch((e: unknown) => { if (activo) setError(mensajeError(e)); })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, [desde, hasta, revision]);

  const filtrados = useMemo(() => movimientos.filter((m) => {
    if (tipo !== "TODOS" && m.tipo !== tipo) return false;
    const q = busqueda.trim().toLowerCase();
    return !q || [m.referencia, m.detalle, String(m.alumnoId)].some((s) => s.toLowerCase().includes(q));
  }), [movimientos, tipo, busqueda]);

  const descargar = () => {
    const filas = [
      ["Fecha", "Tipo", "Referencia", "Alumno", "Detalle", "Monto CLP"],
      ...filtrados.map((m) => [fechaLocal(m.fecha), m.tipo, m.referencia, m.alumnoId, m.detalle, m.monto]),
    ];
    const csv = "\uFEFF" + filas.map((fila) => fila.map(csvCelda).join(";")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = `cuenta-libreria-${mes}.csv`;
    enlace.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="cuenta-libreria">
      <div className="section-heading"><div><span className="eyebrow">CONTROL FINANCIERO</span><h2>Cuenta Librería</h2><p>Cartola mensual de abonos, entregas y devoluciones registradas.</p></div></div>
      <div className="cl-filtros card">
        <label>Período <input type="month" value={mes} onChange={(e) => setMes(e.target.value)} /></label>
        <label>Movimiento <select value={tipo} onChange={(e) => setTipo(e.target.value)}><option value="TODOS">Todos</option><option value="ABONO">Abonos</option><option value="VENTA">Ventas</option><option value="DEVOLUCION">Devoluciones</option></select></label>
        <label>Buscar <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Alumno, concepto o referencia" /></label>
        <button type="button" className="btn secondary" onClick={() => setRevision((v) => v + 1)} disabled={cargando}>Actualizar</button>
      </div>
      {cargando && <p role="status">Consultando movimientos…</p>}
      {error && <p className="form-feedback error" role="alert">No se pudo cargar la cartola: {error}</p>}
      {!cargando && !error && resumen && <>
        <div className="cl-resumen">
          <article><span>Abonos del período</span><strong>{pesos(resumen.totalAbonadoPeriodo ?? 0)}</strong></article>
          <article><span>Entregas cobradas</span><strong>{pesos(resumen.totalEntregasPeriodo ?? 0)}</strong></article>
          <article><span>Reintegros por devoluciones</span><strong>{pesos(resumen.totalReintegrosDevolucion ?? 0)}</strong></article>
          <article><span>Ventas netas estimadas*</span><strong>{pesos((resumen.totalEntregasPeriodo ?? 0) - (resumen.totalReintegrosDevolucion ?? 0))}</strong></article>
        </div>
        <p className="cl-nota">* Ventas netas calculadas con el resumen de movimientos del backend. No representan utilidad ni saldo de caja. Los saldos de alumnos son cuentas distintas de los ingresos por ventas.</p>
        <div className="card">
          <div className="cl-encabezado"><div><h3>Cartola de movimientos</h3><p className="card-desc">Del {fechaLocal(desde)} al {fechaLocal(hasta)} · {filtrados.length} movimientos</p></div><button type="button" className="btn secondary" onClick={descargar} disabled={filtrados.length === 0}>Exportar CSV para Excel</button></div>
          <div className="data-table-container"><table className="data-table"><thead><tr><th>Fecha</th><th>Tipo</th><th>Referencia</th><th>Alumno</th><th>Concepto</th><th>Monto</th></tr></thead><tbody>
            {filtrados.map((m) => <tr key={m.clave}><td>{fechaLocal(m.fecha)}</td><td><span className="pill-state">{m.tipo}</span></td><td>{m.referencia}</td><td>{m.alumnoId}</td><td>{m.detalle}</td><td className="cl-monto">{m.tipo === "DEVOLUCION" ? "−" : "+"}{pesos(Math.abs(m.monto))}</td></tr>)}
            {filtrados.length === 0 && <tr><td colSpan={6}>No hay movimientos que coincidan con los filtros.</td></tr>}
          </tbody></table></div>
        </div>
        <p className="cl-nota">La cartola muestra abonos aprobados, entregas y devoluciones con operación completada. El resumen proviene del servicio de saldos; pueden existir diferencias de fecha entre el registro de un abono y su acreditación. Los costos de compra y la utilidad requieren un registro adicional.</p>
      </>}
    </div>
  );
}
