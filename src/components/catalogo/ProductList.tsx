import React, { useState, useMemo } from 'react';
import { Producto } from '../../types';
import { ProductCard } from './ProductCard';

interface ProductListProps {
  productos: Producto[];
}

export const ProductList: React.FC<ProductListProps> = ({ productos }) => {
  const [categoriaSel, setCategoriaSel] = useState<string>('TODAS');
  const [busqueda, setBusqueda] = useState<string>('');
  const [orden, setOrden] = useState<'precio-asc' | 'precio-desc' | 'nombre'>('nombre');

  const categorias = useMemo(() => {
    const list = Array.from(new Set(productos.map((p) => p.categoria)));
    return ['TODAS', ...list];
  }, [productos]);

  const productosFiltrados = useMemo(() => {
    return productos
      .filter((p) => {
        const coincideCat = categoriaSel === 'TODAS' || p.categoria === categoriaSel;
        const q = busqueda.trim().toLowerCase();
        const coincideBusqueda =
          q === '' ||
          p.nombre.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.codigoBarras.includes(q);
        return coincideCat && coincideBusqueda;
      })
      .sort((a, b) => {
        if (orden === 'precio-asc') return a.precioVenta - b.precioVenta;
        if (orden === 'precio-desc') return b.precioVenta - a.precioVenta;
        return a.nombre.localeCompare(b.nombre);
      });
  }, [productos, categoriaSel, busqueda, orden]);

  return (
    <div>
      {/* Filtros y búsqueda */}
      <div className="card shadow-sm border-0 mb-4 p-3 bg-white">
        <div className="row g-3 align-items-center">
          <div className="col-md-5">
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">🔍</span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Buscar por nombre, SKU o código de barra..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                data-testid="search-input"
              />
              {busqueda && (
                <button className="btn btn-outline-secondary" onClick={() => setBusqueda('')}>
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="col-md-4">
            <select
              className="form-select"
              value={categoriaSel}
              onChange={(e) => setCategoriaSel(e.target.value)}
              data-testid="category-select"
            >
              {categorias.map((c) => (
                <option key={c} value={c}>
                  {c === 'TODAS' ? 'Todas las categorías' : c}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-3">
            <select
              className="form-select"
              value={orden}
              onChange={(e) => setOrden(e.target.value as any)}
              data-testid="order-select"
            >
              <option value="nombre">Ordenar por nombre</option>
              <option value="precio-asc">Menor precio primero</option>
              <option value="precio-desc">Mayor precio primero</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid de productos */}
      {productosFiltrados.length === 0 ? (
        <div className="text-center py-5 bg-white rounded shadow-sm">
          <p className="text-muted fs-5 mb-0">No se encontraron productos coincidentes.</p>
        </div>
      ) : (
        <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4" data-testid="products-grid">
          {productosFiltrados.map((p) => (
            <div key={p.id} className="col">
              <ProductCard producto={p} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
