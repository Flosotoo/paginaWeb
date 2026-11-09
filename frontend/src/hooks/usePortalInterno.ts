import { useCallback, useState } from "react";
import { useSesion } from "../context/SesionContext";
import { useConsulta } from "./useConsulta";
import { useAccion } from "./useAccion";
import { catalogoService } from "../services/catalogo";
import { reservasService } from "../services/reservas";
import { inventarioService, type MovimientoInventario } from "../services/inventario";
import { mensajeError } from "../services/api";

export type ConsultaMovimientos = { datos: MovimientoInventario[] | null; error: string | null; recargar: () => Promise<void> };

export function usePortalInterno() {
  const { usuario } = useSesion();
  const [aviso, setAviso] = useState("");
  const [producto, setProducto] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [motivo, setMotivo] = useState("");
  const { procesando, realizar } = useAccion();
  const cargarReservas = useCallback(() => reservasService.listar(), []);
  const reservas = useConsulta(cargarReservas);
  const cargarProductos = useCallback(() => catalogoService.productos(), []);
  const productos = useConsulta(cargarProductos);
  const cargarAjustes = useCallback(() => inventarioService.ajustes(), []);
  const ajustes = useConsulta(cargarAjustes);
  const cargarMovimientos = useCallback(() => inventarioService.movimientos(), []);
  const movimientos = useConsulta(cargarMovimientos);
  async function ejecutar(accion: () => Promise<void>) {
    setAviso("");
    try {
      await realizar(accion);
    } catch (e) {
      setAviso(mensajeError(e));
    }
  }
  function solicitar() {
    const unidades = Number(cantidad);
    const id = Number(producto);
    if (
      !id ||
      !Number.isSafeInteger(unidades) ||
      unidades === 0 ||
      !motivo.trim()
    ) {
      setAviso("Completa el producto, cantidad y motivo.");
      return;
    }
    void ejecutar(async () => {
      await inventarioService.solicitar(
        id,
        unidades,
        motivo,
        usuario!.usuarioId,
      );
      setCantidad("");
      setMotivo("");
      setAviso("Solicitud registrada.");
      await ajustes.recargar();
    });
  }
  const preparar = (id: number) =>
    ejecutar(async () => {
      await reservasService.preparar(id);
      setAviso("Reserva preparada.");
      await reservas.recargar();
    });
  const entregar = (id: number) =>
    ejecutar(async () => {
      await reservasService.entregar(id);
      setAviso("Entrega registrada.");
      await Promise.all([reservas.recargar(), productos.recargar()]);
    });
  const cancelar = (id: number, motivo: string) =>
    ejecutar(async () => {
      await reservasService.cancelar(id, motivo);
      setAviso("Reserva cancelada.");
      await Promise.all([reservas.recargar(), productos.recargar()]);
    });
  const aprobar = (id: number) =>
    ejecutar(async () => {
      await inventarioService.aprobar(id, usuario!.usuarioId);
      setAviso("Ajuste aprobado.");
      await Promise.all([ajustes.recargar(), productos.recargar(), movimientos.recargar()]);
    });
  const rechazar = (id: number, razon: string) =>
    ejecutar(async () => {
      await inventarioService.rechazar(id, razon, usuario!.usuarioId);
      setAviso("Ajuste rechazado.");
      await ajustes.recargar();
    });
  return {
    usuario,
    aviso,
    producto,
    setProducto,
    cantidad,
    setCantidad,
    motivo,
    setMotivo,
    procesando,
    reservas,
    productos,
    ajustes,
    movimientos,
    solicitar,
    preparar,
    entregar,
    cancelar,
    aprobar,
    rechazar,
  };
}
