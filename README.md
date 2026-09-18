# EduSaldo – Librería Escolar Digital

Proyecto semestral para la asignatura **Desarrollo Fullstack II (DSY1104)**.

## Equipo

- Integrante 1: Pamela Acuña
- Integrante 2: Antonio Jara
- Integrante 3: Florencia Soto

## Problema

En algunas librerías escolares administradas por Centros de Padres, los aportes de los apoderados y las compras de los estudiantes dependen de procesos manuales. Esto dificulta mantener saldos actualizados, seguir los movimientos y entregar información clara a los apoderados.

## Solución propuesta

**EduSaldo** será una aplicación web que permitirá gestionar una librería escolar, sus productos y usuarios, y evolucionará hacia la administración de estudiantes, cargas de saldo, compras, movimientos e inventario.

## Objetivo general

Desarrollar una aplicación web para gestionar una librería escolar y centralizar el registro de productos, usuarios, compras y saldos asociados a estudiantes, utilizando HTML, CSS y JavaScript, con el propósito de mejorar la trazabilidad, transparencia y control de las operaciones.

## Organización y roles

- **Organización:** Centro de Padres, responsable de gestionar la librería escolar.
- **Sistema:** EduSaldo.
- **Apoderado:** gestiona estudiantes, saldo, movimientos y reservas.
- **Encargado de Librería / Vendedor:** gestiona stock, prepara reservas y entrega materiales.
- **Administrador:** administra usuarios, estudiantes, productos y la configuración del sistema.
- **Estudiante:** entidad del dominio; no requiere inicio de sesión.

## Ejecución y alcance

- El sitio se abre directamente con `file://`, sin servidor, bundlers ni dependencias instaladas.
- La demo interactiva (login con roles, sesión y datos simulados) está pensada para **navegadores Chromium** (Chrome, Edge, Brave). En Firefox/LibreWolf el almacenamiento local se aísla por archivo y la sesión no cruza entre páginas.
- Bootstrap se carga por CDN solo por requisito formal de la rúbrica; el diseño propio es el sistema `ce-*`.
