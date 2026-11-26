import { useCallback, useState } from "react";
import { useConsulta } from "../../hooks/useConsulta";
import { catalogoService } from "../../services/catalogo";
import { entregasService } from "../../services/entregas";
import type { ConsultaMovimientos } from "../../hooks/usePortalInterno";

export function HistorialOperativo() {
  const cargarCriticos = useCallback(() => catalogoService.criticos(), []);
  const criticos = useConsulta(cargarCriticos);
  const cargarEntregas = useCallback(() => entregasService.historial(), []);
  const entregas = useConsulta(cargarEntregas);
  const [fecha, setFecha] = useState("");
  const [alumno, setAlumno] = useState("");
  const [origen, setOrigen] = useState("");
  const entregasFiltradas = entregas.datos?.filter((e) =>
    (!fecha || e.fecha.startsWith(fecha)) &&
    (!alumno || String(e.alumnoId) === alumno) &&
    (!origen || e.origen === origen),
  );

  return (
    <section className="account-section">
      <div className="section-heading" style={{ marginBottom: "20px" }}>
        <div>
          <span className="eyebrow">TRAZABILIDAD Y REGISTROS</span>
          <h2 id="historial">Historial operativo</h2>
        </div>
      </div>

      <div className="card">
        <span className="eyebrow">ALERTAS DE BODEGA</span>
        <h3>Stock crítico</h3>
        <p className="card-desc">Materiales con existencias disponibles iguales o menores al umbral de seguridad.</p>
        {criticos.error && <p role="alert">{criticos.error}</p>}
        {criticos.datos?.length === 0 && (
          <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>No hay productos bajo el umbral.</p>
        )}
        {criticos.datos && criticos.datos.length > 0 && (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Disponible</th>
                  <th>Umbral crítico</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {criticos.datos.map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.nombre}</strong></td>
                    <td>{p.stockDisponible}</td>
                    <td>{p.stockCritico}</td>
                    <td><span className="pill-state bad">Bajo umbral</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <span className="eyebrow">RETIROS DE MATERIALES</span>
        <h3>Historial de entregas</h3>
        <p className="card-desc">Consulta entregas presenciales en mesón y retiros por reserva web.</p>

        <div className="form-grid-3">
          <label>
            Fecha de entrega
            <input
              className="input"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </label>
          <label>
            Identificador del alumno
            <input
              className="input"
              inputMode="numeric"
              value={alumno}
              onChange={(e) => setAlumno(e.target.value)}
            />
          </label>
          <label>
            Tipo de entrega
            <select
              className="input"
              value={origen}
              onChange={(e) => setOrigen(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="RESERVA">Reserva</option>
              <option value="MESON">Mesón</option>
            </select>
          </label>
        </div>

        <div className="form-actions" style={{ marginBottom: "20px" }}>
          <button className="btn" onClick={() => void entregas.recargar()}>
            Actualizar entregas
          </button>
        </div>

        {entregas.error && <p role="alert">{entregas.error}</p>}
        {entregasFiltradas?.length === 0 && (
          <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>No hay entregas para los filtros seleccionados.</p>
        )}

        <div style={{ display: "grid", gap: "12px" }}>
          {entregasFiltradas?.map((e) => (
            <article
              key={e.id}
              style={{
                padding: "16px",
                borderRadius: "14px",
                background: "#fbf9f5",
                border: "1px solid #e9e3d8",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                <span style={{ fontWeight: 800, color: "#173b31" }}>
                  {e.numero} · <span className="pill-state neutral">{e.origen}</span>
                </span>
                <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>{e.fecha}</span>
              </div>
              <p style={{ margin: "6px 0 10px", fontSize: "0.9rem", color: "#374a41" }}>
                Alumno {e.alumnoId} · Encargado {e.encargadoId} · <strong>${e.total.toLocaleString("es-CL")}</strong>
              </p>
              <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "0.85rem", color: "#55645d" }}>
                {e.items.map((item) => (
                  <li key={item.id}>
                    {item.nombreProducto} · cantidad {item.cantidad} · devueltos {item.cantidadDevuelta}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function MovimientosInventario({ movimientos }: { movimientos: ConsultaMovimientos }) {
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [tipo, setTipo] = useState("");
  const [buscar, setBuscar] = useState("");
  const normalizar = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const valido = !desde || !hasta || desde <= hasta;
  const filas = [...(movimientos.datos ?? [])].filter(m =>
    valido && m.variacionFisica !== 0 &&
    (!desde || m.fecha.slice(0, 10) >= desde) && (!hasta || m.fecha.slice(0, 10) <= hasta) &&
    (!tipo || (tipo === "INGRESO" ? m.variacionFisica > 0 : m.variacionFisica < 0)) &&
    normalizar(m.nombreProducto).includes(normalizar(buscar.trim()))
  ).sort((a,b) => b.fecha.localeCompare(a.fecha) || b.id - a.id);
  const exportar = () => {
    const celda = (v: unknown) => '"' + String(v ?? "").replace(/^[=+@\-\t\r]/, "'$&").replace(/"/g, '""') + '"';
    const csv = "\uFEFF" + [["Fecha", "Producto", "Motivo", "Ingreso", "Egreso", "Stock final", "Responsable"], ...filas.map(m => [m.fecha, m.nombreProducto, m.tipo, Math.max(0,m.variacionFisica), Math.max(0,-m.variacionFisica), m.stockResultante, m.responsableId])].map(r => r.map(celda).join(";")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], {type: "text/csv;charset=utf-8"}));
    const a = document.createElement("a"); a.href = url; a.download = "movimientos-inventario.csv"; a.click(); URL.revokeObjectURL(url);
  };
  return <div className="card">
    <div style={{background:"#e6dac6",borderRadius:16,padding:20,marginBottom:16}}>
      <span className="eyebrow">LIBRO DE BODEGA</span><h3 style={{margin:"4px 0"}}>Movimientos de inventario</h3>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(145px,1fr))",gap:12,alignItems:"end",marginBottom:16}}>
      <label>Desde<input className="input" type="date" value={desde} onChange={e=>setDesde(e.target.value)}/></label>
      <label>Hasta<input className="input" type="date" value={hasta} onChange={e=>setHasta(e.target.value)}/></label>
      <label>Movimiento<select className="input" value={tipo} onChange={e=>setTipo(e.target.value)}><option value="">Todos</option><option value="INGRESO">Ingresos</option><option value="EGRESO">Egresos</option></select></label>
      <label>Producto<input className="input" value={buscar} onChange={e=>setBuscar(e.target.value)}/></label>
      <button type="button" className="btn" onClick={()=>void movimientos.recargar()}>Actualizar</button>
      <button type="button" className="btn secondary" disabled={!filas.length || !!movimientos.error} onClick={exportar}>Exportar CSV</button>
    </div>
    {!valido && <p role="alert">Período inválido.</p>}
    {movimientos.error && <p role="alert">{movimientos.error}</p>}
    {valido && !movimientos.error && <div className="data-table-container"><table className="data-table"><thead><tr><th>Fecha</th><th>Producto</th><th>Motivo</th><th>Ingreso</th><th>Egreso</th><th>Stock final</th><th>Responsable</th></tr></thead><tbody>
      {filas.map(m=><tr key={m.id}><td style={{whiteSpace:"nowrap"}}>{m.fecha.slice(0,10).split("-").reverse().join("-")}</td><td>{m.nombreProducto}</td><td>{({INGRESO:"Ingreso",ENTREGA:"Entrega",DEVOLUCION:"Devolución",COMPENSACION:"Compensación",AJUSTE:"Ajuste"} as Record<string,string>)[m.tipo] ?? m.tipo}</td><td style={{color:"#18543c",fontWeight:700}}>{m.variacionFisica>0 ? m.variacionFisica : "—"}</td><td style={{color:"#9c2e22",fontWeight:700}}>{m.variacionFisica<0 ? -m.variacionFisica : "—"}</td><td>{m.stockResultante}</td><td>{m.responsableId ?? "—"}</td></tr>)}
      {!filas.length && <tr><td colSpan={7}>{movimientos.datos ? "Sin movimientos físicos para los filtros." : "Consultando movimientos…"}</td></tr>}
    </tbody></table></div>}
  </div>;
}
