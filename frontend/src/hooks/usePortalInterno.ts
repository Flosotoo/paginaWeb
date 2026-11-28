import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSesion } from "../context/SesionContext";
import { useConsulta } from "./useConsulta";
import { useAccion } from "./useAccion";
import { catalogoService } from "../services/catalogo";
import { entregasService } from "../services/entregas";
import { reservasService } from "../services/reservas";
import {
  inventarioService,
  type MovimientoInventario,
} from "../services/inventario";
import { usuariosService } from "../services/usuarios";
import { mensajeError } from "../services/api";

export type ConsultaMovimientos = {
  datos: MovimientoInventario[] | null;
  error: string | null;
  recargar: () => Promise<void>;
};

export interface ResumenAlumnoReserva {
  nombreCompleto: string;
  curso: string;
}

export function usePortalInterno(seccion?: string) {
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
  const cargarMovimientos = useCallback(
    () => inventarioService.movimientos(),
    [],
  );
  const movimientos = useConsulta(cargarMovimientos);

  // Caché incremental para evitar consultas repetidas por alumno en cada recarga de reservas.
  const [alumnosReserva, setAlumnosReserva] = useState<
    Record<number, ResumenAlumnoReserva>
  >({});
  const alumnosConsultados = useRef<Set<number>>(new Set());
  const idsAlumnos = useMemo(
    () =>
      [...new Set((reservas.datos ?? []).map((r) => r.alumnoId))]
        .sort((a, b) => a - b)
        .join(","),
    [reservas.datos],
  );

  useEffect(() => {
    alumnosConsultados.current.clear();
    setAlumnosReserva({});
  }, [usuario?.usuarioId]);

  useEffect(() => {
    let vigente = true;
    if (seccion !== "reservas" || !idsAlumnos) return;
    const pendientes = idsAlumnos
      .split(",")
      .map(Number)
      .filter((id) => !alumnosConsultados.current.has(id));
    if (pendientes.length === 0) return;

    void Promise.allSettled(
      pendientes.map(async (id) => {
        const data = await usuariosService.obtenerPorId(id);
        return [
          id,
          { nombreCompleto: data.nombreCompleto, curso: data.curso ?? "" },
        ] as const;
      }),
    ).then((resultados) => {
      if (!vigente) return;
      const nuevos: Record<number, ResumenAlumnoReserva> = {};
      for (const r of resultados) {
        if (r.status === "fulfilled") {
          const [id, info] = r.value;
          alumnosConsultados.current.add(id);
          nuevos[id] = info;
        }
      }
      if (Object.keys(nuevos).length > 0) {
        setAlumnosReserva((prev) => ({ ...prev, ...nuevos }));
      }
    });
    return () => {
      vigente = false;
    };
  }, [idsAlumnos, seccion, usuario?.usuarioId]);

  const [fechasEntrega, setFechasEntrega] = useState<Record<number, string>>(
    {},
  );
  const esAdmin = usuario?.rol === "ADMINISTRADOR";
  useEffect(() => {
    let vigente = true;
    if (seccion !== "reservas") return;
    void entregasService
      .historial()
      .then((data) => {
        if (!vigente) return;
        const mapa: Record<number, string> = {};
        for (const e of data) {
          if (
            typeof e.reservaId === "number" &&
            (e.estadoOperacion === undefined ||
              e.estadoOperacion === "COMPLETADA")
          ) {
            mapa[e.reservaId] = e.fecha;
          }
        }
        setFechasEntrega(mapa);
      })
      .catch(() => {
        if (vigente) setFechasEntrega({});
      });
    return () => {
      vigente = false;
    };
  }, [seccion, esAdmin, reservas.datos]);

  async function ejecutar(accion: () => Promise<void>): Promise<boolean> {
    setAviso("");
    try {
      const resultado = await realizar(async () => {
        await accion();
        return true;
      });
      return resultado === true;
    } catch (e) {
      setAviso(mensajeError(e));
      return false;
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
      await Promise.allSettled([ajustes.recargar()]);
    });
  }

  // Las recargas posteriores usan allSettled para que un fallo de refresco no haga fallar una mutación ya confirmada.
  const preparar = (id: number) =>
    ejecutar(async () => {
      await reservasService.preparar(id);
      setAviso("Reserva preparada.");
      await Promise.allSettled([reservas.recargar()]);
    });

  const entregar = (id: number) =>
    ejecutar(async () => {
      await reservasService.entregar(id);
      setAviso("Entrega registrada.");
      await Promise.allSettled([
        reservas.recargar(),
        productos.recargar(),
        movimientos.recargar(),
      ]);
    });

  const cancelar = (id: number, motivoCancelacion: string) =>
    ejecutar(async () => {
      await reservasService.cancelar(id, motivoCancelacion);
      setAviso("Reserva cancelada.");
      await Promise.allSettled([
        reservas.recargar(),
        productos.recargar(),
        movimientos.recargar(),
      ]);
    });

  const aprobar = (id: number) =>
    ejecutar(async () => {
      await inventarioService.aprobar(id, usuario!.usuarioId);
      setAviso("Ajuste aprobado.");
      await Promise.allSettled([
        ajustes.recargar(),
        productos.recargar(),
        movimientos.recargar(),
      ]);
    });

  const rechazar = (id: number, razon: string) =>
    ejecutar(async () => {
      await inventarioService.rechazar(id, razon, usuario!.usuarioId);
      setAviso("Ajuste rechazado.");
      await Promise.allSettled([ajustes.recargar()]);
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
    alumnosReserva,
    fechasEntrega,
    solicitar,
    preparar,
    entregar,
    cancelar,
    aprobar,
    rechazar,
  };
}
