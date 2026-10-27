# Frontend Web · EduSaldo (React 18 + TypeScript + Vite)

La interfaz de usuario de **EduSaldo** es una Single Page Application (SPA) moderna, componentizada y fuertemente tipada en **TypeScript**, construida con **React 18**, **Vite** y **Bootstrap 5**. Consume los endpoints de negocio a través del **API Gateway** central en `http://localhost:8090`.

---

## 🛠️ Stack Tecnológico

- **Framework:** [React 18.3](https://react.dev/)
- **Lenguaje:** [TypeScript 5.6](https://www.typescriptlang.org/)
- **Bundler / Servidor de Desarrollo:** [Vite 6.0](https://vitejs.dev/) con SWC
- **Enrutamiento:** [React Router DOM v6](https://reactrouter.com/)
- **Estilos y Responsive:** [Bootstrap 5.3](https://getbootstrap.com/)
- **Testing:** [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) con `jsdom`

---

## 📁 Estructura del Proyecto

```text
frontend/
├── src/
│   ├── components/       <- Componentes reutilizables (Navbar, ProductCard, Carrito, etc.)
│   ├── context/          <- Contextos globales de estado (Autenticación, Carrito, Sesión)
│   ├── data/             <- Catálogos y datos iniciales para desarrollo local
│   ├── pages/            <- Vistas completas agrupadas por rol de usuario
│   │   ├── admin/        <- Panel de administración (usuarios, configuración, ajustes)
│   │   ├── encargado/    <- Mesón de librería (preparación de reservas, entregas)
│   │   ├── apoderado/    <- Portal apoderado (abonos Webpay, pupilos, movimientos)
│   │   └── alumno/       <- Portal alumno >= 12 años (consulta de saldo, reservas)
│   ├── routes/           <- Definición de rutas públicas y privadas protegidas por rol
│   ├── tests/            <- Batería de pruebas unitarias y de integración (Vitest + RTL)
│   ├── types/            <- Modelos e interfaces TypeScript del dominio
│   ├── utils/            <- Helpers y formateadores (moneda CLP, RUT chileno, fechas)
│   ├── App.tsx           <- Componente raíz y proveedor de rutas
│   └── main.tsx          <- Punto de entrada del frontend
├── index.html            <- Plantilla HTML base
├── package.json          <- Dependencias y scripts de ejecución
├── tsconfig.json         <- Configuración del compilador TypeScript
└── vite.config.ts        <- Configuración de Vite y proxy hacia el API Gateway
```

---

## 🚀 Puesta en Marcha

### Prerrequisitos
- **Node.js:** Versión 20 o superior
- **npm:** Versión 10 o superior

### Opción 1: Mediante el Script Centralizado (Recomendado)
Desde la raíz del monorepo `EduSaldo`:
```bash
python scripts/3_arrancar_frontend.py
```
*(Verifica e instala `node_modules` si no existen y arranca el servidor en `http://localhost:5173`).*

### Opción 2: Comandos npm directos
```bash
cd frontend
npm install
npm run dev
```

El servidor quedará disponible en: **`http://localhost:5173`**

---

## 👥 Roles de Usuario en la SPA

| Rol | Vistas Clave | Capacidades en la Interfaz |
| :--- | :--- | :--- |
| **Administrador** | `/admin/**` | Gestión de usuarios, nómina, parámetros del colegio, catálogo y aprobación de ajustes de stock. |
| **Encargado de Librería** | `/encargado/**` | Preparación de pedidos (`preparadaPorId`, `fechaPreparacion`), despacho en mesón, devoluciones e inventario físico. |
| **Apoderado** | `/apoderado/**` | Abono de fondos vía Webpay simulado, consulta de saldo de pupilos y reserva de materiales. |
| **Alumno ($\ge$ 12 años)** | `/alumno/**` | Autonomía para consulta de saldo propio y reserva personal de útiles. |

---

## 🧪 Pruebas Unitarias y de Componentes

La suite de pruebas frontend utiliza **Vitest** y **React Testing Library**:

```bash
# Ejecutar todas las pruebas una vez
npm test

# Modo observador (watch) para desarrollo
npm run test:watch

# Generar reporte de cobertura de código
npm run test:coverage
```

---

## 📦 Compilación para Producción

Para compilar la SPA optimizada y validada por el compilador de TypeScript:

```bash
npm run build
```

Los artefactos listos para distribución se generarán en la carpeta `frontend/dist/`.
