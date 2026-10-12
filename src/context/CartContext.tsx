import React, { createContext, useContext, useState, useEffect } from 'react';
import { Producto, ItemCarrito, Alumno, Reserva, EstadoReserva } from '../types';
import { INITIAL_PRODUCTS, INITIAL_STUDENTS } from '../data/mockData';

interface CartContextType {
  items: ItemCarrito[];
  productos: Producto[];
  alumnos: Alumno[];
  reservas: Reserva[];
  totalItems: number;
  total: number;
  subtotalNeto: number;
  iva: number;
  agregarProducto: (p: Producto, cant?: number) => boolean;
  eliminarProducto: (productoId: number) => void;
  actualizarCantidad: (productoId: number, cant: number) => boolean;
  vaciarCarrito: () => void;
  confirmarReserva: (alumnoId: number) => { success: boolean; message: string; reserva?: Reserva };
  cancelarReserva: (reservaId: string, motivo: string) => boolean;
  avanzarEstadoReserva: (reservaId: string, nuevoEstado: EstadoReserva) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [productos, setProductos] = useState<Producto[]>(() => {
    const saved = localStorage.getItem('edusaldo_prod_v2');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [alumnos, setAlumnos] = useState<Alumno[]>(() => {
    const saved = localStorage.getItem('edusaldo_alumnos_v2');
    return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
  });

  const [items, setItems] = useState<ItemCarrito[]>(() => {
    const saved = localStorage.getItem('edusaldo_cart_v2');
    return saved ? JSON.parse(saved) : [];
  });

  const [reservas, setReservas] = useState<Reserva[]>(() => {
    const saved = localStorage.getItem('edusaldo_reservas_v2');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('edusaldo_cart_v2', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('edusaldo_prod_v2', JSON.stringify(productos));
  }, [productos]);

  useEffect(() => {
    localStorage.setItem('edusaldo_alumnos_v2', JSON.stringify(alumnos));
  }, [alumnos]);

  useEffect(() => {
    localStorage.setItem('edusaldo_reservas_v2', JSON.stringify(reservas));
  }, [reservas]);

  const totalItems = items.reduce((acc, item) => acc + item.cantidad, 0);
  const total = items.reduce((acc, item) => acc + item.subtotal, 0);
  const subtotalNeto = Math.round(total / 1.19);
  const iva = total - subtotalNeto;

  const agregarProducto = (p: Producto, cant = 1): boolean => {
    let success = false;
    setItems((prevItems) => {
      const stockDisponible = p.stockFisico - p.stockReservado;
      const existente = prevItems.find((i) => i.producto.id === p.id);
      const cantidadActualEnCarrito = existente ? existente.cantidad : 0;
      const nuevaCantidad = cantidadActualEnCarrito + cant;

      if (nuevaCantidad > stockDisponible) {
        success = false;
        return prevItems;
      }

      success = true;
      if (existente) {
        return prevItems.map((i) =>
          i.producto.id === p.id
            ? { ...i, cantidad: nuevaCantidad, subtotal: nuevaCantidad * p.precioVenta }
            : i
        );
      } else {
        return [...prevItems, { producto: p, cantidad: cant, subtotal: cant * p.precioVenta }];
      }
    });
    return success;
  };

  const eliminarProducto = (productoId: number) => {
    setItems((prevItems) => prevItems.filter((i) => i.producto.id !== productoId));
  };

  const actualizarCantidad = (productoId: number, cant: number): boolean => {
    let success = false;
    setItems((prevItems) => {
      if (cant <= 0) {
        success = true;
        return prevItems.filter((i) => i.producto.id !== productoId);
      }

      const item = prevItems.find((i) => i.producto.id === productoId);
      if (!item) {
        success = false;
        return prevItems;
      }

      const stockDisponible = item.producto.stockFisico - item.producto.stockReservado;
      if (cant > stockDisponible) {
        success = false;
        return prevItems;
      }

      success = true;
      return prevItems.map((i) =>
        i.producto.id === productoId
          ? { ...i, cantidad: cant, subtotal: cant * i.producto.precioVenta }
          : i
      );
    });
    return success;
  };

  const vaciarCarrito = () => {
    setItems([]);
  };

  const confirmarReserva = (
    alumnoId: number
  ): { success: boolean; message: string; reserva?: Reserva } => {
    const alumno = alumnos.find((a) => a.id === alumnoId);
    if (!alumno) {
      return { success: false, message: 'Alumno no encontrado.' };
    }

    if (items.length === 0) {
      return { success: false, message: 'El carrito está vacío.' };
    }

    if (alumno.saldoDisponible < total) {
      return {
        success: false,
        message: `Saldo insuficiente. Saldo disponible: $${alumno.saldoDisponible.toLocaleString('es-CL')} - Total requerido: $${total.toLocaleString('es-CL')}`,
      };
    }

    // Invariante: comprometer saldo y stock
    const nuevaReserva: Reserva = {
      id: `RES-${Date.now()}`,
      codigo: `RES-${Math.floor(1000 + Math.random() * 9000)}`,
      codigoBolsa: `BOL-${Math.floor(1000 + Math.random() * 9000)}`,
      alumnoId: alumno.id,
      nombreAlumno: alumno.nombre,
      apoderadoId: alumno.familyId || 'FAM-01',
      total,
      estado: 'PENDIENTE',
      fechaCreacion: new Date().toISOString(),
      items: items.map((i) => ({
        id: i.producto.id,
        name: i.producto.nombre,
        qty: i.cantidad,
        price: i.producto.precioVenta,
      })),
    };

    // Actualizar alumno (saldo comprometido aumenta, disponible baja)
    setAlumnos(
      alumnos.map((a) =>
        a.id === alumnoId
          ? {
              ...a,
              saldoComprometido: a.saldoComprometido + total,
              saldoDisponible: a.balance - (a.saldoComprometido + total),
            }
          : a
      )
    );

    // Actualizar stock reservado de los productos
    setProductos(
      productos.map((p) => {
        const itemEnCarrito = items.find((i) => i.producto.id === p.id);
        if (itemEnCarrito) {
          return {
            ...p,
            stockReservado: p.stockReservado + itemEnCarrito.cantidad,
          };
        }
        return p;
      })
    );

    setReservas([nuevaReserva, ...reservas]);
    vaciarCarrito();

    return {
      success: true,
      message: `Reserva ${nuevaReserva.codigo} confirmada exitosamente.`,
      reserva: nuevaReserva,
    };
  };

  const cancelarReserva = (reservaId: string, _motivo: string): boolean => {
    const res = reservas.find((r) => r.id === reservaId);
    if (!res || res.estado === 'ENTREGADA' || res.estado === 'CANCELADA') {
      return false;
    }

    // Liberar saldo del alumno
    setAlumnos(
      alumnos.map((a) =>
        a.id === res.alumnoId
          ? {
              ...a,
              saldoComprometido: Math.max(0, a.saldoComprometido - res.total),
              saldoDisponible: a.balance - Math.max(0, a.saldoComprometido - res.total),
            }
          : a
      )
    );

    // Liberar stock reservado
    setProductos(
      productos.map((p) => {
        const itemRes = res.items.find((i) => i.id === p.id);
        if (itemRes) {
          return {
            ...p,
            stockReservado: Math.max(0, p.stockReservado - itemRes.qty),
          };
        }
        return p;
      })
    );

    setReservas(
      reservas.map((r) => (r.id === reservaId ? { ...r, estado: 'CANCELADA' } : r))
    );
    return true;
  };

  const avanzarEstadoReserva = (reservaId: string, nuevoEstado: EstadoReserva): boolean => {
    setReservas(
      reservas.map((r) => (r.id === reservaId ? { ...r, estado: nuevoEstado } : r))
    );
    return true;
  };

  return (
    <CartContext.Provider
      value={{
        items,
        productos,
        alumnos,
        reservas,
        totalItems,
        total,
        subtotalNeto,
        iva,
        agregarProducto,
        eliminarProducto,
        actualizarCantidad,
        vaciarCarrito,
        confirmarReserva,
        cancelarReserva,
        avanzarEstadoReserva,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe ser usado dentro de un CartProvider');
  }
  return context;
};
