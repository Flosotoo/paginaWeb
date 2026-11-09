# Frontend de EduSaldo

La interfaz usa React, TypeScript y Vite; requiere Node.js 22.12 o posterior. Las peticiones HTTP pasan por una instancia Axios compartida y llegan al gateway local en `http://localhost:8090`; puede configurarse con `VITE_API_BASE_URL`.

```bash
cd frontend
npm install
npm run dev
```

La interfaz conectada actualmente permite iniciar y cerrar sesión, consultar cuentas, movimientos, alertas y catálogo, efectuar abonos simulados, crear y cancelar reservas y consultar sus avisos simulados, preparar y entregar reservas, registrar entregas directas y devoluciones, gestionar solicitudes de ajuste y registrar categorías, productos e ingresos de stock. El administrador también puede consultar, crear, inactivar y reactivar usuarios de personal o apoderados, matricular alumnos con apoderado, y restablecer claves. También se gestionan vínculos familiares, nóminas CSV, políticas, solicitudes de corrección de datos, consentimiento, liquidación de saldo y informes de saldos y movimientos por alumno y período con exportación CSV. El pago y los correos son simulados.

La cobertura de los requisitos y los reportes todavía debe verificarse criterio por criterio; algunas funciones siguen pendientes. Las operaciones reales y sus restricciones se comprueban en el backend.

```bash
npm test
npm run build
npm run test:e2e
```

Las pruebas de navegador requieren que el gateway y los cuatro servicios estén iniciados con las bases y semillas locales, y que Playwright tenga Chromium instalado (`npx playwright install chromium`). Algunas pruebas crean datos y realizan movimientos de prueba; su ejecución debe reservarse para bases de desarrollo.
