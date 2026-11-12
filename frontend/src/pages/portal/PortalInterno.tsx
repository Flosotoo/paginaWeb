import { useState } from "react";
import type { Reserva } from "../../services/reservas";
import { HistorialOperativo } from "./HistorialOperativo";
import { CancelacionReserva } from "./CancelacionReserva";
import { Administracion } from "./Administracion";
import { CambiarClave } from "./CambiarClave";
import { CorreosSimulados } from "./CorreosSimulados";
import { Privacidad } from "./Privacidad";
import { CorreccionDatos } from "./CorreccionDatos";
import { EntregaMeson } from "./EntregaMeson";
import { GestionCatalogo } from "./GestionCatalogo";
import { GestionUsuarios } from "./GestionUsuarios";
import { usePortalInterno } from "../../hooks/usePortalInterno";

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
    solicitar,
    preparar,
    entregar,
    cancelar,
    aprobar,
    rechazar,
  } = usePortalInterno();

  const esAdmin = usuario?.rol === "ADMINISTRADOR";

  // Sub-filtros y paginación para Reservas
  const [filtroReservaEstado, setFiltroReservaEstado] = useState<string>("TODAS");
  const [busquedaReserva, setBusquedaReserva] = useState<string>("");
  const [paginaReserva, setPaginaReserva] = useState<number>(1);
  const [verificacionManual, setVerificacionManual] = useState<Record<number, boolean>>({});
  const [conteoPistoleo, setConteoPistoleo] = useState<Record<number, Record<number, number>>>({});
  const [inputPistoleo, setInputPistoleo] = useState<Record<number, string>>({});
  const [avisoPistoleo, setAvisoPistoleo] = useState<Record<number, string>>({});

  const procesarPistoleo = (reservaId: number, codigo: string, items: { productoId: number; cantidad: number }[]) => {
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
      setAvisoPistoleo({ ...avisoPistoleo, [reservaId]: `Código "${codigo}" no coincide con ningún material de esta reserva.` });
      return;
    }

    const conteoActual = conteoPistoleo[reservaId]?.[itemEncontrado.productoId] ?? 0;
    if (conteoActual >= itemEncontrado.cantidad) {
      setAvisoPistoleo({ ...avisoPistoleo, [reservaId]: `Este material ya completó sus ${itemEncontrado.cantidad} unidades.` });
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

  const pistolearItemDirecto = (reservaId: number, productoId: number, cantidadMax: number) => {
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

  const estaListaParaEmbolsar = (reservaId: number, items: { productoId: number; cantidad: number }[]) => {
    if (verificacionManual[reservaId]) return true;
    if (!items || items.length === 0) return true;
    return items.every((i) => (conteoPistoleo[reservaId]?.[i.productoId] ?? 0) >= i.cantidad);
  };

  const abrirEtiquetaImprimible = (r: Reserva) => {
    const popup = window.open("", "_blank", "width=640,height=720");
    if (!popup) return;

    const itemsHtml = r.items
      .map(
        (i) => `
        <tr>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0;">
            <strong>${i.nombreProducto}</strong>
          </td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: bold;">
            ${i.cantidad}
          </td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">
            $${(i.precioUnitario ?? 0).toLocaleString("es-CL")}
          </td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold;">
            $${((i.precioUnitario ?? 0) * i.cantidad).toLocaleString("es-CL")}
          </td>
        </tr>`
      )
      .join("");

    popup.document.write(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Etiqueta de Bolsa - BOL-${r.codigo}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: #f8fafc;
      color: #0f172a;
      padding: 24px 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .ticket-container {
      background: #ffffff;
      width: 100%;
      max-width: 500px;
      border: 2px dashed #64748b;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 4px 14px rgba(0,0,0,0.06);
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 14px;
      margin-bottom: 16px;
    }
    .school-title {
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 2px;
      color: #18543c;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .main-heading {
      font-size: 19px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 10px;
    }
    .bag-badge {
      display: inline-block;
      background: #173b31;
      color: #ffffff;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 18px;
      font-weight: 900;
      letter-spacing: 1px;
      padding: 8px 16px;
      border-radius: 8px;
      margin-bottom: 6px;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      background: #f1f5f9;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 12px;
      margin-bottom: 16px;
    }
    .meta-item strong {
      display: block;
      color: #64748b;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      margin-bottom: 16px;
    }
    th {
      background: #f8fafc;
      border-bottom: 2px solid #cbd5e1;
      padding: 8px 10px;
      text-align: left;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #475569;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 16px;
      font-size: 14px;
      font-weight: 800;
    }
    .total-price {
      font-size: 20px;
      color: #18543c;
    }
    .footer-instructions {
      margin-top: 16px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
      line-height: 1.4;
    }
    .btn-bar {
      margin-top: 20px;
      display: flex;
      gap: 12px;
      justify-content: center;
    }
    .print-btn {
      background: #18543c;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 14px;
      cursor: pointer;
    }
    .close-btn {
      background: #e2e8f0;
      color: #334155;
      border: none;
      padding: 10px 18px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
    }
    @media print {
      body {
        background: transparent;
        padding: 0;
      }
      .ticket-container {
        border: 1px dashed #000;
        box-shadow: none;
        max-width: 100%;
        padding: 10px;
      }
      .btn-bar {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="ticket-container">
    <div class="header">
      <div class="school-title">EduSaldo · Librería Escolar</div>
      <h1 class="main-heading">Comprobante de Bolsa de Reserva</h1>
      <div class="bag-badge">BOL-${r.codigo}</div>
    </div>

    <div class="meta-grid">
      <div class="meta-item">
        <strong>Código de Reserva</strong>
        <span>${r.codigo}</span>
      </div>
      <div class="meta-item">
        <strong>Identificador Alumno</strong>
        <span>Alumno N° ${r.alumnoId}</span>
      </div>
      <div class="meta-item">
        <strong>Fecha de Emisión</strong>
        <span>${new Date().toLocaleDateString("es-CL")}</span>
      </div>
      <div class="meta-item">
        <strong>Hora de Emisión</strong>
        <span>${new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}</span>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Material / Artículo</th>
          <th style="text-align: center;">Cant.</th>
          <th style="text-align: right;">Unitario</th>
          <th style="text-align: right;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <div class="total-row">
      <span>Total reservado:</span>
      <span class="total-price">$${r.total.toLocaleString("es-CL")}</span>
    </div>

    <p class="footer-instructions">
      📌 Adherir esta etiqueta a la bolsa antes de ubicarla en el estante de retiro presencial.
    </p>

    <div class="btn-bar">
      <button class="print-btn" onclick="window.print()">🖨️ Imprimir etiqueta</button>
      <button class="close-btn" onclick="window.close()">Cerrar</button>
    </div>
  </div>

  <script>
    window.addEventListener("load", function() {
      setTimeout(function() {
        window.print();
      }, 350);
    });
  </script>
</body>
</html>`);
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
    if (filtroReservaEstado === "PENDIENTE" && r.estado !== "PENDIENTE") return false;
    if (filtroReservaEstado === "LISTA_PARA_RETIRO" && r.estado !== "LISTA_PARA_RETIRO") return false;
    if (
      filtroReservaEstado === "HISTORIAL" &&
      !["ENTREGADA", "CANCELADA"].includes(r.estado)
    )
      return false;
    if (busquedaReserva.trim()) {
      const q = busquedaReserva.trim().toLowerCase();
      const coincide =
        r.codigo.toLowerCase().includes(q) ||
        String(r.alumnoId).includes(q) ||
        r.items.some((i) => i.nombreProducto.toLowerCase().includes(q));
      if (!coincide) return false;
    }
    return true;
  });

  const TAMANO_PAGINA_RESERVA = 6;
  const totalPaginasReserva = Math.max(1, Math.ceil(reservasFiltradas.length / TAMANO_PAGINA_RESERVA));
  const reservasPaginadas = reservasFiltradas.slice(
    (paginaReserva - 1) * TAMANO_PAGINA_RESERVA,
    paginaReserva * TAMANO_PAGINA_RESERVA,
  );

  // Filtrado de Inventario
  const productosOrdenados = [...(productos.datos ?? [])].sort((a, b) => b.id - a.id);
  const productosCriticos = productosOrdenados.filter(
    (p) => p.stockDisponible <= (p.stockCritico || 5),
  );

  const productosStockFiltrados = productosOrdenados.filter((p) => {
    if (filtroStock === "CRITICO" && p.stockDisponible > (p.stockCritico || 5)) return false;
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
  const totalPaginasStock = Math.max(1, Math.ceil(productosStockFiltrados.length / TAMANO_PAGINA_STOCK));
  const productosStockPaginados = productosStockFiltrados.slice(
    (paginaStock - 1) * TAMANO_PAGINA_STOCK,
    paginaStock * TAMANO_PAGINA_STOCK,
  );

  // Solicitudes ordenadas más recientes primero
  const solicitudesOrdenadas = [...(ajustes.datos ?? [])].sort((a, b) => b.id - a.id);

  return (
    <main className="dashboard staff-dashboard">
      {aviso && <p role="status" className="form-feedback">{aviso}</p>}

      {/* VISTA INICIO PARA ENCARGADO */}
      {!esAdmin && seccion === "inicio" && (
        <>
          <section className="staff-hero">
            <span className="eyebrow">ÁREA DEL ENCARGADO</span>
            <h1>Materiales listos para cada día.</h1>
            <p>
              Prepara reservas, registra entregas y consulta existencias desde un solo lugar.
            </p>
          </section>

          <section className="staff-stats" id="staff-stats">
            <div className="staff-stat">
              <strong>{porPreparar}</strong>
              <span>Reservas por preparar</span>
            </div>
            <div className="staff-stat">
              <strong>{pendientesEntrega}</strong>
              <span>Reservas pendientes de entrega</span>
            </div>
            <div className="staff-stat">
              <strong>{stockCritico}</strong>
              <span>Disponibilidad crítica (≤ 5)</span>
            </div>
            <div className="staff-stat">
              <strong>{entregadas}</strong>
              <span>Reservas entregadas</span>
            </div>
          </section>

          <section className="staff-grid" style={{ marginBottom: "30px" }}>
            <button
              type="button"
              className="staff-tile"
              onClick={() => setSeccion("reservas")}
              style={{ textAlign: "left", cursor: "pointer", border: "none", width: "100%" }}
            >
              <span className="staff-symbol">▤</span>
              <span style={{ display: "block", font: '400 29px "DM Serif Display", Georgia, serif', margin: "8px 0" }}>Reservas</span>
              <p>Consulta reservas por preparar y pendientes de retiro.</p>
              <b>Ver reservas →</b>
            </button>
            <button
              type="button"
              className="staff-tile peach"
              onClick={() => setSeccion("entregas")}
              style={{ textAlign: "left", cursor: "pointer", border: "none", width: "100%" }}
            >
              <span className="staff-symbol">⌁</span>
              <span style={{ display: "block", font: '400 29px "DM Serif Display", Georgia, serif', margin: "8px 0" }}>Entrega directa</span>
              <p>Entrega presencial para alumnos en mesón de librería.</p>
              <b>Registrar entrega →</b>
            </button>
            <button
              type="button"
              className="staff-tile sage"
              onClick={() => setSeccion("inventario")}
              style={{ textAlign: "left", cursor: "pointer", border: "none", width: "100%" }}
            >
              <span className="staff-symbol">▦</span>
              <span style={{ display: "block", font: '400 29px "DM Serif Display", Georgia, serif', margin: "8px 0" }}>Existencias</span>
              <p>Consulta existencias físicas y solicita ajustes de stock.</p>
              <b>Ver inventario →</b>
            </button>
            <button
              type="button"
              className="staff-tile cream"
              onClick={() => setSeccion("historial")}
              style={{ textAlign: "left", cursor: "pointer", border: "none", width: "100%" }}
            >
              <span className="staff-symbol">↶</span>
              <span style={{ display: "block", font: '400 29px "DM Serif Display", Georgia, serif', margin: "8px 0" }}>Historial</span>
              <p>Revisa trazabilidad y movimientos registrados.</p>
              <b>Consultar →</b>
            </button>
          </section>
        </>
      )}

      {/* VISTA INICIO PARA ADMINISTRADOR */}
      {esAdmin && seccion === "inicio" && (
        <>
          <section className="admin-welcome" style={{ marginBottom: "25px" }}>
            <div>
              <span className="eyebrow">CENTRO GENERAL DE PADRES</span>
              <h2>Administración de la librería escolar</h2>
              <p>Supervisa inventario, nómina de usuarios, auditoría y cartola general.</p>
            </div>
            <div className="admin-welcome-mark">e</div>
          </section>

          <div className="admin-home-grid" style={{ marginBottom: "30px" }}>
            <button
              type="button"
              className="admin-home-card"
              onClick={() => setSeccion("gestion-catalogo")}
              style={{ textAlign: "left", background: "#fffcf7", border: "none", cursor: "pointer", width: "100%" }}
            >
              <span className="admin-card-icon">🛍</span>
              <div>
                <h3>Catálogo y Creación de Productos</h3>
                <p>Precios, cálculo de utilidad, categorías y nuevos artículos.</p>
              </div>
              <b>→</b>
            </button>
            <button
              type="button"
              className="admin-home-card"
              onClick={() => setSeccion("inventario")}
              style={{ textAlign: "left", background: "#fffcf7", border: "none", cursor: "pointer", width: "100%" }}
            >
              <span className="admin-card-icon">▦</span>
              <div>
                <h3>Inventario y Solicitudes de Ajuste</h3>
                <p>Stock físico, alertas críticas y aprobación de ajustes.</p>
              </div>
              <b>→</b>
            </button>
            <button
              type="button"
              className="admin-home-card"
              onClick={() => setSeccion("personas")}
              style={{ textAlign: "left", background: "#fffcf7", border: "none", cursor: "pointer", width: "100%" }}
            >
              <span className="admin-card-icon">👥</span>
              <div>
                <h3>Personas, Matrícula y Nómina</h3>
                <p>Alta de apoderados y alumnos, carga masiva CSV y vínculos.</p>
              </div>
              <b>→</b>
            </button>
            <button
              type="button"
              className="admin-home-card"
              onClick={() => setSeccion("reservas")}
              style={{ textAlign: "left", background: "#fffcf7", border: "none", cursor: "pointer", width: "100%" }}
            >
              <span className="admin-card-icon">📋</span>
              <div>
                <h3>Reservas y Entregas</h3>
                <p>Supervisión de pedidos, preparación y cancelaciones.</p>
              </div>
              <b>→</b>
            </button>
            <button
              type="button"
              className="admin-home-card"
              onClick={() => setSeccion("auditoria")}
              style={{ textAlign: "left", background: "#fffcf7", border: "none", cursor: "pointer", width: "100%" }}
            >
              <span className="admin-card-icon">💰</span>
              <div>
                <h3>Finanzas y Conciliación Webpay</h3>
                <p>Abonos bancarios simulados, cartola contable y exportación.</p>
              </div>
              <b>→</b>
            </button>
            <button
              type="button"
              className="admin-home-card"
              onClick={() => setSeccion("auditoria")}
              style={{ textAlign: "left", background: "#fffcf7", border: "none", cursor: "pointer", width: "100%" }}
            >
              <span className="admin-card-icon">⚙</span>
              <div>
                <h3>Configuración y Auditoría</h3>
                <p>Políticas de seguridad, log institucional y correos simulados.</p>
              </div>
              <b>→</b>
            </button>
          </div>
        </>
      )}

      {/* MÓDULO: RESERVAS */}
      {seccion === "reservas" && (
        <section className="account-section" id="reservas">
          <button
            type="button"
            className="back-link secondary"
            onClick={() => setSeccion("inicio")}
          >
            ← Volver al inicio {esAdmin ? "de administración" : "del encargado"}
          </button>
          <div className="section-heading">
            <div>
              <span className="eyebrow">OPERACIONES</span>
              <h2 id="reservas">Reservas</h2>
            </div>
          </div>

          {/* Sub-filtros por estado */}
          <div className="category-list" style={{ marginBottom: "16px" }}>
            {[
              ["TODAS", `Todas (${reservas.datos?.length ?? 0})`],
              ["PENDIENTE", `Por preparar (${porPreparar})`],
              ["LISTA_PARA_RETIRO", `Listas para retiro (${pendientesEntrega})`],
              ["HISTORIAL", `Entregadas / Canceladas (${entregadas + (reservas.datos?.filter((r) => r.estado === "CANCELADA").length ?? 0)})`],
            ].map(([clave, etiqueta]) => (
              <button
                key={clave}
                type="button"
                className={`category-chip ${filtroReservaEstado === clave ? "active" : ""}`}
                onClick={() => {
                  setFiltroReservaEstado(clave);
                  setPaginaReserva(1);
                }}
              >
                {etiqueta}
              </button>
            ))}
          </div>

          {/* Buscador de reserva */}
          <div style={{ marginBottom: "16px", maxWidth: "420px" }}>
            <label htmlFor="busqueda-reserva" style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
              Buscar por código o número de alumno
            </label>
            <input
              id="busqueda-reserva"
              className="input"
              placeholder="Ej: RES-..., o 4"
              value={busquedaReserva}
              onChange={(e) => {
                setBusquedaReserva(e.target.value);
                setPaginaReserva(1);
              }}
              style={{ marginTop: "4px" }}
            />
          </div>

          {reservas.error && <p role="alert">{reservas.error}</p>}
          {reservas.cargando && <p>Cargando reservas…</p>}
          {reservasFiltradas.length === 0 && <p>No hay reservas en este estado.</p>}

          <div style={{ display: "grid", gap: "16px" }}>
            {reservasPaginadas.map((r) => (
              <article key={r.id} className="card" style={{ padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                  <div>
                    <span className={`staff-badge ${r.estado === "ENTREGADA" ? "staff-stock-ok" : r.estado === "CANCELADA" ? "staff-stock-bad" : "staff-stock-warn"}`}>
                      {r.estado}
                    </span>
                    <h3 style={{ margin: "6px 0 2px" }}>
                      {r.codigo} · {r.estado}
                    </h3>
                    <p style={{ margin: "4px 0", color: "var(--muted)", fontSize: "14px" }}>
                      Alumno {r.alumnoId} · ${r.total.toLocaleString("es-CL")}
                      {r.items?.length
                        ? ` · ${r.items.map((i) => `${i.nombreProducto} (${i.cantidad})`).join(", ")}`
                        : ""}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                    {r.estado === "PENDIENTE" && (
                      <button
                        className="btn"
                        disabled={procesando || !estaListaParaEmbolsar(r.id, r.items)}
                        onClick={() => preparar(r.id)}
                      >
                        Marcar lista
                      </button>
                    )}
                    {r.estado === "LISTA_PARA_RETIRO" && (
                      <button
                        className="btn"
                        disabled={procesando}
                        onClick={() => entregar(r.id)}
                      >
                        Registrar entrega
                      </button>
                    )}
                  </div>
                </div>

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
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
                      <div>
                        <strong style={{ color: "#173b31", fontSize: "14px" }}>Asistente de pistoleo y preparación de bolsa</strong>
                        <p style={{ margin: "2px 0 0", color: "var(--muted)", fontSize: "12px" }}>
                          Pistolea el código de barra o SKU de cada artículo al introducirlo en la bolsa de retiro.
                        </p>
                      </div>
                      <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", margin: 0, fontSize: "12px" }}>
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
                        <span style={{ fontWeight: 700, color: "#18543c" }}>Omitir / Forzar verificación manual</span>
                      </label>
                    </div>

                    {/* Input de escaneo con pistola o teclado */}
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "12px", flexWrap: "wrap" }}>
                      <input
                        className="input"
                        style={{ maxWidth: "340px", padding: "8px 12px", fontSize: "13px" }}
                        placeholder="Pistolear código de barra o SKU..."
                        value={inputPistoleo[r.id] ?? ""}
                        onChange={(e) => setInputPistoleo({ ...inputPistoleo, [r.id]: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            procesarPistoleo(r.id, inputPistoleo[r.id] ?? "", r.items);
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="btn secondary"
                        style={{ minHeight: "36px", padding: "6px 14px", fontSize: "12px" }}
                        onClick={() => procesarPistoleo(r.id, inputPistoleo[r.id] ?? "", r.items)}
                      >
                        Ingresar código
                      </button>
                    </div>

                    {avisoPistoleo[r.id] && (
                      <p style={{ margin: "0 0 10px", color: "#b91c1c", fontSize: "12px", fontWeight: 600 }}>
                        ⚠ {avisoPistoleo[r.id]}
                      </p>
                    )}

                    {/* Lista de artículos con conteo de pistoleo */}
                    <div style={{ display: "grid", gap: "6px" }}>
                      {r.items.map((i) => {
                        const prod = productos.datos?.find((p) => p.id === i.productoId);
                        const pistoleados = conteoPistoleo[r.id]?.[i.productoId] ?? 0;
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
                              <strong style={{ color: completo ? "#18543c" : "#242b28" }}>
                                {completo ? "✓ " : ""}{i.nombreProducto}
                              </strong>{" "}
                              <small style={{ color: "var(--muted)" }}>
                                · SKU: {prod?.sku || `PROD-${i.productoId}`}
                              </small>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span
                                style={{
                                  fontWeight: 800,
                                  color: completo ? "#18543c" : "#6a5749",
                                  background: completo ? "#d8ebd9" : "#f4eee4",
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
                                  style={{ minHeight: "26px", padding: "2px 8px", fontSize: "11px" }}
                                  onClick={() => pistolearItemDirecto(r.id, i.productoId, i.cantidad)}
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
                      <div style={{ marginTop: "10px", color: "#18543c", fontWeight: 700, fontSize: "13px" }}>
                        ✓ Todos los artículos han sido verificados. Puedes marcar la reserva como lista para retiro.
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
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "10px" }}>
                      <div>
                        <strong style={{ color: "#18543c" }}>Código de bolsa asignado:</strong>{" "}
                        <code style={{ background: "#ffffff", padding: "3px 8px", borderRadius: "6px", fontWeight: 800, color: "#173b31" }}>
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
                    <p style={{ margin: 0, fontSize: "12px", color: "#2d6349" }}>
                      Verifica la etiqueta de la bolsa (<code>BOL-{r.codigo}</code>) antes de presionar "Registrar entrega".
                    </p>
                  </div>
                )}

                {["PENDIENTE", "LISTA_PARA_RETIRO"].includes(r.estado) && (
                  <div style={{ marginTop: "14px", borderTop: "1px solid #e8e4da", paddingTop: "10px" }}>
                    <CancelacionReserva
                      procesando={procesando}
                      cancelar={(motivo) => cancelar(r.id, motivo)}
                    />
                  </div>
                )}
              </article>
            ))}
          </div>

          {/* Barra de Paginación de Reservas */}
          {totalPaginasReserva > 1 && (
            <div className="pagination-bar">
              <span>
                Página {paginaReserva} de {totalPaginasReserva} ({reservasFiltradas.length} reservas)
              </span>
              <div className="pagination-controls">
                <button
                  type="button"
                  disabled={paginaReserva <= 1}
                  onClick={() => setPaginaReserva((p) => Math.max(1, p - 1))}
                >
                  ← Anterior
                </button>
                <button
                  type="button"
                  disabled={paginaReserva >= totalPaginasReserva}
                  onClick={() => setPaginaReserva((p) => Math.min(totalPaginasReserva, p + 1))}
                >
                  Siguiente →
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* MÓDULO: INVENTARIO */}
      {seccion === "inventario" && (
        <section className="account-section" id="inventario">
          <button
            type="button"
            className="back-link secondary"
            onClick={() => setSeccion("inicio")}
          >
            ← Volver al inicio {esAdmin ? "de administración" : "del encargado"}
          </button>
          <div className="section-heading">
            <div>
              <span className="eyebrow">EXISTENCIAS</span>
              <h2 id="inventario">Inventario</h2>
            </div>
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
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <span style={{ fontSize: "1.2rem" }}>⚠</span>
                <strong style={{ color: "#92400e", fontSize: "1rem" }}>
                  Alerta: {productosCriticos.length} productos con stock crítico (≤ umbral)
                </strong>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {productosCriticos.map((p) => (
                  <span
                    key={p.id}
                    className="pill-state warn"
                    style={{ fontSize: "0.85rem", padding: "4px 10px" }}
                  >
                    {p.nombre}: <strong>{p.stockDisponible} disponibles</strong> (mínimo {p.stockCritico || 5})
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tabla de Estado de Stock con Búsqueda y Paginación */}
          <div className="card" style={{ padding: "20px", marginBottom: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "14px" }}>
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
                  style={{ maxWidth: "240px", padding: "8px 12px", fontSize: "0.88rem" }}
                />
                <select
                  className="input"
                  value={filtroStock}
                  onChange={(e) => {
                    setFiltroStock(e.target.value);
                    setPaginaStock(1);
                  }}
                  style={{ maxWidth: "160px", padding: "8px 12px", fontSize: "0.88rem" }}
                >
                  <option value="TODOS">Todos</option>
                  <option value="CRITICO">Stock Crítico</option>
                  <option value="AGOTADO">Agotados</option>
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gap: "8px" }}>
              {productosStockPaginados.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 12px",
                    background: "#fbf9f5",
                    borderRadius: "8px",
                    border: "1px solid #eee8df",
                    fontSize: "14px",
                    flexWrap: "wrap",
                    gap: "6px",
                  }}
                >
                  <p style={{ margin: 0 }}>
                    <strong>{p.nombre}:</strong> {p.stockFisico} físicos · {p.stockReservado} reservados ·{" "}
                    <span style={{ fontWeight: 700, color: p.stockDisponible <= 0 ? "#9c2e22" : p.stockDisponible <= (p.stockCritico || 5) ? "#b45309" : "#18543c" }}>
                      {p.stockDisponible} disponibles
                    </span>
                  </p>
                  <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                    SKU {p.sku || p.id} · {p.categoria || "Material"}
                  </span>
                </div>
              ))}
            </div>

            {totalPaginasStock > 1 && (
              <div className="pagination-bar">
                <span>
                  Página {paginaStock} de {totalPaginasStock} ({productosStockFiltrados.length} artículos)
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
                    onClick={() => setPaginaStock((p) => Math.min(totalPaginasStock, p + 1))}
                  >
                    Siguiente →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Planilla de Inventario Físico (Imprimible y Exportable) */}
          <div className="card" style={{ padding: "20px", marginBottom: "20px", background: "#f8faf8", border: "1px solid #cfe0cd" }}>
            <span className="eyebrow">AUDITORÍA FÍSICA EN BODEGA</span>
            <h3 style={{ margin: "4px 0 10px" }}>Planilla de inventario físico</h3>
            <p className="card-desc">Genera la planilla para conteo físico en bodega con fecha y firma responsable.</p>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
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
                    ...(productos.datos ?? []).map(p => `${p.id};${p.sku || ""};"${p.nombre}";"${p.categoria || ""}";${p.stockFisico};;`),
                  ].join("\n");
                  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
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

          {!esAdmin && (
            <div className="card" style={{ padding: "20px", marginBottom: "20px" }}>
              <span className="eyebrow">SOLICITUD DE MODIFICACIÓN</span>
              <h3 style={{ margin: "4px 0 14px" }}>Solicitar ajuste de stock</h3>
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
                <button className="btn" disabled={procesando} style={{ justifySelf: "start" }}>
                  Solicitar
                </button>
              </form>
            </div>
          )}

          <div className="card" style={{ padding: "20px" }}>
            <span className="eyebrow">CONTROL DE CAMBIOS</span>
            <h3 style={{ margin: "4px 0 14px" }}>Solicitudes de ajuste</h3>
            {ajustes.error && <p role="alert">{ajustes.error}</p>}
            {ajustes.datos?.length === 0 && <p>No hay solicitudes registradas.</p>}
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
                    <span className={`staff-badge ${a.estado === "APROBADA" ? "staff-stock-ok" : a.estado === "RECHAZADA" ? "staff-stock-bad" : "staff-stock-warn"}`}>
                      {a.estado}
                    </span>
                    <p style={{ margin: "6px 0 0", fontSize: "14px" }}>
                      Producto {a.productoId} · {a.cantidad} · {a.motivo} · {a.estado}
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
          <button
            type="button"
            className="back-link secondary"
            onClick={() => setSeccion("inicio")}
          >
            ← Volver al inicio {esAdmin ? "de administración" : "del encargado"}
          </button>
          <GestionCatalogo
            productos={productos.datos ?? []}
            actualizar={productos.recargar}
          />
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
          <HistorialOperativo movimientos={movimientos} />
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

      {/* MÓDULO: AUDITORÍA Y PARÁMETROS (ADMIN) */}
      {esAdmin && seccion === "auditoria" && (
        <section className="account-section">
          <button
            type="button"
            className="back-link secondary"
            onClick={() => setSeccion("inicio")}
          >
            ← Volver al inicio de administración
          </button>
          <Administracion movimientos={movimientos} />
          <div style={{ marginTop: "24px" }}>
            <CorreosSimulados />
          </div>
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
