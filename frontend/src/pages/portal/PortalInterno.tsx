import { useEffect, useState, useRef } from "react";
import { SECCIONES_INVENTARIO } from "../../routes/LayoutPortal";
import { CuentaLibreria } from "./CuentaLibreria";
import { ValorizacionInventario } from "./ValorizacionInventario";
import { GestionProveedores } from "./GestionProveedores";
import { GestionOrdenesCompra } from "./GestionOrdenesCompra";
import { PagosWebpayAdmin } from "./PagosWebpayAdmin";
import type { Reserva } from "../../services/reservas";
import {
  HistorialOperativo,
  MovimientosInventario,
} from "./HistorialOperativo";
import { CancelacionReserva } from "./CancelacionReserva";
import { CambiarClave } from "./CambiarClave";
import { Privacidad } from "./Privacidad";
import { CorreccionDatos } from "./CorreccionDatos";
import { EntregaMeson } from "./EntregaMeson";
import { GestionCatalogo } from "./GestionCatalogo";
import { GestionUsuarios } from "./GestionUsuarios";
import { usePortalInterno } from "../../hooks/usePortalInterno";
import { construirHtmlEtiquetaBolsa } from "../../utils/codigoBarras";

interface PortalInternoProps {
  seccion: string;
  setSeccion: (s: string) => void;
}

