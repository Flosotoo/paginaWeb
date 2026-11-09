import { useRef, useState } from "react";

export function useAccion() {
  const ocupada = useRef(false);
  const [procesando, setProcesando] = useState(false);
  async function realizar<T>(accion: () => Promise<T>): Promise<T | undefined> {
    if (ocupada.current) return undefined;
    ocupada.current = true;
    setProcesando(true);
    const demora = new Promise<void>((resolve) => setTimeout(resolve, 1000));
    try {
      return await accion();
    } finally {
      await demora;
      ocupada.current = false;
      setProcesando(false);
    }
  }
  return { procesando, realizar };
}
