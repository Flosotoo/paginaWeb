import { useState, useEffect, useCallback, type FormEvent } from "react";
import type { Producto } from "../../services/catalogo";
import { useEntregaMeson } from "../../hooks/useEntregaMeson";
import { familiaService, type Cuenta } from "../../services/familia";
import {
  formatearRutVisual,
  mensajeErrorRut,
  normalizarRutCanonicamente,
} from "../../utils/rut";

const pesos = (valor: number) => `$${valor.toLocaleString("es-CL")}`;

const normalizarBusqueda = (texto: string) => texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es-CL").trim();

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
  const [errorRut, setErrorRut] = useState("");
  const [producto, setProducto] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [idEntrega, setIdEntrega] = useState("");
  const [detalle, setDetalle] = useState("");
  const [unidades, setUnidades] = useState("1");
  const [motivo, setMotivo] = useState("");
  const [filtroRapido, setFiltroRapido] = useState("");
  const [cuentaAlumno, setCuentaAlumno] = useState<Cuenta | null>(null);

  const recargarCuentaAlumno = useCallback(async (alumnoId?: number) => {
    const idObjetivo = alumnoId ?? alumno?.id;
    if (!idObjetivo) {
      setCuentaAlumno(null);
      return;
    }
    try {
      setCuentaAlumno(await familiaService.cuenta(idObjetivo));
    } catch {
      setCuentaAlumno(null);
    }
  }, [alumno?.id]);

  useEffect(() => {
    void recargarCuentaAlumno(alumno?.id);
  }, [alumno?.id, entrega?.id, aviso, recargarCuentaAlumno]);

  const enviarBusqueda = (e: FormEvent) => {
    e.preventDefault();
    const err = mensajeErrorRut(rut);
    if (err) {
      setErrorRut(err);
      return;
    }
    const canonico = normalizarRutCanonicamente(rut);
    if (!canonico) {
      setErrorRut("RUT inválido.");
      return;
    }
    setErrorRut("");
    setRut(formatearRutVisual(canonico));
    void buscarAlumno(canonico);
  };

  const productoSeleccionado = productos.find((p) => p.estado === "ACTIVO" && String(p.id) === String(producto));
  const cantidadNum = Number(cantidad);
  const totalMateriales = productoSeleccionado && Number.isSafeInteger(cantidadNum) && cantidadNum > 0 ? productoSeleccionado.precio * cantidadNum : 0;
  const saldoDisp = cuentaAlumno?.saldoDisponible ?? 0;
  const saldoFinal = saldoDisp - totalMateriales;
  const saldoInsuficiente = Boolean(alumno && cuentaAlumno && totalMateriales > saldoDisp);

  const consulta = normalizarBusqueda(filtroRapido);
  const productosFiltrados = productos.filter((p) => p.estado === "ACTIVO" &&
    normalizarBusqueda(`${p.nombre} ${p.categoria ?? ""} ${p.sku ?? ""}`).includes(consulta));
  const cantidadValida = Boolean(productoSeleccionado && Number.isSafeInteger(cantidadNum) && cantidadNum > 0 && cantidadNum <= productoSeleccionado.stockDisponible);
  const puedeEntregar = Boolean(alumno && cuentaAlumno && cantidadValida && !saldoInsuficiente && !procesando);
  const registrarEntrega = () => {
    if (puedeEntregar) void entregar(Number(producto), cantidadNum);
  };
  useEffect(() => { setProducto(""); setCantidad("1"); setFiltroRapido(""); }, [alumno?.id]);

  return (
    <section className="account-section">
      <div className="section-heading" style={{ marginBottom: "20px", background: "#21463d", borderRadius: 12, padding: "16px 20px" }}>
        <div>

          <h2 id="entregas" style={{ color: "#fff", margin: 0 }}>Entrega directa</h2>
        </div>
      </div>

      {aviso && <p role="status" className="form-feedback" style={{ marginBottom: "16px" }}>{aviso}</p>}

      {/* Disposición a 2 Columnas para Entrega Directa */}
      <div className="card" style={{ padding: "24px" }}>


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
                    maxLength={15}
                    value={rut}
                    onChange={(e) => {
                      setRut(e.target.value);
                      if (errorRut) setErrorRut("");
                    }}
                    onBlur={() => setRut((prev) => formatearRutVisual(prev))}
                    required
                  />
                </label>
                {errorRut && (
                  <p role="alert" style={{ marginTop: "6px", color: "#b91c1c", fontWeight: 600 }}>
                    {errorRut}
                  </p>
                )}
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
                    Buscar por nombre o código SKU
                  </label>
                  <input
                    id="filtro-materiales"
                    className="input"
                    placeholder="Ej: lápiz, HB o SKU"
                    value={filtroRapido}
                    onChange={(e) => { setFiltroRapido(e.target.value); setProducto(""); setCantidad("1"); }}
                    style={{ marginTop: "4px" }}
                  />
                </div>

                {consulta && (
                  <div aria-label="Resultados de materiales" style={{ display: "grid", gap: 6, maxHeight: 260, overflowY: "auto", marginBottom: 12 }}>
                    {productosFiltrados.length === 0 && <p role="status">No se encontraron materiales.</p>}
                    {productosFiltrados.map(p => (
                      <button key={p.id} type="button" className="btn secondary" aria-pressed={producto === String(p.id)} disabled={procesando || p.stockDisponible <= 0}
                        style={{ textAlign: "left", justifyContent: "space-between", whiteSpace: "normal", borderRadius: 10, background: producto === String(p.id) ? "#dce8db" : "#fffcf7" }}
                        onClick={() => { setProducto(String(p.id)); setCantidad("1"); }}>
                        <span>{p.nombre}<small style={{ display: "block" }}>{p.sku} · {p.stockDisponible} disponibles</small></span>
                        <strong>{pesos(p.precio)}</strong>
                      </button>
                    ))}
                  </div>
                )}
                <div className="form-grid-2">
                  <label>Material
                    <select aria-label="Material" className="input" value={producto} disabled={procesando} onChange={e => { setProducto(e.target.value); setCantidad("1"); }}>
                      <option value="">Selecciona un producto</option>
                      {productosFiltrados.map(p => <option key={p.id} value={p.id} disabled={p.stockDisponible <= 0}>{p.nombre} · {pesos(p.precio)} ({p.stockDisponible} disp.)</option>)}
                    </select>
                  </label>
                  <label>Unidades
                    <input className="input" type="number" min="1" max={productoSeleccionado?.stockDisponible ?? 1} step="1" value={cantidad} disabled={procesando || !productoSeleccionado} onChange={e => setCantidad(e.target.value)} required />
                  </label>
                </div>
                {productoSeleccionado && !cantidadValida && <p role="alert" style={{ color: "#9c2e22" }}>Ingresa una cantidad entera entre 1 y {productoSeleccionado.stockDisponible}.</p>}

              </div>
            )}
          </div>

          {/* Columna Derecha: Resumen de Entrega en Vivo */}
          <aside className="direct-summary">

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
                <strong>{producto && cantidadValida ? cantidadNum : "—"}</strong>
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
                disabled={!puedeEntregar}
                onClick={registrarEntrega}
              >
                {procesando ? "Procesando…" : "Registrar entrega directa"}
              </button>
            )}
          </aside>
        </div>
      </div>

      {/* Módulo de Devoluciones */}
      <div className="card" style={{ marginTop: "24px", padding: "24px" }}>

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
