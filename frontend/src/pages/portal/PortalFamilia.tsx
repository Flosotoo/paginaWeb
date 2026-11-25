import { CartolaFamilia } from "./CartolaFamilia";
import { CambiarClave } from "./CambiarClave";
import { useEffect, useState } from "react";
import { CancelacionReserva } from "./CancelacionReserva";
import { Privacidad } from "./Privacidad";
import { CorreccionDatos } from "./CorreccionDatos";
import { usePortalFamilia } from "../../hooks/usePortalFamilia";
import { TarjetaAlumno } from "../../components/TarjetaAlumno";
import { AlertaMensaje } from "../../components/AlertaMensaje";

interface PortalFamiliaProps {
  seccion: string;
  setSeccion: (s: string) => void;
}

const pesos = (valor: number) => `$${valor.toLocaleString("es-CL")}`;
const normalizarBusqueda = (texto: string) => texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es-CL").trim();
const estadosReserva: Record<string, string> = { PENDIENTE: "Pendiente", LISTA_PARA_RETIRO: "Lista para retiro", ENTREGADA: "Entregada", CANCELADA: "Cancelada" };
function movimientoVisual(tipo: string, descripcion: string, monto: number) {
  if (tipo === "LIBERACION_RESERVA") return { texto: `${pesos(monto)} liberados`, color: "#28639b", icono: "↗", fondo: "#e1edf8" };
  if (tipo.includes("RETENCION") || tipo.includes("COMPROMISO") || /retención para reserva/i.test(descripcion)) return { texto: `${pesos(monto)} retenidos`, color: "#805400", icono: "🔒", fondo: "#fff0d3" };
  if (tipo === "ABONO" || tipo === "DEVOLUCION") return { texto: `+${pesos(monto)}`, color: "#1b6238", icono: "+$", fondo: "#dcebdc" };
  if (tipo === "ENTREGA") return { texto: `−${pesos(monto)}`, color: "#993a20", icono: "−$", fondo: "#f4dfd2" };
  return { texto: pesos(monto), color: "#242b28", icono: "$", fondo: "#eeeae3" };
}

