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
  const { procesando, realizar } = useAccion();
  const cargarAlumnos = useCallback(
    () => familiaService.alumnos(usuario!.usuarioId),
    [usuario],
  );
  const alumnos = useConsulta(cargarAlumnos, usuario?.rol === "APODERADO");
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
  const movimientos = useConsulta(cargarMovimientos, alumno > 0);
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
  const notificaciones = useConsulta(cargarNotificaciones);
  const cargarAvisosReserva = useCallback(() => reservasService.notificaciones(), []);
  const avisosReserva = useConsulta(cargarAvisosReserva);
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
          : alumnos.datos![0].id,
      );
  }, [usuario, alumnos.datos]);
  const ejecutar = async (accion: () => Promise<void>) => {
    setAviso("");
    try {
      await realizar(accion);
    } catch (error) {
      setAviso(mensajeError(error));
    }
  };
  const reservar = () =>
    ejecutar(async () => {
      const items = Object.entries(carrito)
        .filter(([, cantidad]) => cantidad > 0)
        .map(([productoId, cantidad]) => ({
          productoId: Number(productoId),
          cantidad,
        }));
      if (!alumno || !items.length) {
        setAviso("Selecciona un alumno y al menos un material.");
        return;
      }
      await reservasService.crear(alumno, items);
      setCarrito({});
      setAviso("Reserva registrada.");
      await Promise.all([
        cuenta.recargar(),
        movimientos.recargar(),
        reservas.recargar(),
        avisosReserva.recargar(),
        productos.recargar(),
      ]);
    });
  const MIN_ABONO = 100;
  const MAX_ABONO = 500000;

  const iniciarPago = () =>
    ejecutar(async () => {
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
      setAviso("Pago simulado iniciado. Elige su resultado para continuar.");
    });
  const confirmarPago = (resultado: "APROBADO" | "RECHAZADO") =>
    ejecutar(async () => {
      if (!tokenPago) return;
      await familiaService.confirmarAbono(tokenPago, resultado);
      setTokenPago(null);
      setMonto("");
      setAviso(
        resultado === "APROBADO"
          ? "Abono registrado."
          : "Pago rechazado sin abonar saldo.",
      );
      await cuenta.recargar();
      await Promise.all([
        movimientos.recargar(),
        notificaciones.recargar(),
        abonos.recargar(),
      ]);
    });
  const cancelar = (id: number, motivo: string) =>
    ejecutar(async () => {
      await reservasService.cancelar(id, motivo);
      setAviso("Reserva cancelada.");
      await Promise.all([
        cuenta.recargar(),
        movimientos.recargar(),
        reservas.recargar(),
        productos.recargar(),
      ]);
    });
  return {
    usuario,
    alumno,
    setAlumno,
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
