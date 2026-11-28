import { useCallback, useEffect, useState } from "react";
import { useSesion } from "../context/SesionContext";
import { useAccion } from "./useAccion";
import { useConsulta } from "./useConsulta";
import { catalogoService } from "../services/catalogo";
import { familiaService } from "../services/familia";
import { reservasService } from "../services/reservas";
import { mensajeError } from "../services/api";

export function usePortalFamilia() {
  const { usuario } = useSesion();
  const [alumno, setAlumno] = useState(0);
  const [carrito, setCarrito] = useState<Record<number, number>>({});
  const [monto, setMonto] = useState("");
  const [tokenPago, setTokenPago] = useState<string | null>(null);
  const [aviso, setAviso] = useState("");
  const [avisoReserva, setAvisoReserva] = useState<{ mensaje: string; tipo: "exito" | "error"; id?: number } | null>(null);
  const [avisoCancelacion, setAvisoCancelacion] = useState<{ mensaje: string; tipo: "exito" | "error"; id: number } | null>(null);
  const { procesando, realizar } = useAccion();
  const cargarAlumnos = useCallback(
    () => familiaService.alumnos(usuario!.usuarioId),
    [usuario],
  );
  const alumnos = useConsulta(cargarAlumnos, usuario?.rol === "APODERADO");
  const cargarSaldosAlumnos = useCallback(async () => {
    const resultados = await Promise.allSettled(
      (alumnos.datos ?? []).map(async (a) => ({
        id: a.id,
        saldo: (await familiaService.cuenta(a.id)).saldoDisponible,
      })),
    );
    const saldos: Record<number, number> = {};
    resultados.forEach((r) => {
      if (r.status === "fulfilled") saldos[r.value.id] = r.value.saldo;
    });
    return saldos;
  }, [alumnos.datos]);
  const saldosAlumnos = useConsulta(cargarSaldosAlumnos,
    usuario?.rol === "APODERADO" && Boolean(alumnos.datos?.length));
  const [avisoPago, setAvisoPago] = useState<{ mensaje: string; tipo: "exito" | "error" } | null>(null);
  const seleccionarAlumno = (id: number) => {
    if (procesando || tokenPago) return;
    setAvisoPago(null);
    setAvisoReserva(null);
    setAvisoCancelacion(null);
    setAviso("");
    setMonto("");
    setCarrito({});
    setAlumno(id);
  };
  const cargarProductos = useCallback(() => catalogoService.productos(), []);
  const productos = useConsulta(cargarProductos);
  const cargarCuenta = useCallback(
    () => familiaService.cuenta(alumno),
    [alumno],
  );
  const cuenta = useConsulta(cargarCuenta, alumno > 0);
  const cargarMovimientos = useCallback(
    () => familiaService.movimientos(alumno),
    [alumno],
  );
  const movimientos = useConsulta(cargarMovimientos, alumno > 0 && usuario?.rol === "APODERADO");
  const cargarAbonos = useCallback(
    () => familiaService.abonos(alumno),
    [alumno],
  );
  const abonos = useConsulta(
    cargarAbonos,
    alumno > 0 && usuario?.rol === "APODERADO",
  );
  const cargarNotificaciones = useCallback(
    () => familiaService.notificaciones(),
    [],
  );
  const notificaciones = useConsulta(cargarNotificaciones, usuario?.rol === "APODERADO");
  const cargarAvisosReserva = useCallback(() => reservasService.notificaciones(), []);
  const avisosReserva = useConsulta(
    cargarAvisosReserva,
    usuario?.rol === "APODERADO",
  );
  const cargarReservas = useCallback(
    () => reservasService.porAlumno(alumno),
    [alumno],
  );
  const reservas = useConsulta(cargarReservas, alumno > 0);
  useEffect(() => {
    if (usuario?.rol === "ALUMNO") setAlumno(usuario.usuarioId);
    else if (alumnos.datos?.length)
      setAlumno((actual) =>
        alumnos.datos!.some((a) => a.id === actual)
          ? actual
          : 0,
      );
  }, [usuario, alumnos.datos]);
  const ejecutar = async (accion: () => Promise<void>, alError = (mensaje: string) => setAviso(mensaje)) => {
    setAviso("");
    try {
      await realizar(accion);
    } catch (error) {
      alError(mensajeError(error));
    }
  };
  const reservar = () =>
    ejecutar(async () => {
      setAvisoReserva(null);
      const items = Object.entries(carrito)
        .filter(([, cantidad]) => cantidad > 0)
        .map(([productoId, cantidad]) => ({
          productoId: Number(productoId),
          cantidad,
        }));
      if (!alumno || !items.length) {
        setAvisoReserva({ tipo: "error", mensaje: "Selecciona un alumno y al menos un material." });
        return;
      }
      const reserva = await reservasService.crear(alumno, items);
      setCarrito({});
      setAvisoReserva({ tipo: "exito", id: reserva.id, mensaje: `Reserva realizada con éxito: ${items.reduce((n, i) => n + i.cantidad, 0)} materiales por $${reserva.total.toLocaleString("es-CL")}.` });
      await Promise.allSettled([
        cuenta.recargar(),
        reservas.recargar(),
        productos.recargar(),
        ...(usuario?.rol === "APODERADO"
          ? [
              saldosAlumnos.recargar(),
              movimientos.recargar(),
              avisosReserva.recargar(),
            ]
          : []),
      ]);
    }, mensaje => setAvisoReserva({ tipo: "error", mensaje }));
  const MIN_ABONO = 100;
  const MAX_ABONO = 500000;

  const iniciarPago = () =>
    ejecutar(async () => {
      setAvisoPago(null);
      const valor = Number(monto);
      if (!Number.isSafeInteger(valor) || valor <= 0) {
        setAviso("Ingresa un monto entero mayor que cero.");
        return;
      }
      if (valor < MIN_ABONO) {
        setAviso(`El monto mínimo para abonar es $${MIN_ABONO.toLocaleString("es-CL")} CLP.`);
        return;
      }
      if (valor > MAX_ABONO) {
        setAviso(`El monto máximo permitido por abono es $${MAX_ABONO.toLocaleString("es-CL")} CLP.`);
        return;
      }
      const pago = await familiaService.iniciarAbono(
        alumno,
        usuario!.usuarioId,
        valor,
      );
      setTokenPago(pago.token);

    });
  const confirmarPago = (resultado: "APROBADO" | "RECHAZADO") =>
    ejecutar(async () => {
      if (!tokenPago) return;
      const valor = Number(monto);
      await familiaService.confirmarAbono(tokenPago, resultado);
      setTokenPago(null);
      setMonto("");
      setAvisoPago({
        tipo: resultado === "APROBADO" ? "exito" : "error",
        mensaje: resultado === "APROBADO"
          ? `Pago aprobado. Abono de $${valor.toLocaleString("es-CL")} registrado correctamente.`
          : `Pago rechazado. El abono de $${valor.toLocaleString("es-CL")} no se acreditó. Puedes intentar nuevamente.`,
      });
      await cuenta.recargar();
      await Promise.allSettled([
        movimientos.recargar(),
        notificaciones.recargar(),
        abonos.recargar(),
        saldosAlumnos.recargar(),
      ]);
    });
  const cancelar = (id: number, motivo: string) =>
    ejecutar(async () => {
      setAvisoCancelacion(null);
      if (!reservas.datos?.some(r => r.id === id && r.alumnoId === alumno && r.estado === "PENDIENTE")) {
        setAvisoCancelacion({ id, tipo: "error", mensaje: "Solo puedes cancelar una reserva propia pendiente de preparación." });
        return;
      }
      await reservasService.cancelar(id, motivo);
      setAvisoCancelacion({ id, tipo: "exito", mensaje: "Reserva cancelada. Se liberó el saldo comprometido." });
      await Promise.allSettled([
        cuenta.recargar(),
        reservas.recargar(),
        productos.recargar(),
        ...(usuario?.rol === "APODERADO"
          ? [saldosAlumnos.recargar(), movimientos.recargar()]
          : []),
      ]);
    }, mensaje => setAvisoCancelacion({ id, tipo: "error", mensaje }));
  return {
    usuario,
    alumno,
    setAlumno: seleccionarAlumno,
    saldosAlumnos,
    avisoPago,
    avisoReserva,
    avisoCancelacion,
    carrito,
    setCarrito,
    monto,
    setMonto,
    tokenPago,
    aviso,
    procesando,
    alumnos,
    productos,
    cuenta,
    movimientos,
    abonos,
    notificaciones,
    avisosReserva,
    reservas,
    reservar,
    iniciarPago,
    confirmarPago,
    cancelar,
  };
}
