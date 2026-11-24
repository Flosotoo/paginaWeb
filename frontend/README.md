# Frontend de EduSaldo

La interfaz web está construida con **React 18, TypeScript, Vite 6, React Router (`HashRouter` + `<Outlet />`) y Bootstrap 5.3**. Todas las solicitudes HTTP se canalizan mediante una instancia compartida de Axios (`src/services/api.ts`) hacia el API Gateway (`http://localhost:8090`), almacenando el JWT HS256 en `sessionStorage` e inyectándolo como `Authorization: Bearer <token>`.

## Arquitectura Frontend
- **Enrutamiento protegido (`src/routes/`):** `RutaProtegida.tsx` y `LayoutPortal.tsx` implementan el patrón declarativo con `<Outlet />` y `<NavLink>`, restringiendo el acceso por sesión, estado `PRIMER_ACCESO` y rol (`ADMINISTRADOR`, `ENCARGADO`, `APODERADO`, `ALUMNO`).
- **Componentes reutilizables tipados (`src/components/`):** `AlertaMensaje`, `BotonAccion` (integrado con `useAccion` para prevención de doble envío), `TarjetaResumen`, `TablaResponsiva` (`.table-responsive`) y `TarjetaAlumno`, armonizados visualmente con Bootstrap 5.3 y la paleta institucional de EduSaldo.
- **Servicios por dominio (`src/services/`):** contratos desacoplados para `auth`, `usuarios`, `familia`, `catalogo`, `inventario`, `proveedores`, `ordenesCompra`, `cuentaLibreria`, `reservas`, `entregas`, `administracion`, `correcciones`, `liquidacion` y `privacidad`.

## Desarrollo y Compilación
```bash
cd frontend
npm install
npm run dev
npm run build
```

## Pruebas Unitarias y Cobertura (Jasmine + Karma y Vitest)
- **Runner oficial con cobertura (`Jasmine + Karma` en Chromium/Chrome Headless):**
  ```bash
  npm test
  ```
  Genera el reporte HTML detallado en `frontend/coverage/html/index.html` y verifica automáticamente umbrales mínimos de cobertura sobre componentes, rutas protegidas, contexto de sesión, interceptores/servicios Axios con mocks (`spyOn`) y validadores de dominio (`rut.ts`, `nomina.ts`, `exportarCsv.ts`).
- **Suite complementaria rápida con Vitest:**
  ```bash
  npm run test:vitest
  ```
