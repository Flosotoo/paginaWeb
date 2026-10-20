import React, { useState } from 'react';
import { Producto } from '../../types';
import { useCart } from '../../context/CartContext';

interface ProductCardProps {
  producto: Producto;
}

export const ProductCard: React.FC<ProductCardProps> = ({ producto }) => {
  const { agregarProducto } = useCart();
  const [cantidad, setCantidad] = useState<number>(1);
  const [agregado, setAgregado] = useState(false);

  const stockDisponible = producto.stockFisico - producto.stockReservado;
  const esCritico = stockDisponible > 0 && stockDisponible <= producto.stockCritico;
  const sinStock = stockDisponible <= 0;

  const handleAgregar = () => {
    if (sinStock || cantidad <= 0) return;
    const ok = agregarProducto(producto, cantidad);
    if (ok) {
      setAgregado(true);
      setTimeout(() => setAgregado(false), 1500);
    }
  };

  return (
    <article className="product-card" data-testid={`product-card-${producto.id}`}>
      <div>
        <small>{producto.categoria} · {producto.sku}</small>
        <h3>{producto.nombre}</h3>
        <strong>${producto.precioVenta.toLocaleString('es-CL')}</strong>
        <p className="product-stock">
          {sinStock ? (
            <span style={{ color: '#b91c1c', fontWeight: 700 }} data-testid="badge-sinstock">
              Agotado (0 disp.)
            </span>
          ) : esCritico ? (
            <span style={{ color: '#b45309', fontWeight: 700 }} data-testid="badge-critico">
              ⚠ Últimas {stockDisponible} unid. en stock
            </span>
          ) : (
            <span data-testid="badge-disponible">
              {stockDisponible} disponibles · Barra: {producto.codigoBarras}
            </span>
          )}
        </p>
      </div>

      <div className="product-controls">
        <label htmlFor={`cant-${producto.id}`}>Cantidad</label>
        <input
          id={`cant-${producto.id}`}
          type="number"
          min="1"
          max={Math.max(1, stockDisponible)}
          value={cantidad}
          disabled={sinStock}
          onChange={(e) => setCantidad(Math.max(1, Number(e.target.value) || 1))}
          data-testid={`cant-input-${producto.id}`}
        />
        <button
          type="button"
          disabled={sinStock}
          onClick={handleAgregar}
          data-testid={`add-btn-${producto.id}`}
        >
          {agregado ? '✓ Agregado' : 'Agregar'}
        </button>
      </div>
    </article>
  );
};
