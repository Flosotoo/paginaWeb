import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import axios from "axios";
import { authService, type Rol, type Sesion } from "../services/auth";
import { mensajeError, setSessionToken } from "../services/api";

export type UsuarioSesion = Omit<Sesion, "token" | "rol"> & { rol: Rol };
interface EstadoSesion {
  usuario: UsuarioSesion | null;
  cargando: boolean;
  error: string | null;
  ingresar: (identificador: string, password: string) => Promise<void>;
  salir: () => Promise<void>;
  comprobar: () => Promise<void>;
}
const Clave = "edusaldo_sesion";
const Contexto = createContext<EstadoSesion | null>(null);
function normalizar(s: Omit<Sesion, "token">): UsuarioSesion {
  const rol = s.rol.replace(/^ROLE_/, "") as Rol;
  if (!["ADMINISTRADOR", "ENCARGADO", "APODERADO", "ALUMNO"].includes(rol))
    throw new Error("Rol inválido");
  return { ...s, rol };
}
export function SesionProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const comprobar = useCallback(async () => {
    const token = sessionStorage.getItem(Clave);
    if (!token) {
      setSessionToken(null);
      setUsuario(null);
      setCargando(false);
      return;
    }
    setSessionToken(token);
    setCargando(true);
    setError(null);
    try {
      setUsuario(normalizar(await authService.sesion()));
    } catch (e) {
      setUsuario(null);
      if (axios.isAxiosError(e) && e.response?.status === 401) {
        sessionStorage.removeItem(Clave);
        setSessionToken(null);
      }
      setError(mensajeError(e));
    } finally {
      setCargando(false);
    }
  }, []);
  useEffect(() => {
    void comprobar();
  }, [comprobar]);
  const ingresar = async (identificador: string, password: string) => {
    const sesion = await authService.login(identificador.trim(), password);
    if (!sesion.token)
      throw new Error("La respuesta no contiene una sesión válida");
    const { token, ...datos } = sesion;
    const siguiente = normalizar(datos);
    sessionStorage.setItem(Clave, token);
    setSessionToken(token);
    setUsuario(siguiente);
    setError(null);
  };
  const salir = async () => {
    try {
      await authService.logout();
    } finally {
      sessionStorage.removeItem(Clave);
      setSessionToken(null);
      setUsuario(null);
      setError(null);
    }
  };
  return (
    <Contexto.Provider
      value={{ usuario, cargando, error, ingresar, salir, comprobar }}
    >
      {children}
    </Contexto.Provider>
  );
}
export function useSesion() {
  const valor = useContext(Contexto);
  if (!valor) throw new Error("Falta SesionProvider");
  return valor;
}
