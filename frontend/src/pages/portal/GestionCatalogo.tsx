import { EditarCatalogo } from "./EditarCatalogo";
import { useState } from "react";
import { useGestionCatalogo } from "../../hooks/useGestionCatalogo";
import type { Producto } from "../../services/catalogo";
export function GestionCatalogo({
  productos,
  actualizar,
}: {
  productos: Producto[];
  actualizar: () => Promise<void>;
}) {
  const {
    usuario,
    procesando,
    aviso,
    categorias,
    categoria,
    producto,
    editarProducto,
    inactivarProducto,
    editarCategoria,
    inactivarCategoria,
    ingreso,
    conteo,
    diferencia,
  } = useGestionCatalogo(actualizar);
  const [nombreCategoria, setNombreCategoria] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [sku, setSku] = useState("");
  const [nombre, setNombre] = useState("");
  const [curso, setCurso] = useState("Todos");
  const [precio, setPrecio] = useState("");
  const [stock, setStock] = useState("0");
  const [critico, setCritico] = useState("1");
  const [productoId, setProductoId] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [observacion, setObservacion] = useState("");
  const [productoContado, setProductoContado] = useState("");
  const [cantidadContada, setCantidadContada] = useState("0");
  return (
    <section className="account-section">
      <div className="section-heading" style={{ marginBottom: "20px" }}>
        <div>
          <span className="eyebrow">CATÁLOGO Y EXISTENCIAS</span>
          <h2 id="gestion-catalogo">Gestión de catálogo y stock</h2>
        </div>
      </div>

      {aviso && <p role="status" className="form-feedback" style={{ marginBottom: "16px" }}>{aviso}</p>}
      {categorias.error && <p role="alert">{categorias.error}</p>}

      {usuario?.rol === "ADMINISTRADOR" && (
        <>
          <div className="card">
            <span className="eyebrow">CATEGORÍAS</span>
            <h3>Nueva categoría</h3>
            <p className="card-desc">Crea grupos de productos escolares para facilitar su búsqueda y organización.</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void categoria(nombreCategoria.trim());
              }}
              style={{ maxWidth: "480px" }}
            >
              <label>
                Nombre de categoría
                <input
                  className="input"
                  value={nombreCategoria}
                  onChange={(e) => setNombreCategoria(e.target.value)}
                  required
                />
              </label>
              <div className="form-actions">
                <button className="btn" disabled={procesando}>
                  Crear categoría
                </button>
              </div>
            </form>
          </div>

          <div className="card">
            <span className="eyebrow">CATÁLOGO ESCOLAR</span>
            <h3>Nuevo producto</h3>
            <p className="card-desc">Registra un nuevo material escolar en el catálogo oficial del establecimiento.</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void producto({
                  categoriaId: Number(categoriaId),
                  sku: sku.trim(),
                  nombre: nombre.trim(),
                  cursoNivel: curso.trim(),
                  precio: Number(precio),
                  stockInicial: Number(stock),
                  stockCritico: Number(critico),
                });
              }}
            >
              <div className="form-grid-2">
                <label>
                  Categoría
                  <select
                    className="input"
                    value={categoriaId}
                    onChange={(e) => setCategoriaId(e.target.value)}
                    required
                  >
                    <option value="">Selecciona</option>
                    {categorias.datos?.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  SKU
                  <input
                    className="input"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    required
                  />
                </label>
              </div>

              <div className="form-grid-2">
                <label>
                  Nombre del producto
                  <input
                    className="input"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                  />
                </label>
                <label>
                  Curso o nivel
                  <input
                    className="input"
                    value={curso}
                    onChange={(e) => setCurso(e.target.value)}
                    required
                  />
                </label>
              </div>

              <div className="form-grid-3">
                <label>
                  Precio CLP
                  <input
                    className="input"
                    type="number"
                    min="1"
                    step="1"
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                    required
                  />
                </label>
                <label>
                  Stock inicial
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="1"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    required
                  />
                </label>
                <label>
                  Stock crítico
                  <input
                    className="input"
                    type="number"
                    min="1"
                    step="1"
                    value={critico}
                    onChange={(e) => setCritico(e.target.value)}
                    required
                  />
                </label>
              </div>

              <div className="form-actions">
                <button className="btn" disabled={procesando}>
                  Crear producto
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {usuario?.rol === "ADMINISTRADOR" && (
        <EditarCatalogo
          categorias={categorias.datos ?? []}
          productos={productos}
          procesando={procesando}
          editarProducto={editarProducto}
          inactivarProducto={inactivarProducto}
          editarCategoria={editarCategoria}
          inactivarCategoria={inactivarCategoria}
        />
      )}

      <div className="card">
        <span className="eyebrow">MOVIMIENTOS DE BODEGA</span>
        <h3>Ingreso de stock</h3>
        <p className="card-desc">Registra la recepción física de unidades para incrementar las existencias.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void ingreso(Number(productoId), Number(cantidad), observacion);
          }}
        >
          <div className="form-grid-2">
            <label>
              Producto a ingresar
              <select
                className="input"
                value={productoId}
                onChange={(e) => setProductoId(e.target.value)}
                required
              >
                <option value="">Selecciona</option>
                {productos
                  .filter((p) => p.estado === "ACTIVO")
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Unidades recibidas
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
          <label>
            Observación
            <input
              className="input"
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
            />
          </label>
          <div className="form-actions">
            <button className="btn" disabled={procesando}>
              Registrar ingreso
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <span className="eyebrow">AUDITORÍA FÍSICA</span>
        <h3>Conteo físico</h3>
        <p className="card-desc">El conteo registra diferencias con respecto al inventario teórico sin modificar automáticamente las existencias.</p>
        {diferencia !== null && (
          <p className="pill-state neutral" style={{ marginBottom: "14px", display: "inline-block" }}>
            Última diferencia registrada: {diferencia}
          </p>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void conteo(Number(productoContado), Number(cantidadContada));
          }}
        >
          <div className="form-grid-2">
            <label>
              Producto contado
              <select
                className="input"
                value={productoContado}
                onChange={(e) => setProductoContado(e.target.value)}
                required
              >
                <option value="">Selecciona</option>
                {productos
                  .filter((p) => p.estado === "ACTIVO")
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Unidades contadas
              <input
                className="input"
                type="number"
                min="0"
                step="1"
                value={cantidadContada}
                onChange={(e) => setCantidadContada(e.target.value)}
                required
              />
            </label>
          </div>
          <div className="form-actions">
            <button className="btn" disabled={procesando}>
              Registrar conteo
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
