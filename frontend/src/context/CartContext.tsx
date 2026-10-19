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
  escanearArticuloReserva: (reservaId: string, barcode: string) => { success: boolean; message: string; complete?: boolean };
  generarEtiquetaReserva: (reservaId: string) => string;
  marcarListaRetiro: (reservaId: string) => void;
  entregarReservaConValidacion: (reservaId: string, bagCode: string, studentCode: string) => { success: boolean; message: string };
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

  const escanearArticuloReserva = (
    reservaId: string,
    barcode: string
  ): { success: boolean; message: string; complete?: boolean } => {
    let result = { success: false, message: 'Reserva no encontrada', complete: false };

    setReservas((prev) =>
      prev.map((r) => {
        if (r.id !== reservaId) return r;

        const prod = productos.find((p) => p.codigoBarras === barcode.trim());
        if (!prod) {
          result = { success: false, message: 'Código de barra no encontrado en el catálogo escolar.', complete: false };
          return r;
        }

        const itemReserva = r.items.find((i) => i.id === prod.id);
        if (!itemReserva) {
          result = { success: false, message: `El artículo "${prod.nombre}" no pertenece a esta reserva.`, complete: false };
          return r;
        }

        const currentScanned = r.scanned || {};
        const count = currentScanned[prod.id] || 0;

        if (count >= itemReserva.qty) {
          result = { success: false, message: `La cantidad de "${prod.nombre}" ya está completa en la bolsa (${count}/${itemReserva.qty}).`, complete: false };
          return r;
        }

        const updatedScanned = { ...currentScanned, [prod.id]: count + 1 };
        const isComplete = r.items.every((it) => (updatedScanned[it.id] || 0) >= it.qty);

        result = {
          success: true,
          message: `✓ Pistoleado: ${prod.nombre} (${count + 1}/${itemReserva.qty})`,
          complete: isComplete,
        };

        return {
          ...r,
          scanned: updatedScanned,
          estado: 'EN_PREPARACION',
        };
      })
    );

    return result;
  };

  const generarEtiquetaReserva = (reservaId: string): string => {
    let bagCode = '';
    setReservas((prev) =>
      prev.map((r) => {
        if (r.id !== reservaId) return r;
        bagCode = r.codigoBolsa || `BOL-${r.codigo.replace('RES-', '')}`;
        return {
          ...r,
          codigoBolsa: bagCode,
          estado: 'ETIQUETA_PENDIENTE',
        };
      })
    );
    return bagCode;
  };

  const marcarListaRetiro = (reservaId: string) => {
    setReservas((prev) =>
      prev.map((r) => (r.id === reservaId ? { ...r, estado: 'LISTA_PARA_RETIRO' } : r))
    );
  };

  const entregarReservaConValidacion = (
    reservaId: string,
    bagCode: string,
    studentCode: string
  ): { success: boolean; message: string } => {
    const r = reservas.find((res) => res.id === reservaId);
    if (!r) return { success: false, message: 'Reserva no encontrada.' };

    const expectedBag = (r.codigoBolsa || '').trim().toUpperCase();
    if (bagCode.trim().toUpperCase() !== expectedBag) {
      return {
        success: false,
        message: `El código de bolsa pistoleado (${bagCode}) no coincide con la reserva (${expectedBag}).`,
      };
    }

    const alumno = alumnos.find((a) => a.id === r.alumnoId);
    const cleanStudentCode = studentCode.trim().toUpperCase();
    const expectedRut = alumno ? alumno.rut.toUpperCase().replace(/\./g, '') : '';
    const givenRut = cleanStudentCode.replace(/\./g, '');

    if (cleanStudentCode !== `ALU-${r.alumnoId}` && givenRut !== expectedRut) {
      return {
        success: false,
        message: `La credencial pistoleada (${studentCode}) no coincide con el alumno ${r.nombreAlumno}.`,
      };
    }

    setAlumnos((prev) =>
      prev.map((a) =>
        a.id === r.alumnoId
          ? {
              ...a,
              saldoComprometido: Math.max(0, a.saldoComprometido - r.total),
              balance: Math.max(0, a.balance - r.total),
              saldoDisponible: Math.max(0, a.balance - r.total) - Math.max(0, a.saldoComprometido - r.total),
            }
          : a
      )
    );

    setProductos((prev) =>
      prev.map((p) => {
        const itemRes = r.items.find((it) => it.id === p.id);
        if (itemRes) {
          return {
            ...p,
            stockReservado: Math.max(0, p.stockReservado - itemRes.qty),
            stockFisico: Math.max(0, p.stockFisico - itemRes.qty),
          };
        }
        return p;
      })
    );

    setReservas((prev) =>
      prev.map((res) => (res.id === reservaId ? { ...res, estado: 'ENTREGADA' } : res))
    );

    return {
      success: true,
      message: `✓ Entrega completada con éxito. Venta generada y bolsa ${expectedBag} retirada.`,
    };
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
        escanearArticuloReserva,
        generarEtiquetaReserva,
        marcarListaRetiro,
        entregarReservaConValidacion,
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
