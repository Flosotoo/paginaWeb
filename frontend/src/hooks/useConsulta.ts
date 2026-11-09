import { useCallback, useEffect, useRef, useState } from "react";
import { mensajeError } from "../services/api";
export function useConsulta<T>(consultar: () => Promise<T>, habilitada = true) {
  const [datos, setDatos] = useState<T | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const version = useRef(0);
  const recargar = useCallback(async () => {
    const actual = ++version.current;
    if (!habilitada) {
      setDatos(null);
      setCargando(false);
      return;
    }
    setDatos(null);
    setCargando(true);
    setError(null);
    try {
      const valor = await consultar();
      if (version.current === actual) setDatos(valor);
    } catch (e) {
      if (version.current === actual) setError(mensajeError(e));
    } finally {
      if (version.current === actual) setCargando(false);
    }
  }, [consultar, habilitada]);
  useEffect(() => {
    void recargar();
    return () => {
      version.current++;
    };
  }, [recargar]);
  return { datos, cargando, error, recargar };
}
