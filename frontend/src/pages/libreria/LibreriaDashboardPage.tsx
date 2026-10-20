import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { useCart } from '../../context/CartContext';

export const LibreriaDashboardPage: React.FC = () => {
  const { reservas, productos } = useCart();

  const porPreparar = reservas.filter((r) =>
    ['PENDIENTE', 'EN_PREPARACION', 'ETIQUETA_PENDIENTE'].includes(r.estado)
  ).length;

  const pendientesEntrega = reservas.filter((r) => r.estado === 'LISTA_PARA_RETIRO').length;

  const stockCritico = productos.filter((p) => {
    const disp = p.stockFisico - p.stockReservado;
    return disp <= 5;
  }).length;

  const entregadas = reservas.filter((r) => r.estado === 'ENTREGADA').length;

  return (
    <>
      <Navbar />
      <main className="dashboard staff-dashboard">
        <section className="staff-hero">
          <span className="eyebrow">ÁREA DEL ENCARGADO</span>
          <h1>Materiales listos para cada día.</h1>
          <p>
            Prepara reservas, registra entregas y consulta existencias desde un solo lugar.
          </p>
        </section>

        {/* Las 4 estadísticas operativas (Image 2) */}
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
            <span>Productos con disponibilidad crítica (≤ 5)</span>
          </div>
          <div className="staff-stat">
            <strong>{entregadas}</strong>
            <span>Reservas entregadas</span>
          </div>
        </section>

        {/* Las 4 tarjetas de acceso rápido (Image 2) */}
        <section className="staff-grid">
          <Link className="staff-tile" to="/libreria/reservas">
            <span className="staff-symbol">▤</span>
            <h2>Reservas</h2>
            <p>Consulta reservas por preparar, pendientes de entrega y entregadas.</p>
            <b>Abrir reservas →</b>
          </Link>

          <Link className="staff-tile peach" to="/libreria/entrega-directa">
            <span className="staff-symbol">⌁</span>
            <h2>Entrega directa</h2>
            <p>Para alumnos de 12 años o más. Sin cobro en la librería.</p>
            <b>Registrar entrega →</b>
          </Link>

          <Link className="staff-tile sage" to="/libreria/inventario">
            <span className="staff-symbol">▦</span>
            <h2>Inventario</h2>
            <p>Consulta existencias y materiales con stock crítico.</p>
            <b>Ver inventario →</b>
          </Link>

          <Link className="staff-tile cream" to="/libreria/devoluciones">
            <span className="staff-symbol">↶</span>
            <h2>Devoluciones</h2>
            <p>Reintegra saldo y unidades únicamente cuando corresponda.</p>
            <b>Consultar entregas →</b>
          </Link>
        </section>

        <p className="staff-note">
          Demostración académica: datos almacenados solo en este navegador. No se realizan ventas ni pagos en la librería.
        </p>
      </main>
    </>
  );
};
