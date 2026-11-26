import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import type { Producto } from "../../services/catalogo";
import { proveedoresService, type Proveedor } from "../../services/proveedores";
import {
  ordenesCompraService,
  type EstadoOrdenCompra,
  type OrdenCompra,
} from "../../services/ordenesCompra";
import { useAccion } from "../../hooks/useAccion";
import { mensajeError } from "../../services/api";
import { AlertaMensaje } from "../../components/AlertaMensaje";
import { TablaResponsiva } from "../../components/TablaResponsiva";

export interface GestionOrdenesCompraProps {
  esAdmin: boolean;
  productos: Producto[];
  onStockActualizado: () => Promise<void>;
}

interface LineaBorrador {
  productoId: string;
  cantidad: string;
  precioUnitario: string;
}

const pesos = (valor: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(valor);

const ETIQUETA_ESTADO: Record<EstadoOrdenCompra, string> = {
  PENDIENTE_APROBACION: "Por aprobar",
  APROBADA: "Aprobada",
  RECIBIDA: "Recibida",
};

export function GestionOrdenesCompra({
  esAdmin,
  productos,
  onStockActualizado,
}: GestionOrdenesCompraProps) {
  const [ordenes, setOrdenes] = useState<OrdenCompra[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("TODAS");
  const [ordenDetalle, setOrdenDetalle] = useState<OrdenCompra | null>(null);

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [proveedorId, setProveedorId] = useState("");
  const [observacion, setObservacion] = useState("");
  const [lineas, setLineas] = useState<LineaBorrador[]>([
    { productoId: "", cantidad: "10", precioUnitario: "" },
  ]);

  const { procesando, realizar } = useAccion();

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      const [listaOrdenes, listaProveedores] = await Promise.all([
        ordenesCompraService.listar(),
        proveedoresService.listar(),
      ]);
      setOrdenes(listaOrdenes);
      setProveedores(listaProveedores);
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const proveedoresActivos = useMemo(
    () => proveedores.filter((p) => p.estado === "ACTIVO"),
    [proveedores],
  );

  const productosActivos = useMemo(
    () => productos.filter((p) => p.estado === "ACTIVO"),
    [productos],
  );

  const mapaProveedores = useMemo(
    () => new Map(proveedores.map((p) => [p.id, p.razonSocial])),
    [proveedores],
  );

  const mapaProductos = useMemo(
    () => new Map(productos.map((p) => [p.id, p.nombre])),
    [productos],
  );

  const ordenesFiltradas = useMemo(
    () =>
      ordenes.filter(
        (o) => filtroEstado === "TODAS" || o.estado === filtroEstado,
      ),
    [ordenes, filtroEstado],
  );

  const calculoBorrador = useMemo(() => {
    const neto = lineas.reduce((acc, l) => {
      const cant = Number(l.cantidad);
      const unit = Number(l.precioUnitario);
      if (l.productoId && l.precioUnitario.trim() && Number.isSafeInteger(cant) && cant > 0 && Number.isSafeInteger(unit) && unit >= 0) {
        return acc + cant * unit;
      }
      return acc;
    }, 0);
    const iva = Math.floor((neto * 19 + 50) / 100);
    return { neto, iva, total: neto + iva };
  }, [lineas]);

  const agregarLinea = () => {
    setLineas((prev) => [
      ...prev,
      { productoId: "", cantidad: "1", precioUnitario: "" },
    ]);
  };

  const quitarLinea = (idx: number) => {
    setLineas((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)));
  };

  const actualizarLinea = (
    idx: number,
    campo: keyof LineaBorrador,
    valor: string,
  ) => {
    setLineas((prev) =>
      prev.map((linea, i) => {
        if (i !== idx) return linea;
        const siguiente = { ...linea, [campo]: valor };
        if (campo === "productoId" && valor !== linea.productoId) {
          siguiente.precioUnitario = "";
        }
        return siguiente;
      }),
    );
  };

  const reiniciarFormulario = () => {
    setProveedorId("");
    setObservacion("");
    setLineas([{ productoId: "", cantidad: "10", precioUnitario: "" }]);
    setMostrarFormulario(false);
  };

  const enviarOrden = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setMensaje("");

    const provNum = Number(proveedorId);
    if (!provNum) {
      setError("Selecciona un proveedor activo.");
      return;
    }

    if (lineas.some(l => !l.precioUnitario.trim())) {
      setError("Ingresa el costo neto cotizado por el proveedor en cada línea.");
      return;
    }

    const detalles = lineas.map((l) => ({
      productoId: Number(l.productoId),
      cantidad: Number(l.cantidad),
      precioUnitario: Number(l.precioUnitario),
    }));

    const idsVistos = new Set<number>();
    for (const d of detalles) {
      if (
        !d.productoId ||
        !Number.isSafeInteger(d.cantidad) ||
        d.cantidad <= 0 ||
        !Number.isSafeInteger(d.precioUnitario) ||
        d.precioUnitario < 0
      ) {
        setError("Completa producto, cantidad entera positiva y costo unitario entero en cada línea.");
        return;
      }
      if (idsVistos.has(d.productoId)) {
        setError("No repitas el mismo producto en dos líneas de la orden.");
        return;
      }
      idsVistos.add(d.productoId);
    }

    await realizar(async () => {
      try {
        const creada = await ordenesCompraService.crear({
          proveedorId: provNum,
          observacion: observacion.trim(),
          detalles,
        });
        reiniciarFormulario();
        await cargar();
        setMensaje(`Orden de compra #${creada.id} creada y enviada a aprobación.`);
      } catch (err) {
        setError(mensajeError(err));
      }
    });
  };

  const aprobarOrden = async (id: number) => {
    setError("");
    setMensaje("");
    await realizar(async () => {
      try {
        await ordenesCompraService.aprobar(id);
        await cargar();
        if (ordenDetalle?.id === id) {
          setOrdenDetalle(await ordenesCompraService.obtener(id));
        }
        setMensaje(`Orden de compra #${id} aprobada para recepción.`);
      } catch (err) {
        setError(mensajeError(err));
      }
    });
  };

  const recepcionarOrden = async (id: number) => {
    setError("");
    setMensaje("");
    await realizar(async () => {
      try {
        await ordenesCompraService.recepcionar(id);
        await Promise.all([cargar(), onStockActualizado()]);
        if (ordenDetalle?.id === id) {
          setOrdenDetalle(await ordenesCompraService.obtener(id));
        }
        setMensaje(
          `Mercadería de la orden #${id} recepcionada e ingresada automáticamente al stock físico.`,
        );
      } catch (err) {
        setError(mensajeError(err));
      }
    });
  };

  const verDetalle = async (id: number) => {
    if (ordenDetalle?.id === id) {
      setOrdenDetalle(null);
      return;
    }
    try {
      setOrdenDetalle(await ordenesCompraService.obtener(id));
    } catch (err) {
      setError(mensajeError(err));
    }
  };

  const pendientes = ordenes.filter((o) => o.estado === "PENDIENTE_APROBACION").length;
  const aprobadas = ordenes.filter((o) => o.estado === "APROBADA").length;
  const recibidas = ordenes.filter((o) => o.estado === "RECIBIDA").length;
  const montoRecibido = ordenes
    .filter((o) => o.estado === "RECIBIDA")
    .reduce((s, o) => s + o.total, 0);

  return (
    <div className="ordenes-compra-modulo">
      <AlertaMensaje mensaje={error} tipo="error" />
      <AlertaMensaje mensaje={mensaje} tipo="exito" />

      <div className="row g-2 mb-3">
        {[
          { etiqueta: "Por aprobar", valor: pendientes, fondo: "#e6dac6", color: "#173b31" },
          { etiqueta: "Por recepcionar", valor: aprobadas, fondo: "#fffcf7", color: "#173b31" },
          { etiqueta: "Recibidas", valor: recibidas, fondo: "#fffcf7", color: "#173b31" },
          { etiqueta: "Total compras", valor: pesos(montoRecibido), fondo: "#173b31", color: "#ffffff" },
        ].map(kpi => (
          <div key={kpi.etiqueta} className="col-6 col-xl-3">
            <article style={{ background: kpi.fondo, color: kpi.color, border: "1px solid #ded8ca", borderRadius: "16px", padding: "16px", height: "100%" }}>
              <span style={{ color: kpi.color, fontSize: "0.85rem" }}>{kpi.etiqueta}</span>
              <strong style={{ display: "block", color: kpi.color, fontSize: "1.45rem", marginTop: "8px" }}>{kpi.valor}</strong>
            </article>
          </div>
        ))}
      </div>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <h3 className="mb-0">Órdenes de compra</h3>
        <button type="button" className="btn" disabled={procesando} onClick={() => {
          setMostrarFormulario(v => !v);
          setError("");
          setMensaje("");
        }}>{mostrarFormulario ? "Cerrar formulario" : "+ Nueva orden"}</button>
      </div>

      {mostrarFormulario && (
        <form onSubmit={(e) => void enviarOrden(e)} className="card p-4 mb-4">
          <h3 className="mt-1 mb-3">Nueva orden</h3>

          <div className="row g-3 mb-3">
            <div className="col-12 col-md-6">
              <label className="w-100">
                Proveedor activo *
                <select
                  aria-label="Proveedor activo"
                  className="input mt-1"
                  value={proveedorId}
                  onChange={(e) => {
                    setProveedorId(e.target.value);
                    setLineas(prev => prev.map(l => ({ ...l, precioUnitario: "" })));
                  }}
                  required
                >
                  <option value="">Selecciona un proveedor</option>
                  {proveedoresActivos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.razonSocial} ({p.rut})
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="col-12 col-md-6">
              <label className="w-100">
                Observación
                <input
                  className="input mt-1"
                  maxLength={500}
                  placeholder="Ej: Reposición inicio de semestre"
                  value={observacion}
                  onChange={(e) => setObservacion(e.target.value)}
                />
              </label>
            </div>
          </div>

          <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <strong>Detalle de materiales</strong>
              <button
                type="button"
                className="btn secondary"
                onClick={agregarLinea}
              >
                + Agregar línea
              </button>
            </div>

            <div className="d-grid gap-2">
              {lineas.map((linea, idx) => (
                <div key={idx} className="row g-2 align-items-end p-2 rounded-3 bg-light border">
                  <div className="col-12 col-md-5">
                    <label className="w-100">
                      Producto *
                      <select
                        aria-label={`Producto línea ${idx + 1}`}
                        className="input mt-1"
                        value={linea.productoId}
                        onChange={(e) => actualizarLinea(idx, "productoId", e.target.value)}
                        required
                      >
                        <option value="">Selecciona material</option>
                        {productosActivos.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nombre} · Stock actual: {p.stockFisico}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="col-6 col-md-2">
                    <label className="w-100">
                      Cantidad *
                      <input
                        aria-label={`Cantidad línea ${idx + 1}`}
                        className="input mt-1"
                        type="number"
                        min="1"
                        step="1"
                        value={linea.cantidad}
                        onChange={(e) => actualizarLinea(idx, "cantidad", e.target.value)}
                        required
                      />
                    </label>
                  </div>
                  <div className="col-6 col-md-3">
                    <label className="w-100">
                      Costo unitario neto *
                      <input
                        aria-label={`Costo línea ${idx + 1}`}
                        className="input mt-1"
                        type="number"
                        min="0"
                        step="1"
                        placeholder="Precio cotizado"
                        value={linea.precioUnitario}
                        onChange={(e) => actualizarLinea(idx, "precioUnitario", e.target.value)}
                        required
                      />
                    </label>
                  </div>
                  <div className="col-12 col-md-2 d-flex justify-content-end">
                    <button
                      type="button"
                      className="btn secondary w-100"
                      disabled={lineas.length <= 1}
                      onClick={() => quitarLinea(idx)}
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 pt-2 border-top">
            <div className="small">
              <span className="me-3">
                Neto: <strong>{pesos(calculoBorrador.neto)}</strong>
              </span>
              <span className="me-3">
                IVA (19%): <strong>{pesos(calculoBorrador.iva)}</strong>
              </span>
              <span>
                Total: <strong>{pesos(calculoBorrador.total)}</strong>
              </span>
            </div>
            <div className="d-flex gap-2">
              <button className="btn" type="submit" disabled={procesando}>
                {procesando ? "Registrando…" : "Crear orden de compra"}
              </button>
              <button
                type="button"
                className="btn secondary"
                disabled={procesando}
                onClick={reiniciarFormulario}
              >
                Cancelar
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="card p-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
          <div className="category-list">
            {[
              ["TODAS", `Todas (${ordenes.length})`],
              ["PENDIENTE_APROBACION", `Por aprobar (${pendientes})`],
              ["APROBADA", `Aprobadas (${aprobadas})`],
              ["RECIBIDA", `Recibidas (${recibidas})`],
            ].map(([clave, texto]) => (
              <button
                key={clave}
                type="button"
                className={`category-chip ${filtroEstado === clave ? "active" : ""}`}
                onClick={() => setFiltroEstado(clave)}
              >
                {texto}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="btn secondary"
            disabled={cargando}
            onClick={() => void cargar()}
          >
            Actualizar
          </button>
        </div>

        <TablaResponsiva
          cargando={cargando}
          vacio={ordenesFiltradas.length === 0}
          mensajeCarga="Consultando órdenes de compra…"
          mensajeVacio="No hay órdenes de compra registradas en este estado."
        >
          <table className="data-table">
            <thead>
              <tr>
                <th>OC #</th>
                <th>Proveedor</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Neto</th>
                <th>IVA</th>
                <th>Total</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ordenesFiltradas.map((o) => (
                <tr key={o.id}>
                  <td>
                    <strong style={{ whiteSpace: "nowrap" }}>OC-{o.id}</strong>
                  </td>
                  <td>
                    {mapaProveedores.get(o.proveedor_id) ?? `Proveedor #${o.proveedor_id}`}
                    {o.observacion && (
                      <div className="small text-muted">{o.observacion}</div>
                    )}
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>{String(o.fecha_creacion ?? "").slice(0, 10)}</td>
                  <td>
                    <span
                      className={`staff-badge ${
                        o.estado === "RECIBIDA"
                          ? "staff-stock-ok"
                          : o.estado === "APROBADA"
                            ? "staff-stock-warn"
                            : "neutral"
                      }`}
                    >
                      {ETIQUETA_ESTADO[o.estado] ?? o.estado}
                    </span>
                  </td>
                  <td>{pesos(o.total_neto)}</td>
                  <td>{pesos(o.iva)}</td>
                  <td>
                    <strong>{pesos(o.total)}</strong>
                  </td>
                  <td>
                    <div className="d-flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="btn secondary"
                        onClick={() => void verDetalle(o.id)}
                      >
                        {ordenDetalle?.id === o.id ? "Ocultar" : "Detalle"}
                      </button>
                      {esAdmin && o.estado === "PENDIENTE_APROBACION" && (
                        <button
                          type="button"
                          className="btn"
                          disabled={procesando}
                          onClick={() => void aprobarOrden(o.id)}
                        >
                          Aprobar
                        </button>
                      )}
                      {o.estado === "APROBADA" && (
                        <button
                          type="button"
                          className="btn"
                          disabled={procesando}
                          onClick={() => void recepcionarOrden(o.id)}
                        >
                          Recepcionar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TablaResponsiva>

        {ordenDetalle && (
          <div className="mt-3 p-3 rounded-3 border bg-light">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <strong>Detalle de Orden OC-{ordenDetalle.id}</strong>
              <button
                type="button"
                className="btn secondary"
                onClick={() => setOrdenDetalle(null)}
              >
                Cerrar detalle
              </button>
            </div>
            <TablaResponsiva
              vacio={!ordenDetalle.detalles || ordenDetalle.detalles.length === 0}
              mensajeVacio="Sin líneas asociadas."
            >
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Material</th>
                    <th>Cantidad</th>
                    <th>Costo unitario neto</th>
                    <th>Subtotal neto</th>
                  </tr>
                </thead>
                <tbody>
                  {(ordenDetalle.detalles ?? []).map((d) => (
                    <tr key={d.id}>
                      <td>
                        {mapaProductos.get(d.producto_id) ?? `Producto #${d.producto_id}`}
                      </td>
                      <td>{d.cantidad}</td>
                      <td>{pesos(d.precio_unitario)}</td>
                      <td>
                        <strong>{pesos(d.subtotal)}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TablaResponsiva>
            <div className="d-flex flex-wrap justify-content-end gap-3 mt-3">
              <span>Neto: <strong>{pesos(ordenDetalle.total_neto)}</strong></span>
              <span>IVA: <strong>{pesos(ordenDetalle.iva)}</strong></span>
              <span>Total: <strong>{pesos(ordenDetalle.total)}</strong></span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
