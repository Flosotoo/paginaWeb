import React, { useState, useMemo } from 'react';
import { Producto } from '../../types';
import { ProductCard } from './ProductCard';

interface ProductListProps {
  productos: Producto[];
}

export const ProductList: React.FC<ProductListProps> = ({ productos }) => {
  const [categoriaSel, setCategoriaSel] = useState<string>('TODAS');
  const [busqueda, setBusqueda] = useState<string>('');

  const categorias = useMemo(() => {
    const list = Array.from(new Set(productos.map((p) => p.categoria)));
    return ['TODAS', ...list];
  }, [productos]);

  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => {
      const coincideCat = categoriaSel === 'TODAS' || p.categoria === categoriaSel;
      const q = busqueda.trim().toLowerCase();
      const coincideBusqueda =
        q === '' ||
        p.nombre.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.codigoBarras.includes(q);
      return coincideCat && coincideBusqueda;
    });
  }, [productos, categoriaSel, busqueda]);

  return (
    <div className="reserva-explorar">
      <label className="reserva-search-label" htmlFor="reserva-buscar">
        Buscar materiales
      </label>
      <div className="reserva-search-wrap">
        <span aria-hidden="true">⌕</span>
        <input
          id="reserva-buscar"
          type="search"
          autoComplete="off"
          placeholder="Escribe el nombre del material o código..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          data-testid="search-input"
        />
      </div>

      <p className="reserva-category-title">Categorías</p>
      <div className="category-list" aria-label="Categorías de materiales" data-testid="category-select">
        {categorias.map((c) => (
          <button
            key={c}
            type="button"
            className={`category-chip ${categoriaSel === c ? 'active' : ''}`}
            onClick={() => setCategoriaSel(c)}
          >
            {c === 'TODAS' ? 'Todas las categorías' : c}
          </button>
        ))}
      </div>

      <div className="product-list" data-testid="products-grid">
        {productosFiltrados.length === 0 ? (
          <p className="muted" style={{ padding: '20px 0' }}>
            No se encontraron materiales con ese criterio de búsqueda.
          </p>
        ) : (
          productosFiltrados.map((p) => <ProductCard key={p.id} producto={p} />)
        )}
      </div>
    </div>
  );
};
