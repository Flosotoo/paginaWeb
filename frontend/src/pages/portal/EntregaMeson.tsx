import { useState, useEffect, type FormEvent } from "react";
import type { Producto } from "../../services/catalogo";
import { useEntregaMeson } from "../../hooks/useEntregaMeson";
import { familiaService, type Cuenta } from "../../services/familia";

const pesos = (valor: number) => `$${valor.toLocaleString("es-CL")}`;

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
  const [filtroRapido, setFiltroRapido] = useState("");
  const [cuentaAlumno, setCuentaAlumno] = useState<Cuenta | null>(null);

  useEffect(() => {
    if (alumno?.id) {
      void familiaService
        .cuenta(alumno.id)
        .then((c) => setCuentaAlumno(c))
        .catch(() => setCuentaAlumno(null));
    } else {
      setCuentaAlumno(null);
    }
  }, [alumno?.id]);

  const enviarBusqueda = (e: FormEvent) => {
    e.preventDefault();
    void buscarAlumno(rut.trim());
  };

  const productoSeleccionado = productos.find((p) => String(p.id) === String(producto));
  const cantidadNum = Math.max(1, parseInt(cantidad, 10) || 1);
  const totalMateriales = productoSeleccionado ? productoSeleccionado.precio * cantidadNum : 0;
  const saldoDisp = cuentaAlumno?.saldoDisponible ?? 0;
  const saldoFinal = saldoDisp - totalMateriales;
  const saldoInsuficiente = Boolean(alumno && cuentaAlumno && totalMateriales > saldoDisp);

  const productosFiltrados = productos
    .filter((p) => p.estado === "ACTIVO")
    .filter((p) =>
      !filtroRapido.trim()
        ? true
        : `${p.nombre} ${p.categoria ?? ""} ${p.sku ?? ""}`
            .toLocaleLowerCase("es-CL")
            .includes(filtroRapido.trim().toLocaleLowerCase("es-CL")),
    );

  return (
    <section className="account-section">
      <div className="section-heading" style={{ marginBottom: "20px" }}>
        <div>
          <span className="eyebrow">LIBRERÍA Y MESÓN</span>
          <h2 id="entregas">Entrega y devolución</h2>
        </div>
      </div>

      {aviso && <p role="status" className="form-feedback" style={{ marginBottom: "16px" }}>{aviso}</p>}

      {/* Disposición a 2 Columnas para Entrega Directa */}
      <div className="card" style={{ padding: "24px" }}>
        <span className="eyebrow">VENTA DIRECTA CON SALDO</span>
        <h3 style={{ margin: "4px 0 10px" }}>Entrega presencial en mesón</h3>
        <p className="card-desc">Permite a los estudiantes retirar materiales con cargo directo a su saldo disponible.</p>

        <div className="direct-layout">
          <div className="direct-main">
            {/* Paso 1: Identificación del Estudiante */}
            <div className="direct-step">
              <span className="eyebrow">PASO 1</span>
              <h2 style={{ fontSize: "1.15rem", margin: "4px 0 12px" }}>Identificar al estudiante</h2>

              <form onSubmit={enviarBusqueda} style={{ maxWidth: "480px" }}>
                <label>
                  RUT del alumno
                  <input
                    className="input"
                    placeholder="Ej: 23.456.789-6"
                    value={rut}
                    onChange={(e) => setRut(e.target.value)}
                    required
                  />
                </label>
                <div className="form-actions" style={{ marginTop: "10px" }}>
                  <button className="btn" disabled={procesando}>
                    Buscar alumno
                  </button>
                  {alumno && (
                    <button
                      type="button"
                      className="btn secondary"
                      onClick={() => {
                        setRut("");
                        void buscarAlumno("");
                      }}
                    >
                      Cambiar alumno
                    </button>
                  )}
                </div>
              </form>

              {alumno && (
                <div className="direct-student-info">
                  <div>
                    <span className="pill-state">ALUMNO IDENTIFICADO</span>
                    <h3 style={{ margin: "6px 0 2px" }}>{alumno.nombreCompleto}</h3>
                    <p style={{ margin: 0, color: "#365d4d", fontSize: "0.9rem" }}>
                      {alumno.curso} · RUT {alumno.rut} · Estado: {alumno.estado}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <small style={{ fontWeight: 700, textTransform: "uppercase", fontSize: "11px", color: "#365d4d" }}>
                      Saldo disponible
                    </small>
                    <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#18543c" }}>
                      {cuentaAlumno ? pesos(cuentaAlumno.saldoDisponible) : "Consultando…"}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Paso 2: Selección de Materiales */}
            {alumno && (
              <div className="direct-step">
                <span className="eyebrow">PASO 2</span>
                <h2 style={{ fontSize: "1.15rem", margin: "4px 0 12px" }}>Seleccionar material</h2>

                {/* Buscador asistido de producto */}
                <div style={{ marginBottom: "12px" }}>
                  <label htmlFor="filtro-materiales" style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                    Filtro rápido por nombre o código SKU (opcional)
                  </label>
                  <input
                    id="filtro-materiales"
                    className="input"
                    placeholder="Escribe para filtrar la lista..."
                    value={filtroRapido}
                    onChange={(e) => setFiltroRapido(e.target.value)}
                    style={{ marginTop: "4px" }}
                  />
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void entregar(Number(producto), Number(cantidad));
                  }}
                  style={{ display: "grid", gap: "14px" }}
                >
                  <div className="form-grid-2">
                    <label>
                      Material
                      <select
                        aria-label="Material"
                        className="input"
                        value={producto}
                        onChange={(e) => setProducto(e.target.value)}
                        required
                      >
                        <option value="">Selecciona un producto</option>
                        {productosFiltrados.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nombre} · {pesos(p.precio)} ({p.stockDisponible} disp.)
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
                        max={productoSeleccionado?.stockDisponible ?? 999}
                        step="1"
                        value={cantidad}
                        onChange={(e) => setCantidad(e.target.value)}
                        required
                      />
                    </label>
                  </div>

                  <div className="form-actions" style={{ marginTop: "6px" }}>
                    <button
                      className="btn"
                      disabled={procesando || !producto || saldoInsuficiente}
                    >
                      Registrar entrega directa
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Columna Derecha: Resumen de Entrega en Vivo */}
          <aside className="direct-summary">
            <span className="eyebrow">RESUMEN</span>
            <h2 style={{ fontSize: "1.25rem", margin: "4px 0 16px" }}>Resumen de entrega</h2>

            <div style={{ display: "grid", gap: "10px", fontSize: "0.92rem", borderBottom: "1px solid #d5e1d1", paddingBottom: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Alumno:</span>
                <strong>{alumno ? alumno.nombreCompleto.split(" ")[0] : "—"}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Saldo disponible:</span>
                <strong style={{ color: "#18543c" }}>{alumno && cuentaAlumno ? pesos(saldoDisp) : "—"}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Artículo:</span>
                <span>{productoSeleccionado ? productoSeleccionado.nombre : "—"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Unidades:</span>
                <strong>{producto ? cantidadNum : "—"}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.05rem", fontWeight: 800 }}>
                <span>Total a cargar:</span>
                <span>{pesos(totalMateriales)}</span>
              </div>
            </div>

            <div
              style={{
                marginTop: "16px",
                padding: "12px",
                borderRadius: "12px",
                background: saldoInsuficiente ? "#fde8e5" : "#eef6f0",
                border: `1px solid ${saldoInsuficiente ? "#f5c2bc" : "#badfc6"}`,
              }}
            >
              <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: saldoInsuficiente ? "#9c2e22" : "#1b5a3e" }}>
                Saldo después de entregar
              </span>
              <div style={{ fontSize: "1.3rem", fontWeight: 800, color: saldoInsuficiente ? "#9c2e22" : "#173b31", marginTop: "2px" }}>
                {alumno && cuentaAlumno ? pesos(saldoFinal) : "—"}
              </div>
              {saldoInsuficiente && (
                <small style={{ color: "#9c2e22", display: "block", marginTop: "4px", fontWeight: 600 }}>
                  ⚠ El estudiante no dispone de saldo suficiente para esta entrega.
                </small>
              )}
            </div>

            {alumno && (
              <button
                type="button"
                className="btn btn-wide"
                style={{ width: "100%", marginTop: "16px" }}
                disabled={procesando || !producto || saldoInsuficiente}
                onClick={() => void entregar(Number(producto), Number(cantidad))}
              >
                {procesando ? "Procesando…" : "Registrar entrega directa"}
              </button>
            )}
          </aside>
        </div>
      </div>

      {/* Módulo de Devoluciones */}
      <div className="card" style={{ marginTop: "24px", padding: "24px" }}>
        <span className="eyebrow">REINGRESO DE MATERIALES</span>
        <h3 style={{ margin: "4px 0 10px" }}>Devolución de entrega</h3>
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
              placeholder="Ej: 1"
              value={idEntrega}
              onChange={(e) => setIdEntrega(e.target.value)}
              required
            />
          </label>
          <div className="form-actions" style={{ marginTop: "10px" }}>
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
            style={{ marginTop: "20px", padding: "18px", background: "#fbf9f5", border: "1px solid #e9e3d8", borderRadius: "14px" }}
          >
            <div style={{ marginBottom: "14px" }}>
              <span className="pill-state neutral">ENTREGA #{entrega.numero}</span>
              <p style={{ margin: "6px 0 0", fontWeight: 700, color: "#173b31" }}>
                Alumno {entrega.alumnoId} · Total: ${entrega.total.toLocaleString("es-CL")}
              </p>
            </div>
            <div className="form-grid-2">
              <label>
                Material a devolver
                <select
                  aria-label="Material a devolver"
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
                placeholder="Indica el motivo de reingreso..."
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                required
              />
            </label>
            <div className="form-actions" style={{ marginTop: "14px" }}>
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
