import React, { useState } from 'react';
import { Producto } from '../../types';
import { useCart } from '../../context/CartContext';

interface ProductCardProps {
  producto: Producto;
}

export const ProductCard: React.FC<ProductCardProps> = ({ producto }) => {
  const { agregarProducto } = useCart();
  const [agregado, setAgregado] = useState(false);

  const stockDisponible = producto.stockFisico - producto.stockReservado;
  const esCritico = stockDisponible > 0 && stockDisponible <= producto.stockCritico;
  const sinStock = stockDisponible <= 0;

  const handleAgregar = () => {
    const ok = agregarProducto(producto, 1);
    if (ok) {
      setAgregado(true);
      setTimeout(() => setAgregado(false), 1500);
    }
  };

  return (
    <div className="card h-100 shadow-sm border-0 position-relative" data-testid={`product-card-${producto.id}`}>
      <div className="p-3 text-center bg-light rounded-top">
        <img
          src={producto.imagenUrl || '/assets/img/materiales-escolares.svg'}
          alt={producto.nombre}
          className="img-fluid"
          style={{ maxHeight: '140px', objectFit: 'contain' }}
        />
      </div>

      <div className="card-body d-flex flex-column">
        <div className="d-flex justify-content-between align-items-center mb-1">
          <span className="badge bg-secondary-subtle text-secondary small text-uppercase">
            {producto.categoria}
          </span>
          <small className="text-muted font-monospace">{producto.sku}</small>
        </div>

        <h5 className="card-title fs-6 fw-bold text-dark mb-1">{producto.nombre}</h5>
        <p className="card-text text-muted small flex-grow-1 mb-2">{producto.descripcion}</p>

        <div className="mb-2">
          {sinStock ? (
            <span className="badge bg-danger" data-testid="badge-sinstock">
              Agotado (0 disp.)
            </span>
          ) : esCritico ? (
            <span className="badge bg-warning text-dark" data-testid="badge-critico">
              ⚠ Últimas {stockDisponible} unid.
            </span>
          ) : (
            <span className="badge bg-success-subtle text-success" data-testid="badge-disponible">
              {stockDisponible} disponibles
            </span>
          )}
        </div>

        <div className="d-flex justify-content-between align-items-center mt-auto pt-2 border-top">
          <span className="fs-5 fw-bold text-primary">
            ${producto.precioVenta.toLocaleString('es-CL')}
          </span>

          <button
            type="button"
            className={`btn btn-sm ${agregado ? 'btn-success' : 'btn-primary'}`}
            disabled={sinStock}
            onClick={handleAgregar}
            data-testid={`add-btn-${producto.id}`}
          >
            {agregado ? '✓ Agregado' : '🛒 Agregar'}
          </button>
        </div>
      </div>
    </div>
  );
};
