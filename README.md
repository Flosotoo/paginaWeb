# EduSaldo – Librería Escolar Digital

Proyecto semestral para la asignatura **Desarrollo Fullstack II (DSY1104)**.

## Equipo

- Integrante 1: Pamela Acuña
- Integrante 2: Antonio Jara
- Integrante 3: Florencia Soto

## Problema

Cuando los aportes, compras y saldos se gestionan mediante registros manuales o planillas independientes, los apoderados no siempre pueden consultar de manera inmediata los movimientos asociados a sus alumnos. Falta un sistema centralizado que permita consultar oportunamente los aportes, compras, saldos y movimientos de cada alumno, y que facilite el control administrativo de la librería escolar.

## Solución propuesta

**EduSaldo** será una aplicación web que permitirá gestionar una librería escolar, sus productos y usuarios, y evolucionará hacia la administración de estudiantes, aportes de saldo mediante Webpay (simulado), compras, reservas, movimientos e inventario.

## Objetivo general

Desarrollar una aplicación web para gestionar una librería escolar y centralizar el registro de productos, usuarios, compras y saldos asociados a estudiantes, utilizando HTML, CSS y JavaScript, con el propósito de mejorar la trazabilidad, transparencia y control de las operaciones.

## Organización y roles

- **Organización:** Centro General de Padres y Apoderados (Centro de Padres), que administra los fondos y es responsable de la librería escolar, donde se realizan las compras y entregas de materiales.
- **Sistema:** EduSaldo.
- **Apoderado:** aporta saldo a sus alumnos con Webpay, consulta sus movimientos y reserva materiales.
- **Encargado de Librería / Vendedor:** gestiona stock, prepara reservas y entrega materiales.
- **Administrador:** administra usuarios, estudiantes, productos y la configuración del sistema.
- **Alumno (estudiante):** entidad del dominio; tiene saldo disponible y no requiere inicio de sesión.

## Conceptos

- **Aporte:** dinero que el apoderado incorpora, mediante Webpay, al saldo de uno de sus alumnos.
- **Saldo disponible:** dinero que tiene el alumno para comprar materiales.
- **Compra:** adquisición de materiales en la librería escolar; descuenta el saldo.
- **Reserva:** selección anticipada de materiales para retirarlos después; se convierte en compra al retirarla.
- **Movimiento:** registro de un aporte, compra u otra operación que afecta el saldo.

Flujo del aporte: *Aportar saldo* → elegir alumno → ingresar monto → pago en Webpay → al aprobarse, el monto se acredita al saldo del alumno → queda registrado como movimiento. Webpay está **simulado**: no hay pasarela real ni se piden datos de tarjeta.

## Ejecución y alcance

- El sitio se abre directamente con `file://`, sin servidor, bundlers ni dependencias instaladas.
- La demo interactiva (login con roles, sesión y datos simulados) está pensada para **navegadores Chromium** (Chrome, Edge, Brave). En Firefox/LibreWolf el almacenamiento local se aísla por archivo y la sesión no cruza entre páginas.
- La interfaz está construida con **Bootstrap 5.3** (CSS y JS por CDN): grilla, navbar con desplegable, tarjetas, formularios, avisos, acordeones y utilidades. No hay clases propias en el HTML.
- El color y la tipografía de la marca se mantienen en dos hojas propias que se cargan **después** de Bootstrap: `assets/css/typography.css` define los tokens (`--ce-*`) y `assets/css/style.css` los aplica reasignando las variables de Bootstrap (`--bs-primary`, `--bs-body-font-family`, `--bs-btn-*`, etc.).
