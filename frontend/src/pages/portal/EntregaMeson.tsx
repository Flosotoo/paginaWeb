import { useState, type FormEvent } from "react";
import type { Producto } from "../../services/catalogo";
import { useEntregaMeson } from "../../hooks/useEntregaMeson";
export function EntregaMeson({
  productos,
  actualizar,
}: {
  productos: Producto[];
  actualizar: () => Promise<void>;
}) {
  const {
    alumno,
    entrega,
    aviso,
    procesando,
    buscarAlumno,
    entregar,
    buscarEntrega,
    devolver,
  } = useEntregaMeson(actualizar);
  const [rut, setRut] = useState("");
  const [producto, setProducto] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [idEntrega, setIdEntrega] = useState("");
  const [detalle, setDetalle] = useState("");
  const [unidades, setUnidades] = useState("1");
  const [motivo, setMotivo] = useState("");
  const enviarBusqueda = (e: FormEvent) => {
    e.preventDefault();
    void buscarAlumno(rut.trim());
  };
  return (
    <section className="account-section">
      <div className="section-heading" style={{ marginBottom: "20px" }}>
        <div>
          <span className="eyebrow">LIBRERÍA Y MESÓN</span>
          <h2 id="entregas">Entrega y devolución</h2>
        </div>
      </div>

      {aviso && <p role="status" className="form-feedback" style={{ marginBottom: "16px" }}>{aviso}</p>}

      <div className="card">
        <span className="eyebrow">VENTA DIRECTA CON SALDO</span>
        <h3>Entrega presencial en mesón</h3>
        <p className="card-desc">Permite a los estudiantes retirar materiales con cargo directo a su saldo disponible.</p>
        <form onSubmit={enviarBusqueda} style={{ maxWidth: "480px" }}>
          <label>
            RUT del alumno
            <input
              className="input"
              value={rut}
              onChange={(e) => setRut(e.target.value)}
              required
            />
          </label>
          <div className="form-actions">
            <button className="btn" disabled={procesando}>
              Buscar alumno
            </button>
          </div>
        </form>

        {alumno && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void entregar(Number(producto), Number(cantidad));
            }}
            style={{ marginTop: "20px", padding: "16px", background: "#fbf9f5", border: "1px solid #e9e3d8", borderRadius: "14px" }}
          >
            <div style={{ marginBottom: "12px" }}>
              <span className="pill-state">ALUMNO IDENTIFICADO</span>
              <p style={{ margin: "6px 0 0", fontWeight: 700, color: "#173b31" }}>
                {alumno.nombreCompleto} · {alumno.curso} · {alumno.estado}
              </p>
            </div>
            <div className="form-grid-2">
              <label>
                Material
                <select
                  className="input"
                  value={producto}
                  onChange={(e) => setProducto(e.target.value)}
                  required
                >
                  <option value="">Selecciona</option>
                  {productos
                    .filter((p) => p.estado === "ACTIVO")
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} · {p.stockDisponible} disponibles
                      </option>
                    ))}
                </select>
              </label>
              <label>
                Unidades
                <input
                  className="input"
                  type="number"
                  min="1"
                  step="1"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  required
                />
              </label>
            </div>
            <div className="form-actions">
              <button className="btn" disabled={procesando}>
                Registrar entrega directa
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="card">
        <span className="eyebrow">REINGRESO DE MATERIALES</span>
        <h3>Devolución de entrega</h3>
        <p className="card-desc">Reintegra stock y saldo al estudiante por productos no conformes o devueltos.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void buscarEntrega(Number(idEntrega));
          }}
          style={{ maxWidth: "480px" }}
        >
          <label>
            ID de entrega
            <input
              className="input"
              type="number"
              min="1"
              value={idEntrega}
              onChange={(e) => setIdEntrega(e.target.value)}
              required
            />
          </label>
          <div className="form-actions">
            <button className="btn" disabled={procesando}>
              Consultar entrega
            </button>
          </div>
        </form>

        {entrega && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void devolver(Number(detalle), Number(unidades), motivo);
            }}
            style={{ marginTop: "20px", padding: "16px", background: "#fbf9f5", border: "1px solid #e9e3d8", borderRadius: "14px" }}
          >
            <div style={{ marginBottom: "12px" }}>
              <span className="pill-state neutral">ENTREGA #{entrega.numero}</span>
              <p style={{ margin: "6px 0 0", fontWeight: 700, color: "#173b31" }}>
                Alumno {entrega.alumnoId} · Total: ${entrega.total.toLocaleString("es-CL")}
              </p>
            </div>
            <div className="form-grid-2">
              <label>
                Material a devolver
                <select
                  className="input"
                  value={detalle}
                  onChange={(e) => setDetalle(e.target.value)}
                  required
                >
                  <option value="">Selecciona</option>
                  {entrega.items
                    .filter((i) => i.cantidad > i.cantidadDevuelta)
                    .map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.nombreProducto} · {i.cantidad - i.cantidadDevuelta}{" "}
                        disponibles
                      </option>
                    ))}
                </select>
              </label>
              <label>
                Unidades a devolver
                <input
                  className="input"
                  type="number"
                  min="1"
                  step="1"
                  value={unidades}
                  onChange={(e) => setUnidades(e.target.value)}
                  required
                />
              </label>
            </div>
            <label>
              Motivo de devolución
              <input
                className="input"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                required
              />
            </label>
            <div className="form-actions">
              <button className="btn" disabled={procesando}>
                Registrar devolución
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