export function PortalInterno({ seccion, setSeccion }: PortalInternoProps) {
  const {
    usuario,
    aviso,
    producto,
    setProducto,
    cantidad,
    setCantidad,
    motivo,
    setMotivo,
    procesando,
    reservas,
    productos,
    ajustes,
    movimientos,
    alumnosReserva,
    fechasEntrega,
    solicitar,
    preparar,
    entregar,
    cancelar,
    aprobar,
    rechazar,
  } = usePortalInterno(seccion);

  const esAdmin = usuario?.rol === "ADMINISTRADOR";
  const nombreAlumno = (id: number) =>
    alumnosReserva[id]?.nombreCompleto || `Alumno ${id}`;
  const normalizarBusqueda = (texto: string) =>
    texto
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const fechaReserva = (fecha: string) => {
    const valor = new Date(fecha);
    return Number.isNaN(valor.getTime())
      ? "Fecha no disponible"
      : valor.toLocaleDateString("es-CL");
  };

  // Sub-filtros y paginación para Reservas
  const accesoInicio = useRef<string | null>(null);
  const [verExistencias, setVerExistencias] = useState(false);
  const [filtroReservaEstado, setFiltroReservaEstado] =
    useState<string>("MENU");
  const [confirmacionReserva, setConfirmacionReserva] = useState<{
    texto: string;
    reserva: Reserva;
  } | null>(null);
  const [errorReservaId, setErrorReservaId] = useState<number | null>(null);
  useEffect(() => {
    const acceso = accesoInicio.current;
    accesoInicio.current = null;
    setFiltroReservaEstado(seccion === "reservas" && acceso ? acceso : "MENU");
    setVerExistencias(seccion === "inventario" && acceso === "CRITICO");
    if (seccion === "inventario") {
      setFiltroStock(acceso === "CRITICO" ? "CRITICO" : "TODOS");
      setBusquedaInventario("");
      setPaginaStock(1);
    }
    setConfirmacionReserva(null);
    setErrorReservaId(null);
    setBusquedaReserva("");
    setPaginaReserva(1);
  }, [seccion]);
  const [busquedaReserva, setBusquedaReserva] = useState<string>("");
  const [paginaReserva, setPaginaReserva] = useState<number>(1);
  const [verificacionManual, setVerificacionManual] = useState<
    Record<number, boolean>
  >({});
  const [pestanaCompras, setPestanaCompras] = useState<
    "proveedores" | "ordenes"
  >(esAdmin ? "proveedores" : "ordenes");
  const [verCompras, setVerCompras] = useState(false);
  useEffect(() => { setVerCompras(false); }, [seccion]);
  const [conteoPistoleo, setConteoPistoleo] = useState<
    Record<number, Record<number, number>>
  >({});
  const [inputPistoleo, setInputPistoleo] = useState<Record<number, string>>(
    {},
  );
  const [avisoPistoleo, setAvisoPistoleo] = useState<Record<number, string>>(
    {},
  );

  const procesarPistoleo = (
    reservaId: number,
    codigo: string,
    items: { productoId: number; cantidad: number }[],
  ) => {
    const q = codigo.trim().toLowerCase();
    if (!q) return;

    const itemEncontrado = items.find((i) => {
      if (String(i.productoId) === q) return true;
      const prod = productos.datos?.find((p) => p.id === i.productoId);
      if (prod && prod.sku && prod.sku.toLowerCase() === q) return true;
      if (prod && prod.nombre.toLowerCase().includes(q)) return true;
      return false;
    });

    if (!itemEncontrado) {
      setAvisoPistoleo({
        ...avisoPistoleo,
        [reservaId]: `Código "${codigo}" no coincide con ningún material de esta reserva.`,
      });
      return;
    }

    const conteoActual =
      conteoPistoleo[reservaId]?.[itemEncontrado.productoId] ?? 0;
    if (conteoActual >= itemEncontrado.cantidad) {
      setAvisoPistoleo({
        ...avisoPistoleo,
        [reservaId]: `Este material ya completó sus ${itemEncontrado.cantidad} unidades.`,
      });
      return;
    }

    setConteoPistoleo({
      ...conteoPistoleo,
      [reservaId]: {
        ...(conteoPistoleo[reservaId] ?? {}),
        [itemEncontrado.productoId]: conteoActual + 1,
      },
    });
    setInputPistoleo({ ...inputPistoleo, [reservaId]: "" });
    setAvisoPistoleo({ ...avisoPistoleo, [reservaId]: "" });
  };

  const pistolearItemDirecto = (
    reservaId: number,
    productoId: number,
    cantidadMax: number,
  ) => {
    const actual = conteoPistoleo[reservaId]?.[productoId] ?? 0;
    setConteoPistoleo({
      ...conteoPistoleo,
      [reservaId]: {
        ...(conteoPistoleo[reservaId] ?? {}),
        [productoId]: Math.min(cantidadMax, actual + 1),
      },
    });
    setAvisoPistoleo({ ...avisoPistoleo, [reservaId]: "" });
  };

  const estaListaParaEmbolsar = (
    reservaId: number,
    items: { productoId: number; cantidad: number }[],
  ) => {
    if (verificacionManual[reservaId]) return true;
    if (!items || items.length === 0) return true;
    return items.every(
      (i) => (conteoPistoleo[reservaId]?.[i.productoId] ?? 0) >= i.cantidad,
    );
  };

  const abrirEtiquetaImprimible = (r: Reserva) => {
    const html = construirHtmlEtiquetaBolsa({
      codigo: `BOL-${r.codigo}`,
      nombreAlumno: nombreAlumno(r.alumnoId),
      curso: alumnosReserva[r.alumnoId]?.curso || "Curso no disponible",
      totalMateriales: r.items.reduce((n, i) => n + i.cantidad, 0),
    });
    if (!html) return;
    const popup = window.open("", "_blank", "width=640,height=420");
    if (!popup) return;
    popup.document.write(html);
    popup.document.close();
  };

  // Filtros y paginación para Inventario
  const [busquedaInventario, setBusquedaInventario] = useState<string>("");
  const [filtroStock, setFiltroStock] = useState<string>("TODOS");
  const [paginaStock, setPaginaStock] = useState<number>(1);

  const porPreparar =
    reservas.datos?.filter((r) => r.estado === "PENDIENTE").length ?? 0;
  const pendientesEntrega =
    reservas.datos?.filter((r) => r.estado === "LISTA_PARA_RETIRO").length ?? 0;
  const stockCritico =
    productos.datos?.filter((p) => p.stockDisponible <= (p.stockCritico || 5))
      .length ?? 0;
  const entregadas =
    reservas.datos?.filter((r) => r.estado === "ENTREGADA").length ?? 0;

  // Filtrado de Reservas
  const reservasFiltradas = (reservas.datos ?? []).filter((r) => {
    if (filtroReservaEstado !== "TODAS" && r.estado !== filtroReservaEstado)
      return false;
    if (busquedaReserva.trim()) {
      const q = normalizarBusqueda(busquedaReserva.trim());
      const coincide =
        r.codigo.toLowerCase().includes(q) ||
        String(r.alumnoId).includes(q) ||
        normalizarBusqueda(nombreAlumno(r.alumnoId)).includes(q) ||
        normalizarBusqueda(alumnosReserva[r.alumnoId]?.curso ?? "").includes(
          q,
        ) ||
        r.items.some((i) => normalizarBusqueda(i.nombreProducto).includes(q));
      if (!coincide) return false;
    }
    return true;
  });

  const TAMANO_PAGINA_RESERVA = 6;
  const totalPaginasReserva = Math.max(
    1,
    Math.ceil(reservasFiltradas.length / TAMANO_PAGINA_RESERVA),
  );
  const reservasPaginadas = reservasFiltradas.slice(
    (paginaReserva - 1) * TAMANO_PAGINA_RESERVA,
    paginaReserva * TAMANO_PAGINA_RESERVA,
  );

  // Filtrado de Inventario
  const productosOrdenados = [...(productos.datos ?? [])].sort(
    (a, b) => b.id - a.id,
  );
  const productosCriticos = productosOrdenados.filter(
    (p) => p.stockDisponible <= (p.stockCritico || 5),
  );

  const productosStockFiltrados = productosOrdenados.filter((p) => {
    if (filtroStock === "CRITICO" && p.stockDisponible > (p.stockCritico || 5))
      return false;
    if (filtroStock === "AGOTADO" && p.stockDisponible > 0) return false;
    if (busquedaInventario.trim()) {
      const q = busquedaInventario.trim().toLowerCase();
      return (
        p.nombre.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.categoria && p.categoria.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const TAMANO_PAGINA_STOCK = 35;
  const totalPaginasStock = Math.max(
    1,
    Math.ceil(productosStockFiltrados.length / TAMANO_PAGINA_STOCK),
  );
  const productosStockPaginados = productosStockFiltrados.slice(
    (paginaStock - 1) * TAMANO_PAGINA_STOCK,
    paginaStock * TAMANO_PAGINA_STOCK,
  );

  // Solicitudes ordenadas más recientes primero
  const solicitudesOrdenadas = [...(ajustes.datos ?? [])].sort(
    (a, b) => b.id - a.id,
  );

  return (
    <main className="dashboard staff-dashboard">
      {aviso && seccion !== "reservas" && (
        <p role="status" className="form-feedback">
          {aviso}
        </p>
      )}

      {/* VISTA INICIO PARA ENCARGADO */}
      {!esAdmin && seccion === "inicio" && (
        <>
          <section
            className="account-section"
            style={{ padding: "16px", marginBottom: "12px" }}
          >
            <span className="eyebrow">ÁREA DEL ENCARGADO</span>
            <h2 style={{ margin: "4px 0 0" }}>Panel del Encargado</h2>
          </section>
          <section
            className="account-section"
            style={{ padding: "16px", marginBottom: "12px" }}
          >
            <h3 style={{ margin: "0 0 12px" }}>Estado de operaciones</h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "8px",
              }}
            >
              {[
                {
                  titulo: "Por preparar",
                  total: porPreparar,
                  filtro: "PENDIENTE",
                  destino: "reservas",
                },
                {
                  titulo: "Listas para retiro",
                  total: pendientesEntrega,
                  filtro: "LISTA_PARA_RETIRO",
                  destino: "reservas",
                },
                {
                  titulo: "Stock crítico",
                  total: stockCritico,
                  filtro: "CRITICO",
                  destino: "inventario",
                },
                {
                  titulo: "Entregadas",
                  total: entregadas,
                  filtro: "ENTREGADA",
                  destino: "reservas",
                },
              ].map(({ titulo, total, filtro, destino }) => (
                <button
                  key={filtro}
                  type="button"
                  className="subnav-card"
                  style={{
                    minWidth: 0,
                    textAlign: "left",
                    padding: "12px",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    accesoInicio.current = filtro;
                    setSeccion(destino);
                  }}
                >
                  <strong
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "1.4rem",
                    }}
                  >
                    {total}
                    <span aria-hidden="true">→</span>
                  </strong>
                  <span style={{ fontSize: "0.85rem" }}>{titulo}</span>
                </button>
              ))}
            </div>
            <h3 style={{ margin: "20px 0 12px" }}>Gestión</h3>
            <div style={{ display: "grid", gap: "8px" }}>
              {[
                ["reservas", "Reservas", "Gestión completa de reservas"],
                ["entregas", "Entrega directa", "Entrega presencial en mesón"],
                ["inventario", "Inventario", "Existencias y gestión de bodega"],
                ["historial", "Historial", "Consultar operaciones realizadas"],
              ].map(([destino, titulo, descripcion]) => (
                <button
                  key={destino}
                  type="button"
                  className="reserva-opcion"
                  onClick={() => setSeccion(destino)}
                >
                  <span>
                    <strong>{titulo}</strong>
                    <small>{descripcion}</small>
                  </span>
                  <span aria-hidden="true">→</span>
                </button>
              ))}
            </div>
          </section>
        </>
      )}

      {/* INICIO ADMINISTRADOR */}
      {esAdmin && seccion === "inicio" && (
        <>
          <section className="admin-welcome" style={{ marginBottom: "25px" }}>
            <div>
              <span className="eyebrow">CENTRO GENERAL DE PADRES</span>
              <h2>Administración de EduSaldo</h2>
              <p>Accede a las áreas de gestión de la librería escolar.</p>
            </div>
            <div className="admin-welcome-mark">e</div>
          </section>

          <div className="admin-home-grid" style={{ marginBottom: "30px" }}>
            {[
              {
                id: "cuenta-libreria",
                icono: "▤",
                titulo: "Cuenta Librería",
                descripcion:
                  "Consulta y administración de la cuenta de la librería.",
              },
              {
                id: "inventario",
                icono: "▦",
                titulo: "Inventario y Valorización",
                descripcion:
                  "Existencias, stock crítico, valorización y control de inventario.",
              },
              {
                id: "gestion-compras",
                icono: "🛒",
                titulo: "Gestión de Compras",
                descripcion: "Proveedores, órdenes de compra y recepción de mercadería.",
              },
              {
                id: "pagos",
                icono: "💰",
                titulo: "Pagos",
                descripcion:
                  "Consulta, conciliación y exportación de recargas electrónicas Webpay.",
              },
              {
                id: "personas",
                icono: "👥",
                titulo: "Usuarios y alumnos",
                descripcion:
                  "Administración de usuarios, alumnos y sus vínculos.",
              },
            ].map((tarjeta) => (
              <button
                key={tarjeta.id}
                type="button"
                className="admin-home-card"
                onClick={() => setSeccion(tarjeta.id)}
                style={{
                  textAlign: "left",
                  background: "#fffcf7",
                  border: "none",
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                <span className="admin-card-icon" aria-hidden="true">
                  {tarjeta.icono}
                </span>
                <div>
                  <h3>{tarjeta.titulo}</h3>
                  <p>{tarjeta.descripcion}</p>
                </div>
                <b aria-hidden="true">→</b>
              </button>
            ))}
          </div>
        </>
      )}

      {/* CUENTA LIBRERÍA: cartola financiera integrada */}
      {esAdmin && seccion === "cuenta-libreria" && (
        <section className="account-section">
          <button
            type="button"
            className="back-link secondary"
            onClick={() => setSeccion("inicio")}
          >
            ← Volver al inicio de administración
          </button>
          <CuentaLibreria />
        </section>
      )}

      {SECCIONES_INVENTARIO.some((id) => id === seccion) && !(esAdmin && seccion === "gestion-compras") && (
        <section className="account-section">
          <button
            type="button"
            className="back-link secondary"
            onClick={() => {
              if (seccion === "inventario" && !verExistencias) {
                setSeccion("inicio");
              } else {
                setVerExistencias(false);
                setSeccion("inventario");
              }
            }}
          >
            {seccion === "inventario" && !verExistencias
              ? "← Volver al inicio"
              : "← Volver a Inventario"}
          </button>
          <div className="section-heading">
            <h2>{esAdmin ? "Inventario y Valorización" : "Inventario"}</h2>
          </div>
          {esAdmin && seccion === "inventario" && !verExistencias && <ValorizacionInventario />}
          {seccion === "inventario" && !verExistencias && (
          <div className="reserva-menu" aria-label="Secciones de inventario">
            {[
              ["inventario", "Existencias", "Stock y conteo físico"],
              [
                "gestion-catalogo",
                "Catálogo de productos",
                "Productos, categorías e ingresos",
              ],
              ["proveedores", "Proveedores", "Maestro de proveedores"],
              [
                "ordenes",
                "Compras y recepción",
                "Órdenes de compra y mercadería",
              ],
              [
                "inventario-ajustes",
                "Ajustes de stock",
                "Solicitudes y control",
              ],
              ["inventario-movimientos", "Movimientos", "Libro de bodega"],
            ].filter(([id]) => !esAdmin || !["proveedores", "ordenes"].includes(id)).map(([id, titulo, descripcion]) => {
              return (
                <button
                  key={id}
                  type="button"
                  className="reserva-opcion"
                  onClick={() => {
                    if (id === "inventario") {
                      setFiltroStock("TODOS");
                      setBusquedaInventario("");
                      setPaginaStock(1);
                      setVerExistencias(true);
                    } else if (id === "proveedores" || id === "ordenes") {
                      setPestanaCompras(id);
                      setSeccion("gestion-compras");
                    } else {
                      if (id === "inventario-movimientos")
                        void movimientos.recargar();
                      setSeccion(id);
                    }
                  }}
                >
                  <span>
                    <strong>{titulo}</strong>
                    <small>{descripcion}</small>
                  </span>
                  <span aria-hidden="true">→</span>
                </button>
              );
            })}
          </div>
          )}
        </section>
      )}

      {/* GESTIÓN DE COMPRAS: proveedores + órdenes de compra y recepción */}
      {seccion === "gestion-compras" && (
        <section className="account-section">
          {esAdmin && <>
            <button type="button" className="back-link secondary" onClick={() => verCompras ? setVerCompras(false) : setSeccion("inicio")}>
              {verCompras ? "← Volver a Gestión de Compras" : "← Volver al inicio"}
            </button>
            <h2>Gestión de Compras</h2>
            {!verCompras && <div className="reserva-menu">
              <button type="button" className="reserva-opcion" onClick={() => { setPestanaCompras("proveedores"); setVerCompras(true); }}><span><strong>Proveedores</strong><small>Maestro de proveedores</small></span><span aria-hidden="true">→</span></button>
              <button type="button" className="reserva-opcion" onClick={() => { setPestanaCompras("ordenes"); setVerCompras(true); }}><span><strong>Compras y recepción</strong><small>Órdenes de compra y mercadería</small></span><span aria-hidden="true">→</span></button>
            </div>}
          </>}
          {(!esAdmin || verCompras) && (pestanaCompras === "proveedores" ? (
            <GestionProveedores esAdmin={esAdmin} />
          ) : (
            <GestionOrdenesCompra
              esAdmin={esAdmin}
              productos={productos.datos ?? []}
              onStockActualizado={productos.recargar}
            />
          ))}
        </section>
      )}

      {/* PAGOS Y ABONOS WEBPAY */}
      {esAdmin && seccion === "pagos" && (
        <section className="account-section">
          <button
            type="button"
            className="back-link secondary"
            onClick={() => setSeccion("inicio")}
          >
            ← Volver al inicio de administración
          </button>
          <PagosWebpayAdmin />
        </section>
      )}

      {/* MÓDULO: RESERVAS */}
      {seccion === "reservas" && (
        <section className="account-section" id="reservas">
          {filtroReservaEstado === "MENU" && !confirmacionReserva && (
            <button
              type="button"
              className="back-link secondary"
              onClick={() => setSeccion("inicio")}
            >
              ← Volver al inicio{" "}
              {esAdmin ? "de administración" : "del encargado"}
            </button>
          )}
          <div className="section-heading">
            <div>
              <span className="eyebrow">OPERACIONES</span>
              <h2>Reservas</h2>
            </div>
          </div>

          {reservas.error && <p role="alert">{reservas.error}</p>}
          {reservas.cargando && <p>Cargando reservas…</p>}
          {confirmacionReserva ? (
            <div
              className="reserva-confirmacion"
              role="status"
              tabIndex={-1}
              ref={(el) => el?.focus()}
            >
              <h3>✓ {confirmacionReserva.texto}</h3>
              <h4>{nombreAlumno(confirmacionReserva.reserva.alumnoId)}</h4>
              <p>
                {alumnosReserva[confirmacionReserva.reserva.alumnoId]?.curso}
              </p>
              <p>
                {confirmacionReserva.reserva.items.reduce(
                  (n, i) => n + i.cantidad,
                  0,
                )}{" "}
                materiales · $
                {confirmacionReserva.reserva.total.toLocaleString("es-CL")}
              </p>
              <button
                className="btn"
                onClick={() => setConfirmacionReserva(null)}
              >
                Continuar
              </button>
              <button
                className="btn secondary"
                onClick={() => {
                  setConfirmacionReserva(null);
                  setFiltroReservaEstado("MENU");
                }}
              >
                Volver a Reservas
              </button>
            </div>
          ) : filtroReservaEstado === "MENU" ? (
            <div className="reserva-menu">
              {[
                [
                  "PENDIENTE",
                  "Por preparar",
                  "Preparar y verificar materiales",
                  porPreparar,
                ],
                [
                  "LISTA_PARA_RETIRO",
                  "Listas para retiro",
                  "Registrar entregas",
                  pendientesEntrega,
                ],
                [
                  "ENTREGADA",
                  "Entregadas",
                  "Consultar entregas realizadas",
                  entregadas,
                ],
                [
                  "CANCELADA",
                  "Canceladas",
                  "Consultar cancelaciones",
                  reservas.datos?.filter((r) => r.estado === "CANCELADA")
                    .length ?? 0,
                ],
                [
                  "TODAS",
                  "Todas las reservas",
                  "Consultar historial completo",
                  reservas.datos?.length ?? 0,
                ],
              ].map(([clave, titulo, descripcion, total]) => (
                <button
                  key={clave}
                  type="button"
                  className="reserva-opcion"
                  onClick={() => {
                    setFiltroReservaEstado(String(clave));
                    setPaginaReserva(1);
                    setBusquedaReserva("");
                  }}
                >
                  <span>
                    <strong>{titulo}</strong>
                    <small>{descripcion}</small>
                  </span>
                  <b>{total} →</b>
                </button>
              ))}
            </div>
          ) : (
            <>
              <button
                type="button"
                className="back-link secondary"
                onClick={() => {
                  setFiltroReservaEstado("MENU");
                  setBusquedaReserva("");
                }}
              >
                ← Volver a Reservas
              </button>
              <h3>
                {
                  (
                    {
                      PENDIENTE: "Por preparar",
                      LISTA_PARA_RETIRO: "Listas para retiro",
                      ENTREGADA: "Entregadas",
                      CANCELADA: "Canceladas",
                      TODAS: "Todas las reservas",
                    } as Record<string, string>
                  )[filtroReservaEstado]
                }
              </h3>
              {aviso &&
                ![
                  "Reserva preparada.",
                  "Entrega registrada.",
                  "Reserva cancelada.",
                ].includes(aviso) && (
                  <p role="alert" className="form-feedback error">
                    {aviso}
                  </p>
                )}
              {/* Buscador de reserva */}
              <div style={{ marginBottom: "16px", maxWidth: "420px" }}>
                <label
                  htmlFor="busqueda-reserva"
                  style={{ fontSize: "0.85rem", color: "var(--muted)" }}
                >
                  Buscar por nombre, curso o código
                </label>
                <input
                  id="busqueda-reserva"
                  className="input"
                  placeholder="Ej: Tomás, 8° Básico o RES-..."
                  value={busquedaReserva}
                  onChange={(e) => {
                    setBusquedaReserva(e.target.value);
                    setPaginaReserva(1);
                  }}
                  style={{ marginTop: "4px" }}
                />
              </div>

              {!reservas.cargando &&
                !reservas.error &&
                reservasFiltradas.length === 0 && (
                  <p>No hay reservas en este estado.</p>
                )}

              <div style={{ display: "grid", gap: "16px" }}>
                {reservasPaginadas.map((r) => (
                  <article
                    key={r.id}
                    className="card"
                    style={{ padding: "20px" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        flexWrap: "wrap",
                        gap: "12px",
                      }}
                    >
                      <div style={{ flex: "1 1 220px", minWidth: 0 }}>
                        <span
                          className="staff-badge"
                          style={{
                            background:
                              r.estado === "ENTREGADA"
                                ? "#dcebdc"
                                : r.estado === "CANCELADA"
                                  ? "#fbe3e3"
                                  : r.estado === "LISTA_PARA_RETIRO"
                                    ? "#dcebf7"
                                    : "#fff0ce",
                            color:
                              r.estado === "CANCELADA" ? "#922525" : "#21463d",
                          }}
                        >
                          {(
                            {
                              PENDIENTE: "Pendiente",
                              LISTA_PARA_RETIRO: "Lista para retiro",
                              ENTREGADA: "Entregada",
                              CANCELADA: "Cancelada",
                            } as Record<string, string>
                          )[r.estado] ?? r.estado}
                        </span>
                        <h3
                          style={{
                            margin: "6px 0 2px",
                            fontSize: "1.15rem",
                            fontWeight: 700,
                          }}
                        >
                          {nombreAlumno(r.alumnoId)}
                        </h3>
                        <small>
                          {alumnosReserva[r.alumnoId]?.curso ||
                            "Curso no disponible"}
                        </small>
                        <p style={{ margin: "4px 0", fontSize: "12px" }}>
                          Reserva: {fechaReserva(r.fechaCreacion)}
                        </p>
                        {r.estado === "ENTREGADA" && (
                          <p style={{ margin: "4px 0", fontSize: "12px" }}>
                            Entrega:{" "}
                            {fechasEntrega[r.id]
                              ? fechaReserva(fechasEntrega[r.id])
                              : "Fecha no disponible"}
                          </p>
                        )}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "8px",
                            margin: "8px 0",
                          }}
                        >
                          <span>
                            {r.items.reduce((n, i) => n + i.cantidad, 0)}{" "}
                            materiales
                          </span>
                          <strong
                            style={{ fontSize: "1.15rem", color: "#21463d" }}
                          >
                            ${r.total.toLocaleString("es-CL")}
                          </strong>
                        </div>
                        <details>
                          <summary>Ver detalle de la reserva</summary>
                          <ul>
                            {r.items.map((i) => (
                              <li key={i.productoId}>
                                {i.cantidad} × {i.nombreProducto}
                              </li>
                            ))}
                          </ul>
                          <small style={{ overflowWrap: "anywhere" }}>
                            {r.codigo}
                          </small>
                        </details>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          flexWrap: "wrap",
                          alignItems: "center",
                        }}
                      >
                        {r.estado === "PENDIENTE" && (
                          <button
                            className="btn"
                            disabled={
                              procesando ||
                              !estaListaParaEmbolsar(r.id, r.items)
                            }
                            onClick={async () => {
                              setErrorReservaId(null);
                              if (await preparar(r.id)) {
                                setConfirmacionReserva({
                                  texto: "Reserva preparada correctamente",
                                  reserva: r,
                                });
                              } else {
                                setErrorReservaId(r.id);
                              }
                            }}
                          >
                            {procesando ? "Procesando…" : "Marcar lista"}
                          </button>
                        )}
                        {r.estado === "LISTA_PARA_RETIRO" && (
                          <button
                            className="btn"
                            disabled={procesando}
                            onClick={async () => {
                              setErrorReservaId(null);
                              if (await entregar(r.id)) {
                                setConfirmacionReserva({
                                  texto: "Entrega registrada correctamente",
                                  reserva: r,
                                });
                              } else {
                                setErrorReservaId(r.id);
                              }
                            }}
                          >
                            {procesando ? "Registrando…" : "Registrar entrega"}
                          </button>
                        )}
                      </div>
                    </div>
                    {errorReservaId === r.id &&
                      aviso &&
                      ![
                        "Reserva preparada.",
                        "Entrega registrada.",
                        "Reserva cancelada.",
                      ].includes(aviso) && (
                        <p
                          role="alert"
                          className="form-feedback error"
                          style={{ marginTop: "10px", marginBottom: 0 }}
                        >
                          {aviso}
                        </p>
                      )}

                    {/* Asistente de Preparación y Pistoleo (PENDIENTE) */}
                    {r.estado === "PENDIENTE" && (
                      <div
                        style={{
                          marginTop: "14px",
                          padding: "16px",
                          background: "#fbf9f5",
                          border: "1px dashed #b8ceb6",
                          borderRadius: "14px",
                          fontSize: "0.88rem",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: "8px",
                            marginBottom: "12px",
                          }}
                        >
                          <div>
                            <strong
                              style={{ color: "#173b31", fontSize: "14px" }}
                            >
                              Asistente de pistoleo y preparación de bolsa
                            </strong>
                            <p
                              style={{
                                margin: "2px 0 0",
                                color: "var(--muted)",
                                fontSize: "12px",
                              }}
                            >
                              Pistolea el código de barra o SKU de cada artículo
                              al introducirlo en la bolsa de retiro.
                            </p>
                          </div>
                          <label
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              cursor: "pointer",
                              margin: 0,
                              fontSize: "12px",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={Boolean(verificacionManual[r.id])}
                              onChange={(e) =>
                                setVerificacionManual({
                                  ...verificacionManual,
                                  [r.id]: e.target.checked,
                                })
                              }
                            />
                            <span style={{ fontWeight: 700, color: "#18543c" }}>
                              Omitir / Forzar verificación manual
                            </span>
                          </label>
                        </div>

                        {/* Input de escaneo con pistola o teclado */}
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            alignItems: "center",
                            marginBottom: "12px",
                            flexWrap: "wrap",
                          }}
                        >
                          <input
                            className="input"
                            style={{
                              maxWidth: "340px",
                              padding: "8px 12px",
                              fontSize: "13px",
                            }}
                            placeholder="Pistolear código de barra o SKU..."
                            value={inputPistoleo[r.id] ?? ""}
                            onChange={(e) =>
                              setInputPistoleo({
                                ...inputPistoleo,
                                [r.id]: e.target.value,
                              })
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                procesarPistoleo(
                                  r.id,
                                  inputPistoleo[r.id] ?? "",
                                  r.items,
                                );
                              }
                            }}
                          />
                          <button
                            type="button"
                            className="btn secondary"
                            style={{
                              minHeight: "36px",
                              padding: "6px 14px",
                              fontSize: "12px",
                            }}
                            onClick={() =>
                              procesarPistoleo(
                                r.id,
                                inputPistoleo[r.id] ?? "",
                                r.items,
                              )
                            }
                          >
                            Ingresar código
                          </button>
                        </div>

                        {avisoPistoleo[r.id] && (
                          <p
                            style={{
                              margin: "0 0 10px",
                              color: "#b91c1c",
                              fontSize: "12px",
                              fontWeight: 600,
                            }}
                          >
                            ⚠ {avisoPistoleo[r.id]}
                          </p>
                        )}

                        {/* Lista de artículos con conteo de pistoleo */}
                        <div style={{ display: "grid", gap: "6px" }}>
                          {r.items.map((i) => {
                            const prod = productos.datos?.find(
                              (p) => p.id === i.productoId,
                            );
                            const pistoleados =
                              conteoPistoleo[r.id]?.[i.productoId] ?? 0;
                            const completo = pistoleados >= i.cantidad;
                            return (
                              <div
                                key={i.productoId}
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  padding: "8px 12px",
                                  background: completo ? "#eef6f0" : "#ffffff",
                                  border: `1px solid ${completo ? "#badfc6" : "#e4dfd4"}`,
                                  borderRadius: "8px",
                                  fontSize: "13px",
                                }}
                              >
                                <div>
                                  <strong
                                    style={{
                                      color: completo ? "#18543c" : "#242b28",
                                    }}
                                  >
                                    {completo ? "✓ " : ""}
                                    {i.nombreProducto}
                                  </strong>{" "}
                                  <small style={{ color: "var(--muted)" }}>
                                    · SKU: {prod?.sku || `PROD-${i.productoId}`}
                                  </small>
                                </div>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                  }}
                                >
                                  <span
                                    style={{
                                      fontWeight: 800,
                                      color: completo ? "#18543c" : "#6a5749",
                                      background: completo
                                        ? "#d8ebd9"
                                        : "#f4eee4",
                                      padding: "2px 8px",
                                      borderRadius: "6px",
                                      fontSize: "12px",
                                    }}
                                  >
                                    {pistoleados} / {i.cantidad}
                                  </span>
                                  {!completo && (
                                    <button
                                      type="button"
                                      className="btn secondary"
                                      style={{
                                        minHeight: "26px",
                                        padding: "2px 8px",
                                        fontSize: "11px",
                                      }}
                                      onClick={() =>
                                        pistolearItemDirecto(
                                          r.id,
                                          i.productoId,
                                          i.cantidad,
                                        )
                                      }
                                      title="Simular escaneo de 1 unidad con pistola"
                                    >
                                      +1 Pistolear
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {estaListaParaEmbolsar(r.id, r.items) && (
                          <div
                            style={{
                              marginTop: "10px",
                              color: "#18543c",
                              fontWeight: 700,
                              fontSize: "13px",
                            }}
                          >
                            ✓ Todos los artículos han sido verificados. Puedes
                            marcar la reserva como lista para retiro.
                          </div>
                        )}
                      </div>
                    )}

                    {/* Código de Bolsa y Retiro Asistido (LISTA_PARA_RETIRO) */}
                    {r.estado === "LISTA_PARA_RETIRO" && (
                      <div
                        style={{
                          marginTop: "14px",
                          padding: "14px 16px",
                          background: "#eef6f0",
                          border: "1px solid #bcdfc6",
                          borderRadius: "14px",
                          fontSize: "0.88rem",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: "10px",
                            marginBottom: "10px",
                          }}
                        >
                          <div>
                            <strong style={{ color: "#18543c" }}>
                              Código de bolsa asignado:
                            </strong>{" "}
                            <code
                              style={{
                                background: "#ffffff",
                                padding: "3px 8px",
                                borderRadius: "6px",
                                fontWeight: 800,
                                color: "#173b31",
                              }}
                            >
                              BOL-{r.codigo}
                            </code>
                          </div>
                          <button
                            type="button"
                            className="btn secondary"
                            style={{ fontSize: "12px", padding: "4px 10px" }}
                            onClick={() => abrirEtiquetaImprimible(r)}
                          >
                            🏷 Ver / Imprimir etiqueta
                          </button>
                        </div>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "12px",
                            color: "#2d6349",
                          }}
                        >
                          Verifica la etiqueta de la bolsa (
                          <code>BOL-{r.codigo}</code>) antes de presionar
                          "Registrar entrega".
                        </p>
                      </div>
                    )}

                    {["PENDIENTE", "LISTA_PARA_RETIRO"].includes(r.estado) && (
                      <div
                        style={{
                          marginTop: "14px",
                          borderTop: "1px solid #e8e4da",
                          paddingTop: "10px",
                        }}
                      >
                        <details>
                          <summary>Cancelar reserva</summary>
                          <CancelacionReserva
                            procesando={procesando}
                            cancelar={async (motivo) => {
                              if (await cancelar(r.id, motivo))
                                setConfirmacionReserva({
                                  texto: "Reserva cancelada correctamente",
                                  reserva: r,
                                });
                            }}
                          />
                        </details>
                      </div>
                    )}
                  </article>
                ))}
              </div>

              {/* Barra de Paginación de Reservas */}
              {totalPaginasReserva > 1 && (
                <div className="pagination-bar">
                  <span>
                    Página {paginaReserva} de {totalPaginasReserva} (
                    {reservasFiltradas.length} reservas)
                  </span>
                  <div className="pagination-controls">
                    <button
                      type="button"
                      disabled={paginaReserva <= 1}
                      onClick={() =>
                        setPaginaReserva((p) => Math.max(1, p - 1))
                      }
                    >
                      ← Anterior
                    </button>
                    <button
                      type="button"
                      disabled={paginaReserva >= totalPaginasReserva}
                      onClick={() =>
                        setPaginaReserva((p) =>
                          Math.min(totalPaginasReserva, p + 1),
                        )
                      }
                    >
                      Siguiente →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* MÓDULO: INVENTARIO */}
      {seccion === "inventario" && verExistencias && (
        <section className="account-section" id="inventario">
          <div className="section-heading">
            <h2>Existencias</h2>
          </div>
          {productos.error && <p role="alert">{productos.error}</p>}

          {/* Alertas de Stock Crítico */}
          {productosCriticos.length > 0 && (
            <div
              style={{
                marginBottom: "20px",
                padding: "16px 20px",
                background: "#fef3e6",
                border: "2px solid #f4c084",
                borderRadius: "16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "8px",
                }}
              >
                <span style={{ fontSize: "1.2rem" }}>⚠</span>
                <strong style={{ color: "#92400e", fontSize: "1rem" }}>
                  Alerta: {productosCriticos.length} productos con stock crítico
                  (≤ umbral)
                </strong>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {productosCriticos.map((p) => (
                  <span
                    key={p.id}
                    className="pill-state warn"
                    style={{ fontSize: "0.85rem", padding: "4px 10px" }}
                  >
                    {p.nombre}: <strong>{p.stockDisponible} disponibles</strong>{" "}
                    (mínimo {p.stockCritico || 5})
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tabla de Estado de Stock con Búsqueda y Paginación */}
          <div
            className="card"
            style={{ padding: "20px", marginBottom: "20px" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
                marginBottom: "14px",
              }}
            >
              <h3 style={{ margin: 0 }}>Estado de Stock Actual</h3>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <input
                  className="input"
                  placeholder="Buscar material o SKU..."
                  value={busquedaInventario}
                  onChange={(e) => {
                    setBusquedaInventario(e.target.value);
                    setPaginaStock(1);
                  }}
                  style={{
                    maxWidth: "240px",
                    padding: "8px 12px",
                    fontSize: "0.88rem",
                  }}
                />
                <select
                  className="input"
                  value={filtroStock}
                  onChange={(e) => {
                    setFiltroStock(e.target.value);
                    setPaginaStock(1);
                  }}
                  style={{
                    maxWidth: "160px",
                    padding: "8px 12px",
                    fontSize: "0.88rem",
                  }}
                >
                  <option value="TODOS">Todos</option>
                  <option value="CRITICO">Stock Crítico</option>
                  <option value="AGOTADO">Agotados</option>
                </select>
              </div>
            </div>

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Producto</th>
                    <th scope="col">SKU</th>
                    <th scope="col">Categoría</th>
                    <th scope="col" style={{ textAlign: "right" }}>
                      Físico
                    </th>
                    <th scope="col" style={{ textAlign: "right" }}>
                      Reservado
                    </th>
                    <th scope="col" style={{ textAlign: "right" }}>
                      Disponible
                    </th>
                    <th scope="col">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {productosStockPaginados.map((p) => {
                    const agotado = p.stockDisponible <= 0;
                    const critico =
                      !agotado && p.stockDisponible <= (p.stockCritico || 5);
                    return (
                      <tr key={p.id}>
                        <td>
                          <strong>{p.nombre}</strong>
                        </td>
                        <td>{p.sku || `PROD-${p.id}`}</td>
                        <td>{p.categoria || "Material"}</td>
                        <td style={{ textAlign: "right" }}>{p.stockFisico}</td>
                        <td style={{ textAlign: "right" }}>
                          {p.stockReservado}
                        </td>
                        <td
                          style={{
                            textAlign: "right",
                            fontWeight: 700,
                            color: agotado
                              ? "#9c2e22"
                              : critico
                                ? "#b45309"
                                : "#18543c",
                          }}
                        >
                          {p.stockDisponible}
                        </td>
                        <td>
                          <span
                            className={`staff-badge ${agotado ? "staff-stock-bad" : critico ? "staff-stock-warn" : "staff-stock-ok"}`}
                          >
                            {agotado
                              ? "Agotado"
                              : critico
                                ? "Crítico"
                                : "Disponible"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {productosStockPaginados.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        style={{ textAlign: "center", color: "var(--muted)" }}
                      >
                        No hay productos que coincidan con los filtros
                        seleccionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPaginasStock > 1 && (
              <div className="pagination-bar">
                <span>
                  Página {paginaStock} de {totalPaginasStock} (
                  {productosStockFiltrados.length} artículos)
                </span>
                <div className="pagination-controls">
                  <button
                    type="button"
                    disabled={paginaStock <= 1}
                    onClick={() => setPaginaStock((p) => Math.max(1, p - 1))}
                  >
                    ← Anterior
                  </button>
                  <button
                    type="button"
                    disabled={paginaStock >= totalPaginasStock}
                    onClick={() =>
                      setPaginaStock((p) => Math.min(totalPaginasStock, p + 1))
                    }
                  >
                    Siguiente →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Planilla de Inventario Físico (Imprimible y Exportable) */}
          <div
            className="card"
            style={{
              padding: "20px",
              marginBottom: "20px",
              background: "#f8faf8",
              border: "1px solid #cfe0cd",
            }}
          >
            <span className="eyebrow">AUDITORÍA FÍSICA EN BODEGA</span>
            <h3 style={{ margin: "4px 0 10px" }}>
              Planilla de inventario físico
            </h3>
            <p className="card-desc">
              Genera la planilla para conteo físico en bodega con fecha y firma
              responsable.
            </p>
            <div
              style={{
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <button
                type="button"
                className="btn secondary"
                onClick={() => window.print()}
              >
                🖨 Imprimir planilla para conteo
              </button>
              <button
                type="button"
                className="btn secondary"
                onClick={() => {
                  const csv = [
                    "ID;SKU;Producto;Categoria;StockFisicoActual;ConteoFisicoReal;Diferencia",
                    ...(productos.datos ?? []).map(
                      (p) =>
                        `${p.id};${p.sku || ""};"${p.nombre}";"${p.categoria || ""}";${p.stockFisico};;`,
                    ),
                  ].join("\n");
                  const blob = new Blob([csv], {
                    type: "text/csv;charset=utf-8;",
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `planilla-inventario-${new Date().toISOString().slice(0, 10)}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                📥 Descargar planilla CSV
              </button>
            </div>
          </div>
        </section>
      )}
      {seccion === "inventario-ajustes" && (
        <section className="account-section">
          {!esAdmin && (
            <div
              className="card"
              style={{ padding: "20px", marginBottom: "20px" }}
            >
              <span className="eyebrow">SOLICITUD DE MODIFICACIÓN</span>
              <h3 style={{ margin: "4px 0 14px" }}>
                Solicitar ajuste de stock
              </h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  solicitar();
                }}
                style={{ display: "grid", gap: "12px", maxWidth: "500px" }}
              >
                <div>
                  <label htmlFor="producto-ajuste">Producto</label>
                  <select
                    id="producto-ajuste"
                    aria-label="Producto"
                    className="input"
                    value={producto}
                    onChange={(e) => setProducto(e.target.value)}
                    required
                  >
                    <option value="">Selecciona</option>
                    {productos.datos?.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="cantidad-ajuste">Cantidad a ajustar</label>
                  <input
                    id="cantidad-ajuste"
                    className="input"
                    type="number"
                    step="1"
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="motivo-ajuste">Motivo</label>
                  <input
                    id="motivo-ajuste"
                    className="input"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    required
                  />
                </div>
                <button
                  className="btn"
                  disabled={procesando}
                  style={{ justifySelf: "start" }}
                >
                  Solicitar
                </button>
              </form>
            </div>
          )}

          <div className="card" style={{ padding: "20px" }}>
            <span className="eyebrow">CONTROL DE CAMBIOS</span>
            <h3 style={{ margin: "4px 0 14px" }}>Solicitudes de ajuste</h3>
            {ajustes.error && <p role="alert">{ajustes.error}</p>}
            {ajustes.datos?.length === 0 && (
              <p>No hay solicitudes registradas.</p>
            )}
            <div style={{ display: "grid", gap: "10px" }}>
              {solicitudesOrdenadas.map((a) => (
                <article
                  key={a.id}
                  style={{
                    padding: "12px 16px",
                    borderRadius: "10px",
                    background: "#fff",
                    border: "1px solid #e2ddd3",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "10px",
                  }}
                >
                  <div>
                    <span
                      className={`staff-badge ${a.estado === "APROBADA" ? "staff-stock-ok" : a.estado === "RECHAZADA" ? "staff-stock-bad" : "staff-stock-warn"}`}
                    >
                      {a.estado}
                    </span>
                    <p style={{ margin: "6px 0 0", fontSize: "14px" }}>
                      Producto {a.productoId} · {a.cantidad} · {a.motivo} ·{" "}
                      {a.estado}
                    </p>
                  </div>
                  {esAdmin && a.estado === "PENDIENTE" && (
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        className="btn"
                        disabled={procesando}
                        onClick={() => aprobar(a.id)}
                      >
                        Aprobar
                      </button>
                      <button
                        className="btn secondary"
                        disabled={procesando}
                        onClick={() => {
                          const razon = window.prompt("Motivo del rechazo");
                          if (razon?.trim()) void rechazar(a.id, razon);
                        }}
                      >
                        Rechazar
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* MÓDULO: CATÁLOGO Y STOCK */}
      {seccion === "gestion-catalogo" && (
        <section className="account-section">
          <GestionCatalogo
            productos={productos.datos ?? []}
            actualizar={productos.recargar}
          />
        </section>
      )}

      {seccion === "inventario-movimientos" && (
        <section className="account-section">
          <MovimientosInventario movimientos={movimientos} />
        </section>
      )}
      {/* MÓDULO: ENTREGA DIRECTA (ENCARGADO) */}
      {!esAdmin && seccion === "entregas" && (
        <section className="account-section">
          <button
            type="button"
            className="back-link secondary"
            onClick={() => setSeccion("inicio")}
          >
            ← Volver al inicio del encargado
          </button>
          <EntregaMeson
            productos={productos.datos ?? []}
            actualizar={productos.recargar}
          />
        </section>
      )}

      {/* MÓDULO: HISTORIAL (ENCARGADO) */}
      {!esAdmin && seccion === "historial" && (
        <section className="account-section">
          <button
            type="button"
            className="back-link secondary"
            onClick={() => setSeccion("inicio")}
          >
            ← Volver al inicio del encargado
          </button>
          <HistorialOperativo />
        </section>
      )}

      {/* MÓDULO: PERSONAS Y ALUMNOS (ADMIN) */}
      {esAdmin && seccion === "personas" && (
        <section className="account-section">
          <button
            type="button"
            className="back-link secondary"
            onClick={() => setSeccion("inicio")}
          >
            ← Volver al inicio de administración
          </button>
          <GestionUsuarios />
        </section>
      )}

      {/* Rutas antiguas: la auditoría central ya no forma parte del portal. */}
      {esAdmin && ["auditoria", "configuracion"].includes(seccion) && (
        <section className="account-section">
          <p>Esta sección ya no está disponible. Consulta los módulos de gestión correspondientes.</p>
          <button type="button" className="btn secondary" onClick={() => setSeccion("inicio")}>
            ← Volver al inicio de administración
          </button>
        </section>
      )}

      {/* MÓDULO: MIS DATOS (TODOS) */}
      {seccion === "correcciones" && (
        <section className="account-section">
          <button
            type="button"
            className="back-link secondary"
            onClick={() => setSeccion("inicio")}
          >
            ← Volver al inicio {esAdmin ? "de administración" : "del encargado"}
          </button>
          <CorreccionDatos />
        </section>
      )}

      {/* MÓDULO: PRIVACIDAD Y SEGURIDAD (TODOS) */}
      {seccion === "privacidad" && (
        <section className="account-section">
          <button
            type="button"
            className="back-link secondary"
            onClick={() => setSeccion("inicio")}
          >
            ← Volver al inicio {esAdmin ? "de administración" : "del encargado"}
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
