import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, renderHook, act } from '@testing-library/react';
import { CartProvider, useCart } from '../context/CartContext';
import { ProductCard } from '../components/catalogo/ProductCard';
import { ProductList } from '../components/catalogo/ProductList';
import { INITIAL_PRODUCTS, INITIAL_STUDENTS } from '../data/mockData';
import { Producto } from '../types';

describe('EduSaldo Frontend - Suite de Pruebas Reales de Negocio (Sprints 9 y 10)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // TEST 1: Carrito suma items y calcula subtotal exacto
  it('1. Agregar producto al carrito incrementa totalItems y calcula el subtotal exacto', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CartProvider>{children}</CartProvider>
    );
    const { result } = renderHook(() => useCart(), { wrapper });

    const p = INITIAL_PRODUCTS[0]; // Cuaderno universitario $1.250
    act(() => {
      const ok = result.current.agregarProducto(p, 2);
      expect(ok).toBe(true);
    });

    expect(result.current.totalItems).toBe(2);
    expect(result.current.total).toBe(2500);
    expect(result.current.items[0].subtotal).toBe(2500);
  });

  // TEST 2: Modificar cantidad respeta límite de stock disponible
  it('2. Actualizar cantidad rechaza valores que superen el stock disponible', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CartProvider>{children}</CartProvider>
    );
    const { result } = renderHook(() => useCart(), { wrapper });

    const p = INITIAL_PRODUCTS[0]; // stockFisico 25, reservado 0 -> disponible 25
    act(() => {
      result.current.agregarProducto(p, 5);
    });

    // Intentar subir a 30 (mayor al stock de 25)
    act(() => {
      const ok = result.current.actualizarCantidad(p.id, 30);
      expect(ok).toBe(false);
    });

    // La cantidad debe mantenerse en 5
    expect(result.current.items[0].cantidad).toBe(5);
  });

  // TEST 3: Eliminar producto remueve del carrito y recalcula total
  it('3. Eliminar producto remueve el ítem y recalcula el monto total', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CartProvider>{children}</CartProvider>
    );
    const { result } = renderHook(() => useCart(), { wrapper });

    const p1 = INITIAL_PRODUCTS[0]; // $1.250
    const p2 = INITIAL_PRODUCTS[1]; // $900

    act(() => {
      result.current.agregarProducto(p1, 1);
      result.current.agregarProducto(p2, 2);
    });

    expect(result.current.total).toBe(1250 + 1800);

    act(() => {
      result.current.eliminarProducto(p1.id);
    });

    expect(result.current.items.length).toBe(1);
    expect(result.current.items[0].producto.id).toBe(p2.id);
    expect(result.current.total).toBe(1800);
  });

  // TEST 4: Vaciar carrito limpia el estado y persistencia
  it('4. Vaciar carrito deja el estado en cero y limpia los ítems', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CartProvider>{children}</CartProvider>
    );
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.agregarProducto(INITIAL_PRODUCTS[0], 3);
      result.current.vaciarCarrito();
    });

    expect(result.current.items.length).toBe(0);
    expect(result.current.totalItems).toBe(0);
    expect(result.current.total).toBe(0);
  });

  // TEST 5: ProductCard deshabilita botón y muestra badge cuando stock es 0
  it('5. ProductCard renderiza badge Agotado y deshabilita el botón al tener 0 stock disponible', () => {
    const productoAgotado: Producto = {
      ...INITIAL_PRODUCTS[0],
      stockFisico: 5,
      stockReservado: 5, // disponible = 0
    };

    render(
      <CartProvider>
        <ProductCard producto={productoAgotado} />
      </CartProvider>
    );

    expect(screen.getByTestId('badge-sinstock')).toBeInTheDocument();
    const btn = screen.getByTestId(`add-btn-${productoAgotado.id}`);
    expect(btn).toBeDisabled();
  });

  // TEST 6: ProductCard muestra alerta de stock crítico
  it('6. ProductCard muestra alerta visual cuando el stock es menor o igual al umbral crítico', () => {
    const productoCritico: Producto = {
      ...INITIAL_PRODUCTS[0],
      stockFisico: 4,
      stockReservado: 1, // disponible = 3
      stockCritico: 5,   // 3 <= 5 -> crítico
    };

    render(
      <CartProvider>
        <ProductCard producto={productoCritico} />
      </CartProvider>
    );

    const badge = screen.getByTestId('badge-critico');
    expect(badge).toBeInTheDocument();
    expect(badge.textContent).toContain('Últimas 3 unid.');
  });

  // TEST 7: ProductList filtra reactivamente por búsqueda de texto
  it('7. ProductList filtra reactivamente por nombre o código de barra', () => {
    render(
      <CartProvider>
        <ProductList productos={INITIAL_PRODUCTS} />
      </CartProvider>
    );

    const input = screen.getByTestId('search-input');
    fireEvent.change(input, { target: { value: 'Goma' } });

    // Debe quedar solo la goma de borrar
    expect(screen.getByText('Goma de borrar')).toBeInTheDocument();
    expect(screen.queryByText('Cuaderno universitario')).not.toBeInTheDocument();
  });

  // TEST 8: Checkout exitoso compromete saldo y stock
  it('8. Confirmar reserva compromete saldo del alumno y stock reservado sin duplicidad', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CartProvider>{children}</CartProvider>
    );
    const { result } = renderHook(() => useCart(), { wrapper });

    const alumno = INITIAL_STUDENTS[0]; // Sofía Pérez, saldo 18.000
    const prod = INITIAL_PRODUCTS[0];  // $1.250

    act(() => {
      result.current.agregarProducto(prod, 2); // $2.500
    });

    let res: any;
    act(() => {
      res = result.current.confirmarReserva(alumno.id);
    });

    expect(res.success).toBe(true);
    expect(result.current.reservas.length).toBe(1);
    expect(result.current.reservas[0].total).toBe(2500);

    // Saldo del alumno: comprometido debe ser 2.500 y disponible 15.500
    const alumnoActualizado = result.current.alumnos.find((a) => a.id === alumno.id);
    expect(alumnoActualizado?.saldoComprometido).toBe(2500);
    expect(alumnoActualizado?.saldoDisponible).toBe(15500);

    // Stock reservado del producto sube en 2
    const prodActualizado = result.current.productos.find((p) => p.id === prod.id);
    expect(prodActualizado?.stockReservado).toBe(2);
  });

  // TEST 9: Checkout falla si el saldo del alumno es insuficiente
  it('9. Confirmar reserva rechaza la operación si el alumno no cuenta con saldo disponible suficiente', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CartProvider>{children}</CartProvider>
    );
    const { result } = renderHook(() => useCart(), { wrapper });

    const alumno = INITIAL_STUDENTS[1]; // Tomás Pérez, saldo 12.500
    const prod = INITIAL_PRODUCTS[0];  // $1.250

    act(() => {
      result.current.agregarProducto(prod, 15); // $18.750 > $12.500
    });

    let res: any;
    act(() => {
      res = result.current.confirmarReserva(alumno.id);
    });

    expect(res.success).toBe(false);
    expect(res.message).toContain('Saldo insuficiente');
    expect(result.current.reservas.length).toBe(0); // No se crea la reserva
  });

  // TEST 10: Cancelar reserva libera saldo y stock
  it('10. Cancelar reserva libera saldo comprometido y stock reservado restaurando disponibles', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CartProvider>{children}</CartProvider>
    );
    const { result } = renderHook(() => useCart(), { wrapper });

    const alumno = INITIAL_STUDENTS[0];
    const prod = INITIAL_PRODUCTS[0];

    act(() => {
      result.current.agregarProducto(prod, 2); // $2.500
    });

    let res: any;
    act(() => {
      res = result.current.confirmarReserva(alumno.id);
    });

    const reservaId = res.reserva.id;

    act(() => {
      const ok = result.current.cancelarReserva(reservaId, 'Prueba de cancelación');
      expect(ok).toBe(true);
    });

    // El estado de la reserva debe ser CANCELADA
    const reservaCancelada = result.current.reservas.find((r) => r.id === reservaId);
    expect(reservaCancelada?.estado).toBe('CANCELADA');

    // Saldo restaurado: comprometido en 0 y disponible vuelve a 18.000
    const alumnoRestaurado = result.current.alumnos.find((a) => a.id === alumno.id);
    expect(alumnoRestaurado?.saldoComprometido).toBe(0);
    expect(alumnoRestaurado?.saldoDisponible).toBe(18000);

    // Stock reservado vuelve a 0
    const prodRestaurado = result.current.productos.find((p) => p.id === prod.id);
    expect(prodRestaurado?.stockReservado).toBe(0);
  });
});