export function PortalFamilia({ seccion, setSeccion }: PortalFamiliaProps) {
  const [filtroReserva, setFiltroReserva] = useState("Todas");
  const [cancelacionAbierta, setCancelacionAbierta] = useState<number | null>(null);
  const [pedidoAbierto, setPedidoAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [categoriaSel, setCategoriaSel] = useState("Todos");
  const {
    usuario,
    alumno,
    setAlumno,
    saldosAlumnos,
    avisoPago,
    avisoReserva,
    avisoCancelacion,
    carrito,
    setCarrito,
    monto,
    setMonto,
    tokenPago,
    aviso,
    procesando,
    alumnos,
    productos,
    cuenta,
    movimientos,
    abonos,
    notificaciones,
    avisosReserva,
    reservas,
    reservar,
    iniciarPago,
    confirmarPago,
    cancelar,
  } = usePortalFamilia();

  const alumnoSeleccionado = alumnos.datos?.find((a) => a.id === alumno);

  const nombreAlumno = alumnoSeleccionado?.nombreCompleto ?? (usuario?.rol === "ALUMNO" ? usuario.nombreCompleto : "Alumno seleccionado");
  const reservasAlumno = (reservas.datos ?? []).filter(r => r.alumnoId === alumno);
  const categoriasDisponibles = [
    "Todos",
    ...Array.from(
      new Set(
        (productos.datos ?? [])
          .map((p) => p.categoria)
          .filter((c): c is string => Boolean(c)),
      ),
    ),
  ];

  const productosVisibles = productos.datos?.filter((p) => {
    if (p.estado !== "ACTIVO") return false;
    if (categoriaSel !== "Todos" && p.categoria !== categoriaSel) return false;
    return normalizarBusqueda(`${p.nombre} ${p.categoria ?? ""} ${p.sku ?? ""}`)
      .includes(normalizarBusqueda(busqueda));
  });

  const seleccion =
    productos.datos?.filter((p) => (carrito[p.id] ?? 0) > 0) ?? [];

  const totalSeleccion = seleccion.reduce(
    (suma, p) => suma + p.precio * (carrito[p.id] ?? 0),
    0,
  );

  const esApoderado = usuario?.rol === "APODERADO";
  const inicioFamilia = seccion === "cuenta" || seccion === "inicio";
  const global = seccion === "correcciones" || seccion === "privacidad";
  const hijoValido = alumno > 0 && Boolean(alumnoSeleccionado);
  const vistaCuenta = esApoderado ? seccion === "abonar" && hijoValido : inicioFamilia;
  const mostrarInicio = esApoderado && (inicioFamilia || (!hijoValido && !global));
  useEffect(() => {
    if (!esApoderado) return;
    if (tokenPago || procesando) return;
    if (!inicioFamilia && !global && !hijoValido) setSeccion("cuenta");
  }, [esApoderado, inicioFamilia, global, hijoValido, tokenPago, procesando, setSeccion]);
  useEffect(() => {
    if (esApoderado && tokenPago && seccion !== "abonar") setSeccion("abonar");
  }, [esApoderado, tokenPago, seccion, setSeccion]);
  const volverOpciones = () => setSeccion(esApoderado ? "opciones" : "cuenta");
  const opciones = [["abonar", "Abonar saldo", "Agregar dinero a su cuenta", "＋"], ["catalogo", "Reservar materiales", "Consultar catálogo y reservar", "🛒"], ["reservas", "Revisar reservas", "Consultar estado de pedidos", "▤"], ["movimientos", "Revisar movimientos", "Consultar cartola", "↔"], ["notificaciones", "Notificaciones", "Consultar avisos", "♢"]];

  return (
    <main className="dashboard family-dashboard">
      {aviso && (
        <AlertaMensaje
          mensaje={aviso}
          tipo={
            aviso.toLowerCase().includes("error") ||
            aviso.toLowerCase().includes("rechazad") ||
            aviso.toLowerCase().includes("no se pudo")
              ? "error"
              : "exito"
          }
        />
      )}
      {alumnos.error && <p role="alert">{alumnos.error}</p>}

      {esApoderado && hijoValido && !inicioFamilia && !global && (
        <section className="family-v4-nav">
          <button type="button" className="back-link secondary" disabled={procesando || !!tokenPago} onClick={() => setSeccion(seccion === "opciones" ? "cuenta" : "opciones")}>{seccion === "opciones" ? "← Volver a Mis hijos" : "← Volver a opciones"}</button>
          <div className="family-reservation-owner"><small>CUENTA DEL ALUMNO</small><h3>{nombreAlumno}</h3><span>{alumnoSeleccionado?.curso}</span></div>
        </section>
      )}
      {(vistaCuenta || mostrarInicio) && (
        <>
          {(!esApoderado || mostrarInicio) && <section className="family-intro">
            <div>
              <h1>
                Hola, <span>{usuario?.nombreCompleto}</span>.
              </h1>
              <p>Consulta el saldo disponible de cada estudiante y gestiona sus materiales escolares.</p>
            </div>
            <img
              id="family-original-art"
              src="/assets/img/materiales-escolares.svg"
              alt="Cuadernos y lápices"
              style={{ maxWidth: "240px", maxHeight: "160px" }}
            />
          </section>}

          {mostrarInicio && (
            <section className="family-section">
              <div className="section-heading">
                <div>
                  <h2>Mis hijos</h2>
                  <p>Selecciona al alumno cuya cuenta deseas administrar.</p>
                </div>
                <span className="count-pill">{alumnos.datos?.length ?? 0} estudiantes</span>
              </div>

              <div id="children" className="row g-3" aria-label="Seleccionar alumno">
                {alumnos.datos?.map((a) => (
                  <div key={a.id} className="col-12 col-md-6 col-xl-4">
                    <TarjetaAlumno
                      alumno={a}
                      saldoDisponible={saldosAlumnos.cargando ? undefined : saldosAlumnos.datos?.[a.id]}
                      seleccionado={false}
                      modoIngreso
                      deshabilitado={!!tokenPago || procesando}
                      onSeleccionar={(id) => { setAlumno(id); setFiltroReserva("Todas"); setCancelacionAbierta(null); setPedidoAbierto(false); setBusqueda(""); setCategoriaSel("Todos"); setSeccion("opciones"); }}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {vistaCuenta && <section className="account-section">
            <div className="account-top">
              <div>
                <span className="eyebrow">ESTÁS ADMINISTRANDO LA CUENTA DE</span>
                <h2 id="cuenta" className="family-selected-name">{alumnoSeleccionado?.nombreCompleto ?? "Cuenta"}</h2>
                <p className="muted">
                  {alumnoSeleccionado
                    ? `${alumnoSeleccionado.curso} · RUT ${alumnoSeleccionado.rut}`
                    : "Detalle de saldos y abonos"}
                </p>
              </div>
              {alumnoSeleccionado?.curso && (
                <span className="selected-tag">{alumnoSeleccionado.curso}</span>
              )}
            </div>

            {cuenta.cargando && <p>Cargando saldo…</p>}
            {cuenta.error && <p role="alert">{cuenta.error}</p>}

            {cuenta.datos && (
              <div className="account-grid">
                <div className="balance-panel">
                  <span>SALDO DISPONIBLE</span>
                  <strong>{pesos(cuenta.datos.saldoDisponible)}</strong>
                  <p style={{ margin: "6px 0 2px" }}>
                    Saldo total en cuenta: {pesos(cuenta.datos.saldoActual)}
                  </p>
                  <p style={{ margin: "2px 0 0", color: "#f3eee7" }}>
                    Comprometido {pesos(cuenta.datos.saldoComprometido)}
                  </p>
                  <span className="balance-decoration">$</span>
                </div>

                <div className="card" style={{ padding: "20px" }}>
                  {usuario?.rol === "APODERADO" && alumno > 0 && (() => {
                    const MIN_ABONO = 100;
                    const MAX_ABONO = 500000;
                    const montoNum = Number(monto);
                    const errorMontoAbono =
                      monto !== "" && (!Number.isSafeInteger(montoNum) || montoNum < MIN_ABONO
                        ? `El monto mínimo para abonar es $${MIN_ABONO.toLocaleString("es-CL")} CLP.`
                        : montoNum > MAX_ABONO
                        ? `El monto máximo permitido por abono es $${MAX_ABONO.toLocaleString("es-CL")} CLP.`
                        : null);

                    return (
                      <>
                        <span className="eyebrow">ABONO DE SALDO</span>
                        <h3 style={{ margin: "5px 0 12px" }}>Pasarela Simulada (Webpay)</h3>
                        <p className="family-payment-recipient">Abono para {alumnoSeleccionado?.nombreCompleto}</p>
                        <label htmlFor="monto-abono">Monto del abono simulado</label>
                        <div style={{ display: "flex", gap: "10px", marginTop: "8px", flexWrap: "wrap", alignItems: "flex-start" }}>
                          <div>
                            <input
                              id="monto-abono"
                              className="input"
                              type="number"
                              min={MIN_ABONO}
                              max={MAX_ABONO}
                              step="1"
                              placeholder="Ej: 10000"
                              value={monto}
                              onChange={(e) => setMonto(e.target.value)}
                              disabled={!!tokenPago || procesando}
                              style={{
                                maxWidth: "180px",
                                borderColor: errorMontoAbono ? "#b42318" : undefined,
                              }}
                            />
                            <p style={{ margin: "4px 0 0", fontSize: "11px", color: "var(--muted)" }}>
                              Mínimo ${MIN_ABONO.toLocaleString("es-CL")} · Máximo ${MAX_ABONO.toLocaleString("es-CL")} CLP
                            </p>
                          </div>
                          {!tokenPago ? (
                            <button
                              className="btn"
                              disabled={procesando || Boolean(errorMontoAbono) || !monto}
                              onClick={iniciarPago}
                            >
                              Iniciar abono
                            </button>
                          ) : (
                            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                              <button
                                className="btn"
                                disabled={procesando}
                                onClick={() => confirmarPago("APROBADO")}
                              >
                                Simular aprobación
                              </button>
                              <button
                                className="btn secondary"
                                disabled={procesando}
                                onClick={() => confirmarPago("RECHAZADO")}
                              >
                                Simular rechazo
                              </button>
                            </div>
                          )}
                        </div>

                        {errorMontoAbono && (
                          <p
                            role="alert"
                            style={{
                              margin: "8px 0 0",
                              color: "#b42318",
                              fontSize: "0.85rem",
                              fontWeight: 600,
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            <span>⚠️</span> {errorMontoAbono}
                          </p>
                        )}

                        {avisoPago && <AlertaMensaje mensaje={avisoPago.mensaje} tipo={avisoPago.tipo} />}
                        {tokenPago && (
                          <div
                            style={{
                              marginTop: "12px",
                              padding: "10px 14px",
                              background: "#eef6f0",
                              border: "1px solid #bcdfc6",
                              borderRadius: "10px",
                              fontSize: "0.86rem",
                              color: "#18543c",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              fontWeight: 600,
                            }}
                          >
                            <span>💳</span>
                            <span>Transacción Webpay iniciada ({tokenPago.slice(0, 8)}...). Simula el resultado para acreditar.</span>
                          </div>
                        )}
                        <hr style={{ margin: "20px 0 15px", border: "0", borderTop: "1px solid #e8e4da" }} />
                      </>
                    );
                  })()}
                  {!esApoderado && <><span className="eyebrow">ACCIONES RÁPIDAS</span>
                  <div style={{ display: "flex", gap: "10px", marginTop: "8px", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => setSeccion("catalogo")}
                    >
                      🛍 Reservar Materiales →
                    </button>
                    <button
                      type="button"
                      className="btn secondary"
                      onClick={() => setSeccion("reservas")}
                    >
                      📋 Mis Reservas →
                    </button>
                  </div></>}
                </div>
              </div>
            )}
          </section>}

          {/* Últimos movimientos del alumno en portada */}
          {!esApoderado && <section className="family-activity" style={{ marginTop: "24px" }}>
            <div className="section-heading">
              <div>
                <h2>Últimos movimientos</h2>
              </div>
              <button
                type="button"
                className="btn secondary"
                onClick={() => setSeccion("movimientos")}
                style={{ fontSize: "13px" }}
              >
                Ver cartola completa →
              </button>
            </div>
            {movimientos.cargando && <p>Cargando movimientos…</p>}
            {movimientos.error && <p role="alert">{movimientos.error}</p>}
            {movimientos.datos && movimientos.datos.length > 0 ? (
              <div className="family-movement-list" style={{ display: "grid", gap: "8px", marginTop: "12px" }}>
                {movimientos.datos.slice(0, 5).map((m) => {
                  const visual = movimientoVisual(m.tipo, m.descripcion ?? "", m.monto);
                  return (
                    <div
                      key={m.id}
                      className="family-movement"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 16px",
                        background: "#ffffff",
                        borderRadius: "12px",
                        border: "1px solid #e2ddd3",
                        gap: "12px",
                        flexWrap: "wrap",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span
                          className="movement-icon"
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "10px",
                            display: "grid",
                            placeItems: "center",
                            fontWeight: "bold",
                            background: visual.fondo,
                            color: visual.color,
                            fontSize: "14px",
                          }}
                        >
                          {visual.icono}
                        </span>
                        <div>
                          <strong style={{ fontSize: "14px", color: "#173b31" }}>
                            {m.descripcion || m.tipo}
                          </strong>
                          <br />
                          <small className="muted" style={{ fontSize: "12px" }}>
                            {new Date(m.fecha).toLocaleDateString("es-CL")}
                          </small>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <strong style={{ color: visual.color, fontSize: "15px" }}>
                          {visual.texto}
                        </strong>
                        <br />
                        <small className="muted" style={{ fontSize: "12px" }}>
                          Saldo total {pesos(m.saldoResultante)}
                        </small>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              !movimientos.cargando && (
                <p className="muted" style={{ marginTop: "10px" }}>
                  No hay movimientos registrados para esta cuenta.
                </p>
              )
            )}
          </section>}

          {!esApoderado && notificaciones.datos && notificaciones.datos.some((n) => n.alumnoId === alumno && n.estado === "SIMULADA") && (
            <section className="account-section" style={{ marginTop: "20px" }}>
              <span className="eyebrow">ALERTAS</span>
              <h3>Alertas de saldo</h3>
              {notificaciones.datos
                .filter((n) => n.alumnoId === alumno && n.estado === "SIMULADA")
                .map((n) => (
                  <div key={n.id} className="card" style={{ padding: "12px 16px", marginBottom: "8px" }}>
                    <p style={{ margin: 0 }}>{n.contenido}</p>
                  </div>
                ))}
            </section>
          )}
        </>
      )}

      {esApoderado && hijoValido && seccion === "opciones" && <section className="account-section family-v4-options">
        <div className="family-v4-balance"><small>Saldo disponible</small><strong>{cuenta.datos ? pesos(cuenta.datos.saldoDisponible) : "—"}</strong><small>Saldo comprometido: {cuenta.datos ? pesos(cuenta.datos.saldoComprometido) : "—"}</small></div>
        <h2>¿Qué deseas hacer?</h2>
        {opciones.map(([id, titulo, descripcion, icono]) => <button key={id} type="button" className="family-v4-option" onClick={() => setSeccion(id)}><span aria-hidden="true">{icono}</span><span><strong>{titulo}</strong><small>{descripcion}</small></span><span aria-hidden="true">›</span></button>)}
      </section>}
      {esApoderado && hijoValido && seccion === "notificaciones" && <section className="account-section"><h2>Notificaciones</h2>{notificaciones.error && <p role="alert">{notificaciones.error}</p>}{avisosReserva.error && <p role="alert">{avisosReserva.error}</p>}{(notificaciones.cargando || avisosReserva.cargando) && <p>Cargando avisos…</p>}{notificaciones.datos?.filter(n => n.alumnoId === alumno).map(n => <p key={n.id} className="card p-3">{n.contenido}</p>)}{avisosReserva.datos?.filter(n => n.alumnoId === alumno).map(n => <details key={n.id} className="family-reservation-notice"><summary>{n.asunto}</summary><p style={{whiteSpace:"pre-line"}}>{n.mensaje}</p></details>)}{!notificaciones.cargando && !avisosReserva.cargando && !notificaciones.error && !avisosReserva.error && !notificaciones.datos?.some(n => n.alumnoId === alumno) && !avisosReserva.datos?.some(n => n.alumnoId === alumno) && <p>No hay avisos para este alumno.</p>}</section>}

      {(!esApoderado || hijoValido) && seccion === "catalogo" && (
        <section className="family-section family-mobile-catalog">
          {/* Franja compacta del alumno con saldo */}
          <div
            className="reserva-student-strip"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#f4eee3",
              border: "1px solid #ddd5c7",
              padding: "14px 20px",
              borderRadius: "16px",
              marginBottom: "20px",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            {!(esApoderado && hijoValido && !inicioFamilia && !global) && (
            <div>
              <small style={{ textTransform: "uppercase", fontWeight: 700, color: "#65756c", fontSize: "11px", letterSpacing: "0.5px" }}>
                Alumno seleccionado
              </small>
              <h3 style={{ margin: "2px 0 0", color: "#173b31", fontSize: "1.45rem", fontWeight: 800 }}>
                {alumnoSeleccionado?.nombreCompleto || "Estudiante"} {alumnoSeleccionado?.curso ? `· ${alumnoSeleccionado.curso}` : ""}
              </h3>
            </div>
            )}
            <div style={{ textAlign: "right" }}>
              <small style={{ textTransform: "uppercase", fontWeight: 700, color: "#65756c", fontSize: "11px", letterSpacing: "0.5px" }}>
                Saldo disponible para reservas
              </small>
              <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#18543c" }}>
                {pesos(cuenta.datos?.saldoDisponible ?? 0)}
              </div>
            </div>
          </div>

          <div className="section-heading" style={{ marginBottom: "14px" }}>
            <div>
              <h2 id="catalogo">Catálogo de materiales</h2>
            </div>
          </div>

          {/* Buscador y Filtros por Categoría */}
          <div style={{ marginBottom: "16px" }}>
            <label htmlFor="busqueda-prod">Buscar por nombre o categoría</label>
            <input
              id="busqueda-prod"
              className="input"
              style={{ maxWidth: "460px", marginTop: "6px" }}
              placeholder="Ej: cuaderno, lápiz, regla..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          {categoriasDisponibles.length > 1 && (
            <div className="category-list family-desktop-categories" aria-label="Filtrar por categoría">
              {categoriasDisponibles.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`category-chip ${categoriaSel === cat ? "active" : ""}`}
                  onClick={() => setCategoriaSel(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          <div className="family-mobile-categories">
            <label htmlFor="categoria-movil">Categoría</label>
            <select id="categoria-movil" className="input" value={categoriaSel} onChange={e => setCategoriaSel(e.target.value)}>
              {categoriasDisponibles.map(cat => <option key={cat} value={cat}>{cat === "Todos" ? "Todas las categorías" : cat}</option>)}
            </select>
          </div>

          {productos.cargando && <p>Cargando catálogo…</p>}
          {productos.error && <p role="alert">{productos.error}</p>}
          {productosVisibles?.length === 0 && (
            <p>No hay productos para la búsqueda.</p>
          )}

          {/* Grilla / Lista con Resumen a la derecha */}
          <div className="reserva-layout">
            <div className="product-list">
              {productosVisibles?.map((p) => {
                const disp = p.stockDisponible;
                const enCarrito = carrito[p.id] ?? 0;
                return (
                  <article key={p.id} className="product-card" data-testid={`product-card-${p.id}`}>
                    <div className="family-product-info" style={{ flex: 1 }}>
                      <small className="family-product-category">{p.categoria || "Material"}</small>
                      <h3>{p.nombre}</h3>
                      <strong className="family-product-price">{pesos(p.precio)}</strong>
                      <p className="product-stock">
                        {disp <= 0 ? (
                          <span style={{ color: "#b91c1c", fontWeight: 700 }}>Agotado (0 disp.)</span>
                        ) : disp <= (p.stockCritico || 5) ? (
                          <span style={{ color: "#b45309", fontWeight: 700 }}>⚠ Últimas {disp} unid. disponibles</span>
                        ) : (
                          <span>{disp} disponibles</span>
                        )}
                      </p>
                      {p.descripcion && (
                        <details className="family-product-description"><summary>Descripción</summary><p>{p.descripcion}</p></details>
                      )}
                    </div>
                    <div className="product-controls" style={{ minWidth: "165px", minHeight: "82px", display: "flex", flexDirection: "column", justifyContent: "flex-start", alignItems: "flex-end" }}>
                      <label htmlFor={`cant-${p.id}`} style={{ fontSize: "12px", marginBottom: "4px", textAlign: "right", width: "100%" }}>
                        Cantidad
                      </label>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "flex-end" }}>
                        <button
                          type="button"
                          className="btn secondary"
                          style={{ width: "32px", minHeight: "36px", padding: 0, fontSize: "16px", fontWeight: "bold" }}
                          disabled={enCarrito <= 0 || procesando}
                          onClick={() => setCarrito({ ...carrito, [p.id]: Math.max(0, enCarrito - 1) })}
                          aria-label={`Disminuir ${p.nombre}`}
                        >
                          -
                        </button>
                        <input
                          id={`cant-${p.id}`}
                          aria-label={`Cantidad de ${p.nombre}`}
                          className="input"
                          type="number"
                          min="0"
                          max={disp}
                          disabled={disp <= 0 || procesando}
                          value={enCarrito || ""}
                          placeholder="0"
                          style={{ width: "70px", textAlign: "center", padding: "6px 8px" }}
                          onChange={(e) =>
                            setCarrito({
                              ...carrito,
                              [p.id]: Math.max(
                                0,
                                Math.min(
                                  disp,
                                  Math.floor(Number(e.target.value)) || 0,
                                ),
                              ),
                            })
                          }
                        />
                        <button
                          type="button"
                          className="btn secondary"
                          style={{ width: "32px", minHeight: "36px", padding: 0, fontSize: "16px", fontWeight: "bold" }}
                          disabled={enCarrito >= disp || disp <= 0 || procesando}
                          onClick={() => setCarrito({ ...carrito, [p.id]: Math.min(disp, enCarrito + 1) })}
                          aria-label={`Aumentar ${p.nombre}`}
                        >
                          +
                        </button>
                      </div>
                      <div className="family-product-remove" style={{ minHeight: "22px", marginTop: "4px", textAlign: "right", width: "100%" }}>
                        <button
                          type="button"
                          style={{
                            visibility: enCarrito > 0 ? "visible" : "hidden",
                            background: "none",
                            border: "none",
                            color: "#b91c1c",
                            fontSize: "12px",
                            cursor: "pointer",
                            padding: 0,
                            fontWeight: 600,
                          }}
                          disabled={procesando}
                          onClick={() => setCarrito({ ...carrito, [p.id]: 0 })}
                        >
                          Quitar del pedido
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Columna Derecha Fija: Mi Reserva */}
            <div className="family-mobile-cart-bar">
              <div><small>{seleccion.reduce((n,p) => n + (carrito[p.id] ?? 0), 0)} materiales</small><strong>{pesos(totalSeleccion)}</strong></div>
              <button type="button" className="btn secondary" aria-expanded={pedidoAbierto} aria-controls="family-order-panel" onClick={() => setPedidoAbierto(v => !v)}>{pedidoAbierto ? "Cerrar pedido" : "Ver pedido"}</button>
            </div>
            <aside id="family-order-panel" className={`reserva-aside ${pedidoAbierto ? "family-order-open" : ""}`}>
              <button type="button" className="btn secondary family-mobile-close" onClick={() => setPedidoAbierto(false)}>Volver al catálogo</button>
              <span className="eyebrow">MI PEDIDO</span>
              <h3 style={{ margin: "4px 0 14px", fontSize: "1.45rem", color: "#173b31" }}>Mi reserva</h3>
              <p className="family-payment-recipient">Reserva para {nombreAlumno}</p>
              {seleccion.length === 0 ? (
                <p className="muted" style={{ fontSize: "13px", margin: "10px 0 16px" }}>
                  Aún no has agregado materiales. Ajusta las cantidades en la lista para armar tu pedido.
                </p>
              ) : (
                <div style={{ marginBottom: "16px", maxHeight: "320px", overflowY: "auto" }}>
                  {seleccion.map((p) => (
                    <div key={p.id} className="cart-line" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", padding: "8px 0", borderBottom: "1px solid #e8e4da" }}>
                      <div style={{ flex: 1 }}>
                        <strong>{p.nombre}</strong>
                        <small style={{ display: "block", color: "var(--muted)", fontSize: "12px" }}>
                          {pesos(p.precio)} c/u · Total: {pesos(p.precio * (carrito[p.id] ?? 0))}
                        </small>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <button
                          type="button"
                          className="btn secondary"
                          style={{ width: "26px", minHeight: "26px", padding: 0, borderRadius: "6px", fontSize: "14px", fontWeight: "bold" }}
                          aria-label={`Disminuir ${p.nombre}`}
                          disabled={procesando}
                          onClick={() => setCarrito({ ...carrito, [p.id]: Math.max(0, (carrito[p.id] ?? 1) - 1) })}
                        >
                          -
                        </button>
                        <span style={{ fontWeight: 800, minWidth: "22px", textAlign: "center", fontSize: "13px" }}>
                          {carrito[p.id]}
                        </span>
                        <button
                          type="button"
                          className="btn secondary"
                          style={{ width: "26px", minHeight: "26px", padding: 0, borderRadius: "6px", fontSize: "14px", fontWeight: "bold" }}
                          aria-label={`Aumentar ${p.nombre}`}
                          disabled={(carrito[p.id] ?? 0) >= p.stockDisponible || procesando}
                          onClick={() => setCarrito({ ...carrito, [p.id]: Math.min(p.stockDisponible, (carrito[p.id] ?? 0) + 1) })}
                        >
                          +
                        </button>
                        <button
                          type="button"
                          style={{ background: "none", border: "none", color: "#b91c1c", fontSize: "18px", cursor: "pointer", marginLeft: "4px", lineHeight: 1 }}
                          aria-label={`Quitar ${p.nombre}`}
                          onClick={() => setCarrito({ ...carrito, [p.id]: 0 })}
                          title="Quitar de la reserva"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {(cuenta.datos?.saldoComprometido ?? 0) > 0 && (
                <div className="reserva-amount" style={{ color: "#6a5749" }}>
                  <span>Saldo comprometido en otras reservas</span>
                  <strong>{pesos(cuenta.datos?.saldoComprometido ?? 0)}</strong>
                </div>
              )}

              <div className="reserva-amount">
                <strong style={{ fontSize: "1.1rem" }}>Total selección: {pesos(totalSeleccion)}</strong>
              </div>

              <div
                style={{
                  background: totalSeleccion > (cuenta.datos?.saldoDisponible ?? 0) ? "#fde8e5" : "#eef6f0",
                  border: `1px solid ${totalSeleccion > (cuenta.datos?.saldoDisponible ?? 0) ? "#f5c2bc" : "#badfc6"}`,
                  borderRadius: "14px",
                  padding: "12px 14px",
                  margin: "14px 0",
                }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    color: totalSeleccion > (cuenta.datos?.saldoDisponible ?? 0) ? "#9c2e22" : "#1b5a3e",
                    letterSpacing: "0.5px",
                  }}
                >
                  Saldo disponible después de reservar
                </span>
                <div
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 800,
                    color: totalSeleccion > (cuenta.datos?.saldoDisponible ?? 0) ? "#9c2e22" : "#173b31",
                    marginTop: "2px",
                  }}
                >
                  {pesos((cuenta.datos?.saldoDisponible ?? 0) - totalSeleccion)}
                </div>
                {totalSeleccion > (cuenta.datos?.saldoDisponible ?? 0) && (
                  <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#9c2e22", fontWeight: 600 }}>
                    ⚠ El total supera el saldo disponible. Realiza un abono o disminuye las unidades.
                  </p>
                )}
              </div>

              <button
                type="button"
                className="btn btn-wide"
                style={{ width: "100%", marginTop: "8px" }}
                disabled={procesando || !alumno || totalSeleccion <= 0 || totalSeleccion > (cuenta.datos?.saldoDisponible ?? 0)}
                onClick={reservar}
              >
                {procesando ? "Procesando…" : "Confirmar reserva"}
              </button>
              {avisoReserva && <div className="family-action-result"><AlertaMensaje mensaje={avisoReserva.mensaje} tipo={avisoReserva.tipo} />{avisoReserva.tipo === "exito" && <button className="btn secondary" onClick={() => { setPedidoAbierto(false); setFiltroReserva("Todas"); setSeccion("reservas"); }}>Ver mis reservas →</button>}</div>}
            </aside>
          </div>
        </section>
      )}

      {(!esApoderado || hijoValido) && seccion === "reservas" && (
        <section className="account-section">
          {!esApoderado && <button
            type="button"
            className="back-link secondary"
            onClick={volverOpciones}
          >
            ← Volver a Mi Cuenta
          </button>}
          <div className="section-heading">
            <div>
              <span className="eyebrow">HISTORIAL</span>
              <h2 id="reservas">Mis reservas</h2>
            </div>
          </div>

          <div className="family-reservation-owner"><small>ESTÁS ADMINISTRANDO LA CUENTA DE</small><h3>{nombreAlumno}</h3><span>{alumnoSeleccionado?.curso}</span></div>
          <div className="family-reservation-kpis"><div><small>Reservas pendientes</small><strong>{reservasAlumno.filter(r => r.estado === "PENDIENTE").length}</strong></div><div><small>Saldo comprometido</small><strong>{cuenta.datos ? pesos(cuenta.datos.saldoComprometido) : "—"}</strong></div></div>
          <div className="category-list" aria-label="Filtrar reservas">{["Todas", ...Object.keys(estadosReserva), ...Array.from(new Set(reservasAlumno.map(r => r.estado))).filter(e => !(e in estadosReserva))].map(e => <button key={e} type="button" className={`category-chip ${filtroReserva === e ? "active" : ""}`} aria-pressed={filtroReserva === e} onClick={() => setFiltroReserva(e)}>{estadosReserva[e] ?? e}</button>)}</div>
          {reservas.cargando && <p>Cargando reservas…</p>}
          {reservas.error && <p role="alert">{reservas.error}</p>}
          {!reservas.cargando && !reservas.error && reservasAlumno.filter(r => filtroReserva === "Todas" || r.estado === filtroReserva).length === 0 && <p>No hay reservas en esta categoría.</p>}
          <div className="family-reservation-list">
            {reservasAlumno.filter(r => filtroReserva === "Todas" || r.estado === filtroReserva).map(r => (
              <article key={r.id} className="card family-reservation-card">
                <div className="family-reservation-row"><small>{new Date(r.fechaCreacion).toLocaleDateString("es-CL")}</small><span className={`family-reservation-status status-${r.estado.toLowerCase()}`}>{estadosReserva[r.estado] ?? r.estado}</span></div>
                <div className="family-reservation-row"><div><h3>{r.items.reduce((n,i) => n+i.cantidad,0)} materiales</h3><small>{r.items.length} {r.items.length === 1 ? "tipo de producto" : "tipos de productos"}</small></div><strong className="family-reservation-total">{pesos(r.total)}</strong></div>
                <details><summary>Ver detalle de la reserva</summary><div className="family-reservation-detail">{r.items.map(i => <div key={i.productoId} className="family-reservation-item"><span>{i.cantidad} × {i.nombreProducto}</span><strong>{pesos(i.subtotal)}</strong></div>)}<details><summary>Código de reserva</summary><p className="family-reservation-code">{r.codigo}</p></details>
                {avisosReserva.datos?.filter(a => a.alumnoId === alumno && a.reservaId === r.id).map(a => <details key={a.id} className="family-reservation-notice"><summary>Confirmación / aviso de reserva</summary><small>Aviso · {a.estado === "SIMULADA" ? "Correo simulado" : a.estado}</small><strong>{a.asunto}</strong><p style={{whiteSpace:"pre-line"}}>{a.mensaje}</p></details>)}
                </div></details>
                {r.estado === "PENDIENTE" && <><button type="button" className="btn secondary" disabled={procesando} onClick={() => setCancelacionAbierta(cancelacionAbierta === r.id ? null : r.id)}>{cancelacionAbierta === r.id ? "Volver sin cancelar" : "Cancelar reserva"}</button>{cancelacionAbierta === r.id && <div className="family-cancel-panel"><strong>¿Deseas cancelar esta reserva?</strong><p>Se liberarán {pesos(r.total)} comprometidos.</p><CancelacionReserva procesando={procesando} cancelar={motivo => cancelar(r.id, motivo)} /></div>}</>}
                {avisoCancelacion?.id === r.id && <AlertaMensaje mensaje={avisoCancelacion.mensaje} tipo={avisoCancelacion.tipo}/>}
              </article>
            ))}
          </div>
          {avisoCancelacion?.tipo === "exito" && !reservasAlumno.filter(r => filtroReserva === "Todas" || r.estado === filtroReserva).some(r => r.id === avisoCancelacion.id) && <AlertaMensaje mensaje={avisoCancelacion.mensaje} tipo="exito"/>}
          <details className="family-reservation-notice"><summary>Comunicaciones de reserva</summary><p>Los correos son simulados. Los avisos asociados se muestran en el detalle de cada reserva.</p><button className="btn secondary" onClick={() => void avisosReserva.recargar()}>Actualizar avisos</button>{avisosReserva.error && <p role="alert">{avisosReserva.error}</p>}{avisosReserva.datos?.filter(a => a.alumnoId === alumno && !reservasAlumno.some(r => r.id === a.reservaId)).map(a => <div key={a.id}><strong>{a.asunto}</strong><p style={{whiteSpace:"pre-line"}}>{a.mensaje}</p></div>)}</details>
        </section>
      )}

      {(!esApoderado || hijoValido) && seccion === "movimientos" && (
        <CartolaFamilia key={alumno} cuenta={cuenta} movimientos={movimientos}
          abonos={abonos} esApoderado={esApoderado} volver={volverOpciones} />
      )}

      {seccion === "correcciones" && (
        <section className="account-section">
          <button
            type="button"
            className="back-link secondary"
            onClick={() => setSeccion("cuenta")}
          >
            ← Volver a Mi Cuenta
          </button>
          <CorreccionDatos />
        </section>
      )}

      {seccion === "privacidad" && (
        <section className="account-section">
          <button
            type="button"
            className="back-link secondary"
            onClick={() => setSeccion("cuenta")}
          >
            ← Volver a Mi Cuenta
          </button>
          <Privacidad />
          <div style={{ marginTop: "20px" }}>
            <CambiarClave />
          </div>
        </section>
      )}
    </main>
  );
}
