import { useState } from "react";
import { useAccion } from "./useAccion";
import { mensajeError } from "../services/api";
import {
  entregasService,
  type AlumnoBuscado,
  type Entrega,
} from "../services/entregas";
export function useEntregaMeson(actualizar: () => Promise<void>) {
  const [alumno, setAlumno] = useState<AlumnoBuscado | null>(null);
  const [entrega, setEntrega] = useState<Entrega | null>(null);
  const [aviso, setAviso] = useState("");
  const { procesando, realizar } = useAccion();
  async function ejecutar(accion: () => Promise<void>) {
    setAviso("");
    try {
      await realizar(accion);
    } catch (e) {
      setAviso(mensajeError(e));
    }
  }
  const buscarAlumno = (rut: string) =>
    ejecutar(async () => {
      setAlumno(null);
      setAlumno(await entregasService.buscarAlumno(rut));
    });
  const entregar = (producto: number, cantidad: number) =>
    ejecutar(async () => {
      if (
        !alumno ||
        !producto ||
        !Number.isSafeInteger(cantidad) ||
        cantidad < 1
      ) {
        setAviso("Selecciona alumno, producto y cantidad válida.");
        return;
      }
      const resultado = await entregasService.crear(
        alumno.id,
        producto,
        cantidad,
      );
      setEntrega(resultado);
      setAviso(`Entrega ${resultado.numero} registrada.`);
      await actualizar();
    });
  const buscarEntrega = (id: number) =>
    ejecutar(async () => {
      if (!id) {
        setAviso("Ingresa un identificador de entrega.");
        return;
      }
      setEntrega(null);
      setEntrega(await entregasService.obtener(id));
    });
  const devolver = (detalle: number, cantidad: number, motivo: string) =>
    ejecutar(async () => {
      if (
        !entrega ||
        !detalle ||
        !Number.isSafeInteger(cantidad) ||
        cantidad < 1 ||
        !motivo.trim()
      ) {
        setAviso("Completa el detalle, cantidad y motivo.");
        return;
      }
      await entregasService.devolver(entrega.id, detalle, cantidad, motivo);
      setAviso("Devolución registrada.");
      setEntrega(await entregasService.obtener(entrega.id));
      await actualizar();
    });
  return {
    alumno,
    entrega,
    aviso,
    procesando,
    buscarAlumno,
    entregar,
    buscarEntrega,
    devolver,
  };
}
