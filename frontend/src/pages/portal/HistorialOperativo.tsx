import { useCallback, useState } from "react";
import { useConsulta } from "../../hooks/useConsulta";
import { catalogoService } from "../../services/catalogo";
import { entregasService } from "../../services/entregas";
import type { ConsultaMovimientos } from "../../hooks/usePortalInterno";

export function HistorialOperativo({ movimientos }: { movimientos: ConsultaMovimientos }) {
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "14px" }}>
          <div>
            <span className="eyebrow">LIBRO DE BODEGA</span>
            <h3 style={{ margin: "2px 0 4px" }}>Movimientos de inventario</h3>
            <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.88rem" }}>
              Registro de ingresos, reservas, entregas y ajustes.
            </p>
          </div>
          <button className="btn secondary" onClick={() => void movimientos.recargar()}>
            Actualizar movimientos
          </button>
        </div>

        {movimientos.error && <p role="alert">{movimientos.error}</p>}
        {movimientos.datos?.length === 0 && <p>No hay movimientos.</p>}

        <div className="audit-feed">
          {movimientos.datos?.map((m) => (
            <div key={m.id} className="audit-card">
              <div className="audit-card-top">
                <span className={`pill-state ${m.tipo === "INGRESO" ? "" : m.tipo === "AJUSTE" ? "warn" : "neutral"}`}>
                  {m.tipo}
                </span>
                <span>{m.fecha}</span>
                <span>Responsable: {m.responsableId ?? "no informado"}</span>
              </div>
              <strong>{m.nombreProducto}</strong>
              <div style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                Físico: {m.variacionFisica} · Reservado: {m.variacionReservada} · Stock resultante: {m.stockResultante}
              </div>
            </div>
          ))}
        </div>
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
