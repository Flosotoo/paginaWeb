import type { ReactNode } from "react";

export interface TablaResponsivaProps {
  cargando?: boolean;
  vacio?: boolean;
  mensajeCarga?: string;
  mensajeVacio?: string;
  children: ReactNode;
}

export function TablaResponsiva({
  cargando = false,
  vacio = false,
  mensajeCarga = "Cargando registros…",
  mensajeVacio = "No hay registros disponibles.",
  children,
}: TablaResponsivaProps) {
  if (cargando) {
    return (
      <p role="status" className="py-3 text-muted mb-0">
        {mensajeCarga}
      </p>
    );
  }

  if (vacio) {
    return <p className="py-3 text-muted mb-0">{mensajeVacio}</p>;
  }

  return (
    <div className="table-responsive data-table-container">{children}</div>
  );
}
