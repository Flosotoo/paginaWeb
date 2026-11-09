import { useState } from "react";
import type { Categoria, Producto } from "../../services/catalogo";
interface Propiedades {
  categorias: Categoria[];
  productos: Producto[];
  procesando: boolean;
  editarProducto: (id: number, nombre: string, precio: number) => Promise<void>;
  inactivarProducto: (id: number) => Promise<void>;
  editarCategoria: (
    id: number,
    nombre: string,
    descripcion: string,
  ) => Promise<void>;
  inactivarCategoria: (id: number) => Promise<void>;
}
export function EditarCatalogo(p: Propiedades) {
  const [idProducto, setIdProducto] = useState("");
  const [nombreProducto, setNombreProducto] = useState("");
  const [precio, setPrecio] = useState("");
  const [idCategoria, setIdCategoria] = useState("");
  const [nombreCategoria, setNombreCategoria] = useState("");
  const [descripcion, setDescripcion] = useState("");
  return (
    <>
      <div className="card">
        <span className="eyebrow">MODIFICACIÓN DE PRODUCTO</span>
        <h3>Editar producto</h3>
        <p className="card-desc">Actualiza el precio o el nombre de un material escolar, o desactívalo del catálogo.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void p.editarProducto(
              Number(idProducto),
              nombreProducto.trim(),
              Number(precio),
            );
          }}
        >
          <label>
            Producto a editar
            <select
              className="input"
              value={idProducto}
              onChange={(e) => {
                const item = p.productos.find(
                  (x) => x.id === Number(e.target.value),
                );
                setIdProducto(e.target.value);
                setNombreProducto(item?.nombre ?? "");
                setPrecio(String(item?.precio ?? ""));
              }}
              required
            >
              <option value="">Selecciona</option>
              {p.productos
                .filter((x) => x.estado === "ACTIVO")
                .map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.nombre}
                  </option>
                ))}
            </select>
          </label>
          <div className="form-grid-2">
            <label>
              Nombre actualizado
              <input
                className="input"
                value={nombreProducto}
                onChange={(e) => setNombreProducto(e.target.value)}
                required
              />
            </label>
            <label>
              Precio actualizado
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
          </div>
          <div className="form-actions">
            <button className="btn" disabled={p.procesando}>
              Guardar producto
            </button>
            <button
              className="btn secondary"
              type="button"
              disabled={p.procesando || !idProducto}
              onClick={() => void p.inactivarProducto(Number(idProducto))}
            >
              Inactivar producto
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <span className="eyebrow">MODIFICACIÓN DE CATEGORÍA</span>
        <h3>Editar categoría</h3>
        <p className="card-desc">Actualiza la denominación de una categoría o desactívala.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void p.editarCategoria(
              Number(idCategoria),
              nombreCategoria.trim(),
              descripcion,
            );
          }}
        >
          <label>
            Categoría a editar
            <select
              className="input"
              value={idCategoria}
              onChange={(e) => {
                const item = p.categorias.find(
                  (x) => x.id === Number(e.target.value),
                );
                setIdCategoria(e.target.value);
                setNombreCategoria(item?.nombre ?? "");
                setDescripcion(item?.descripcion ?? "");
              }}
              required
            >
              <option value="">Selecciona</option>
              {p.categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </label>
          <div className="form-grid-2">
            <label>
              Nombre de categoría actualizado
              <input
                className="input"
                value={nombreCategoria}
                onChange={(e) => setNombreCategoria(e.target.value)}
                required
              />
            </label>
            <label>
              Descripción de categoría
              <input
                className="input"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
            </label>
          </div>
          <div className="form-actions">
            <button className="btn" disabled={p.procesando}>
              Guardar categoría
            </button>
            <button
              className="btn secondary"
              type="button"
              disabled={p.procesando || !idCategoria}
              onClick={() => void p.inactivarCategoria(Number(idCategoria))}
            >
              Inactivar categoría
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
