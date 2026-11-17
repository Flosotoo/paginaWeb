import React, { createContext, useContext, useState, useEffect } from 'react';
import { Producto, ItemCarrito, Alumno, Reserva, EstadoReserva } from '../types';
import { INITIAL_PRODUCTS, INITIAL_STUDENTS } from '../data/mockData';

export interface LineaEntrega {
  productoId: number;
  cant: number;
}

type OpResult = { success: boolean; message: string };

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
  // Operaciones que antes eran cosméticas y ahora mutan y persisten el estado:
  aportarSaldo: (alumnoId: number, monto: number) => OpResult;
  entregaDirecta: (alumnoId: number, lineas: LineaEntrega[]) => OpResult & { total?: number };
  registrarDevolucion: (alumnoId: number, productoId: number, monto: number, motivo: string, cant?: number) => OpResult;
  recepcionStock: (productoId: number, cantidad: number, netoUnit: number) => OpResult;
  crearAlumno: (alumno: Alumno) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// disponible = saldo total en cuenta (balance) - comprometido en reservas
const calcDisponible = (balance: number, comprometido: number) => Math.max(0, balance - Math.max(0, comprometido));

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

    const itemsReserva = items.map((i) => ({
      id: i.producto.id,
      name: i.producto.nombre,
      qty: i.cantidad,
      price: i.producto.precioVenta,
    }));

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
      items: itemsReserva,
    };

    // Comprometer saldo del alumno (updater funcional)
    setAlumnos((prev) =>
      prev.map((a) => {
        if (a.id !== alumnoId) return a;
        const comprometido = a.saldoComprometido + total;
        return { ...a, saldoComprometido: comprometido, saldoDisponible: calcDisponible(a.balance, comprometido) };
      })
    );

    // Comprometer stock reservado
    setProductos((prev) =>
      prev.map((p) => {
        const itemEnCarrito = itemsReserva.find((i) => i.id === p.id);
        return itemEnCarrito ? { ...p, stockReservado: p.stockReservado + itemEnCarrito.qty } : p;
      })
    );

    setReservas((prev) => [nuevaReserva, ...prev]);
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

    // Liberar saldo comprometido
    setAlumnos((prev) =>
      prev.map((a) => {
        if (a.id !== res.alumnoId) return a;
        const comprometido = Math.max(0, a.saldoComprometido - res.total);
        return { ...a, saldoComprometido: comprometido, saldoDisponible: calcDisponible(a.balance, comprometido) };
      })
    );

    // Liberar stock reservado
    setProductos((prev) =>
      prev.map((p) => {
        const itemRes = res.items.find((i) => i.id === p.id);
        return itemRes ? { ...p, stockReservado: Math.max(0, p.stockReservado - itemRes.qty) } : p;
      })
    );

    setReservas((prev) => prev.map((r) => (r.id === reservaId ? { ...r, estado: 'CANCELADA' } : r)));
    return true;
  };

  const avanzarEstadoReserva = (reservaId: string, nuevoEstado: EstadoReserva): boolean => {
    setReservas((prev) => prev.map((r) => (r.id === reservaId ? { ...r, estado: nuevoEstado } : r)));
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

        return { ...r, scanned: updatedScanned, estado: 'EN_PREPARACION' };
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
        return { ...r, codigoBolsa: bagCode, estado: 'ETIQUETA_PENDIENTE' };
      })
    );
    return bagCode;
  };

  const marcarListaRetiro = (reservaId: string) => {
    setReservas((prev) => prev.map((r) => (r.id === reservaId ? { ...r, estado: 'LISTA_PARA_RETIRO' } : r)));
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
      prev.map((a) => {
        if (a.id !== r.alumnoId) return a;
        const balance = Math.max(0, a.balance - r.total);
        const comprometido = Math.max(0, a.saldoComprometido - r.total);
        return { ...a, balance, saldoComprometido: comprometido, saldoDisponible: calcDisponible(balance, comprometido) };
      })
    );

    setProductos((prev) =>
      prev.map((p) => {
        const itemRes = r.items.find((it) => it.id === p.id);
        return itemRes
          ? {
              ...p,
              stockReservado: Math.max(0, p.stockReservado - itemRes.qty),
              stockFisico: Math.max(0, p.stockFisico - itemRes.qty),
            }
          : p;
      })
    );

    setReservas((prev) => prev.map((res) => (res.id === reservaId ? { ...res, estado: 'ENTREGADA' } : res)));

    return {
      success: true,
      message: `✓ Entrega completada con éxito. Venta generada y bolsa ${expectedBag} retirada.`,
    };
  };

  // ---- Operaciones nuevas: ahora mutan y persisten de verdad ----

  const aportarSaldo = (alumnoId: number, monto: number): OpResult => {
    const alumno = alumnos.find((a) => a.id === alumnoId);
    if (!alumno) return { success: false, message: 'Alumno no encontrado.' };
    if (!Number.isFinite(monto) || monto < 1000) {
      return { success: false, message: 'El monto mínimo para recargar es de $1.000 CLP.' };
    }
    setAlumnos((prev) =>
      prev.map((a) => {
        if (a.id !== alumnoId) return a;
        const balance = a.balance + monto;
        return { ...a, balance, saldoDisponible: calcDisponible(balance, a.saldoComprometido) };
      })
    );
    return { success: true, message: `✓ Se acreditaron $${monto.toLocaleString('es-CL')} al saldo de ${alumno.nombre}.` };
  };

  const entregaDirecta = (alumnoId: number, lineas: LineaEntrega[]): OpResult & { total?: number } => {
    const alumno = alumnos.find((a) => a.id === alumnoId);
    if (!alumno) return { success: false, message: 'Alumno no encontrado.' };
    if (lineas.length === 0) return { success: false, message: 'No hay materiales para entregar.' };

    let total = 0;
    for (const l of lineas) {
      const p = productos.find((pr) => pr.id === l.productoId);
      if (!p) return { success: false, message: 'Producto no encontrado en el catálogo.' };
      const disp = p.stockFisico - p.stockReservado;
      if (l.cant > disp) return { success: false, message: `Stock insuficiente de ${p.nombre} (disponible: ${disp}).` };
      total += l.cant * p.precioVenta;
    }

    if (alumno.saldoDisponible < total) {
      return { success: false, message: 'Saldo disponible insuficiente para completar la entrega directa.' };
    }

    setAlumnos((prev) =>
      prev.map((a) => {
        if (a.id !== alumnoId) return a;
        const balance = Math.max(0, a.balance - total);
        return { ...a, balance, saldoDisponible: calcDisponible(balance, a.saldoComprometido) };
      })
    );
    setProductos((prev) =>
      prev.map((p) => {
        const l = lineas.find((x) => x.productoId === p.id);
        return l ? { ...p, stockFisico: Math.max(0, p.stockFisico - l.cant) } : p;
      })
    );

    return { success: true, message: `✓ Entrega directa confirmada para ${alumno.nombre}. Total debitado: $${total.toLocaleString('es-CL')}`, total };
  };

  const registrarDevolucion = (
    alumnoId: number,
    productoId: number,
    monto: number,
    motivo: string,
    cant = 1
  ): OpResult => {
    const alumno = alumnos.find((a) => a.id === alumnoId);
    if (!alumno) return { success: false, message: 'Alumno no encontrado.' };
    if (!motivo.trim()) return { success: false, message: 'Indica un motivo obligatorio para registrar la devolución.' };

    setAlumnos((prev) =>
      prev.map((a) => {
        if (a.id !== alumnoId) return a;
        const balance = a.balance + monto;
        return { ...a, balance, saldoDisponible: calcDisponible(balance, a.saldoComprometido) };
      })
    );
    setProductos((prev) =>
      prev.map((p) => (p.id === productoId ? { ...p, stockFisico: p.stockFisico + cant } : p))
    );
    return { success: true, message: `✓ Devolución registrada: se reintegraron $${monto.toLocaleString('es-CL')} al saldo de ${alumno.nombre}. Motivo: ${motivo}` };
  };

  const recepcionStock = (productoId: number, cantidad: number, netoUnit: number): OpResult => {
    const p = productos.find((pr) => pr.id === productoId);
    if (!p) return { success: false, message: 'Producto no encontrado.' };
    if (cantidad <= 0) return { success: false, message: 'La cantidad recibida debe ser mayor a 0.' };

    setProductos((prev) =>
      prev.map((pr) => {
        if (pr.id !== productoId) return pr;
        const nuevoStock = pr.stockFisico + cantidad;
        // CPP ponderado por el nuevo ingreso
        const cpp = nuevoStock > 0
          ? Math.round((pr.cpp * pr.stockFisico + netoUnit * cantidad) / nuevoStock)
          : pr.cpp;
        return { ...pr, stockFisico: nuevoStock, cpp };
      })
    );
    return { success: true, message: `✓ Recepción conforme: +${cantidad} unidades de ${p.nombre}. Stock y CPP actualizados.` };
  };

  const crearAlumno = (alumno: Alumno) => {
    setAlumnos((prev) => [...prev, alumno]);
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
        aportarSaldo,
        entregaDirecta,
        registrarDevolucion,
        recepcionStock,
        crearAlumno,
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
