import { useCallback, useState } from "react";
import { useSesion } from "../context/SesionContext";
import { useAccion } from "./useAccion";
import { useConsulta } from "./useConsulta";
import {
  administracionCatalogo,
  catalogoService,
  type NuevoProducto,
} from "../services/catalogo";
import { mensajeError } from "../services/api";
export function useGestionCatalogo(actualizar: () => Promise<void>) {
  const { usuario } = useSesion();
  const { procesando, realizar } = useAccion();
  const [aviso, setAviso] = useState("");
  const [diferencia, setDiferencia] = useState<number | null>(null);
  const consultarCategorias = useCallback(
    () => catalogoService.categorias(),
    [],
  );
  const categorias = useConsulta(consultarCategorias);
  const ejecutar = async (accion: () => Promise<void>, mensaje: string) => {
    setAviso("");
    try {
      await realizar(async () => {
        await accion();
        setAviso(mensaje);
        await Promise.all([categorias.recargar(), actualizar()]);
      });
    } catch (e) {
      setAviso(mensajeError(e));
    }
  };
  const categoria = (nombre: string) =>
    ejecutar(async () => {
      await administracionCatalogo.crearCategoria(nombre);
    }, "Categoría creada.");
  const producto = (datos: NuevoProducto) =>
    ejecutar(async () => {
      await administracionCatalogo.crearProducto(datos);
    }, "Producto creado.");
  const editarProducto = (id: number, nombre: string, precio: number) =>
    ejecutar(async () => {
      await administracionCatalogo.editarProducto(id, nombre, precio);
    }, "Producto actualizado.");
  const inactivarProducto = (id: number) =>
    ejecutar(async () => {
      await administracionCatalogo.inactivarProducto(id);
    }, "Producto inactivado.");
  const editarCategoria = (id: number, nombre: string, descripcion: string) =>
    ejecutar(async () => {
      await administracionCatalogo.editarCategoria(id, nombre, descripcion);
    }, "Categoría actualizada.");
  const inactivarCategoria = (id: number) =>
    ejecutar(async () => {
      await administracionCatalogo.inactivarCategoria(id);
    }, "Categoría inactivada.");
  const ingreso = (productoId: number, cantidad: number, observacion: string) =>
    ejecutar(async () => {
      await administracionCatalogo.ingresarStock(
        productoId,
        cantidad,
        usuario!.usuarioId,
        observacion,
      );
    }, "Ingreso de stock registrado.");
  const conteo = (productoId: number, cantidad: number) =>
    ejecutar(async () => {
      const resultado = await administracionCatalogo.contar(
        productoId,
        cantidad,
        usuario!.usuarioId,
        usuario!.idEstablecimiento,
      );
      const valor: unknown = resultado.detalles?.[0]?.diferencia;
      setDiferencia(typeof valor === "number" ? valor : null);
    }, "Conteo registrado sin modificar el stock.");
  return {
    usuario,
    procesando,
    aviso,
    categorias,
    categoria,
    producto,
    editarProducto,
    inactivarProducto,
    editarCategoria,
    inactivarCategoria,
    ingreso,
    conteo,
    diferencia,
  };
}
