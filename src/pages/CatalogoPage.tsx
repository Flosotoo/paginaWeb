import React from 'react';
import { useCart } from '../context/CartContext';
import { ProductList } from '../components/catalogo/ProductList';

export const CatalogoPage: React.FC = () => {
  const { productos } = useCart();

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 fw-bold text-dark mb-1">Catálogo de Materiales</h1>
          <p className="text-muted small mb-0">
            Selecciona los útiles escolares para reservar con el saldo de tu alumno.
          </p>
        </div>
      </div>

      <ProductList productos={productos} />
    </div>
  );
};
