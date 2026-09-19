// Operación de librería: consulta de saldo (HU51), registrar compra (HU52),
// rechazo por saldo insuficiente (HU53), stock (HU31/HU32) y ventas del día
// (HU37). El estudiante se elige con el buscador compartido (buscador.js).
(function () {
  if (!window.Datos) return;
  const V = window.Validacion;
  const sesion = window.Sesion ? Sesion.actual() : null;

  const formato = (valor) => `$${Number(valor).toLocaleString("es-CL")}`;
  const hoy = () => new Date().toISOString().slice(0, 10);
  const hora = () =>
    new Date().toLocaleTimeString("es-CL", {
      hour: "2-digit",
      minute: "2-digit",
    });
  const escapar = (texto) =>
    String(texto == null ? "" : texto).replace(
      /[&<>"']/g,
      (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
          c
        ],
    );

  // Alumnos con su identificador y saldo disponible.
  function alumnos() {
    return Datos.estudiantes().map((e) => {
      const nombreCompleto = `${e.nombre} ${e.apellido}`;
      return {
        id: e.id,
        rut: e.rut || e.id,
        nombre: e.nombre,
        apellido: e.apellido,
        curso: e.curso,
        nombreCompleto,
        saldo: Datos.saldoDe(nombreCompleto),
      };
    });
  }

  // Buscador de estudiantes reutilizable (nombre, curso o RUT/identificador).
  function montarBuscadorEstudiante(input, contenedor, alElegir) {
    if (!window.Buscador || !input || !contenedor) return null;

    const elegir = (alumno) => {
      input.value = alumno.nombreCompleto;
      contenedor.hidden = true;
      contenedor.innerHTML = "";
      alElegir(alumno);
    };

    contenedor.addEventListener("click", (evento) => {
      const boton = evento.target.closest("[data-alumno]");
      if (!boton) return;
      const alumno = alumnos().find((a) => a.id === boton.dataset.alumno);
      if (alumno) elegir(alumno);
    });

    return window.Buscador.crear({
      input,
      contenedor,
      minLength: 1,
      items: alumnos,
      keys: (a) => [a.nombreCompleto, a.nombre, a.apellido, a.curso, a.rut],
      render: (lista, consulta) => {
        if (String(consulta).trim() === "") {
          contenedor.hidden = true;
          contenedor.innerHTML = "";
          return;
        }
        contenedor.hidden = false;
        contenedor.innerHTML = lista.length
          ? lista
              .map(
                (a) => `
            <button type="button" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center gap-3" data-alumno="${a.id}">
              <span>
                <span class="fw-bold">${escapar(a.nombreCompleto)}</span>
                <span class="small text-body-secondary d-block">${escapar(a.curso)} · ${escapar(a.rut)}</span>
              </span>
              <span class="font-monospace">${formato(a.saldo)}</span>
            </button>`,
              )
              .join("")
          : `<span class="list-group-item text-body-secondary">Sin resultados.</span>`;
      },
    });
  }

  // HU51: consulta de saldo de un estudiante.
  const formSaldo = document.getElementById("formConsultaSaldo");
  if (formSaldo) {
    const input = document.getElementById("estudiante");
    const contenedor = document.getElementById("resultados-estudiante");
    const resultado = document.getElementById("saldo-resultado");
    let elegido = null;

    const mostrarSaldo = (alumno) => {
      resultado.innerHTML = `
        <article class="card card-body mb-4">
          <h2 class="h3 mb-1">${escapar(alumno.nombreCompleto)}</h2>
          <p class="mb-1">${escapar(alumno.curso)} · ${escapar(alumno.rut)}</p>
          <p class="mb-0">Saldo disponible: <strong>${formato(alumno.saldo)}</strong></p>
        </article>`;
    };

    montarBuscadorEstudiante(input, contenedor, (alumno) => {
      elegido = alumno;
      mostrarSaldo(alumno);
    });

    formSaldo.addEventListener("submit", (evento) => {
      evento.preventDefault();
      const alumno =
        elegido ||
        alumnos().find(
          (a) =>
            window.Edusaldo.normalizar(a.nombreCompleto) ===
            window.Edusaldo.normalizar(input.value),
        );
      if (!alumno) {
        resultado.innerHTML =
          '<p class="text-body-secondary">No encontramos un estudiante con ese nombre o identificador.</p>';
        return;
      }
      elegido = alumno;
      mostrarSaldo(alumno);
    });
  }

  // HU52 + HU53: registrar compra descontando saldo y stock.
  const formCompra = document.getElementById("formCompra");
  if (formCompra) {
    const estudiante = document.getElementById("compra-estudiante");
    const resultados = document.getElementById("resultados-estudiante");
    const resumen = document.getElementById("compra-estudiante-resumen");
    const select = document.getElementById("compra-producto");
    const cantidad = document.getElementById("compra-cantidad");
    const totalEl = document.getElementById("compra-total");
    const saldoEl = document.getElementById("compra-saldo");
    const aviso = document.getElementById("compra-aviso");
    let elegido = null;

    select.replaceChildren(new Option("Selecciona un producto", ""));
    Datos.productos().forEach((p) =>
      select.add(new Option(`${p.nombre} · ${formato(p.precio)}`, p.codigo)),
    );

    const productoActual = () => Datos.buscarProducto(select.value);
    const calcularTotal = () => {
      const p = productoActual();
      return p ? p.precio * Number(cantidad.value || 0) : 0;
    };

    function refrescar() {
      if (totalEl) totalEl.textContent = formato(calcularTotal());
      if (saldoEl)
        saldoEl.textContent = formato(elegido ? elegido.saldo : 0);
    }

    montarBuscadorEstudiante(estudiante, resultados, (alumno) => {
      elegido = alumno;
      if (resumen) {
        resumen.textContent = `${alumno.nombreCompleto} · ${alumno.curso} · ${alumno.rut} · saldo ${formato(alumno.saldo)}`;
      }
      refrescar();
    });

    select.addEventListener("change", refrescar);
    cantidad.addEventListener("input", refrescar);
    refrescar();

    if (V) {
      V.preparar(formCompra, {
        alValidar: () => {
          if (!elegido) {
            V.mostrarAviso(
              aviso,
              "Selecciona un estudiante de la lista de resultados.",
              "error",
            );
            return;
          }
          const producto = productoActual();
          const unidades = Number(cantidad.value);
          const total = calcularTotal();
          const saldo = elegido.saldo;

          if (unidades > producto.stock) {
            V.mostrarAviso(
              aviso,
              `Stock insuficiente: quedan ${producto.stock} unidades de ${producto.nombre}.`,
              "error",
            );
            return;
          }

          // HU53: saldo insuficiente con desglose.
          if (total > saldo) {
            const diferencia = total - saldo;
            V.mostrarAviso(
              aviso,
              `Compra rechazada. Total ${formato(total)}, saldo disponible ${formato(
                saldo,
              )} y monto faltante ${formato(diferencia)}.`,
              "error",
            );
            return;
          }

          Datos.descontarStock(producto.codigo, unidades);
          Datos.ajustarSaldo(elegido.nombreCompleto, -total);
          Datos.agregarMovimiento({
            correo: Datos.apoderadoDe(elegido.nombreCompleto),
            pupilo: elegido.nombreCompleto,
            fecha: hoy(),
            tipo: "Compra",
            detalle: `Compra en la librería escolar · ${producto.nombre} x${unidades}`,
            monto: -total,
            responsable: sesion ? sesion.correo : "",
          });
          Datos.agregarVenta({
            fecha: hoy(),
            hora: hora(),
            pupilo: elegido.nombreCompleto,
            detalle: `${producto.nombre} x${unidades}`,
            monto: total,
            responsable: sesion ? sesion.correo : "",
          });

          elegido.saldo = Datos.saldoDe(elegido.nombreCompleto);
          if (resumen) {
            resumen.textContent = `${elegido.nombreCompleto} · ${elegido.curso} · ${elegido.rut} · saldo ${formato(elegido.saldo)}`;
          }
          V.mostrarAviso(
            aviso,
            `Compra registrada por ${formato(total)}. Nuevo saldo disponible de ${
              elegido.nombreCompleto
            }: ${formato(elegido.saldo)}.`,
            "ok",
          );
          refrescar();
        },
      });
    }
  }

  // HU31/HU32: stock y productos que requieren reposición.
  const contenedorStock = document.getElementById("lista-stock");
  if (contenedorStock) {
    const criticos = Datos.productos().filter(
      (p) => p.stockCritico != null && p.stock <= p.stockCritico,
    );
    contenedorStock.innerHTML = criticos.length
      ? criticos
          .map(
            (p) => `
        <article class="card card-body mb-4">
          <h2 class="h3 mb-2">${p.codigo} · ${p.nombre}</h2>
          <p>Disponible: ${p.stock} unidades · Stock crítico: ${p.stockCritico}</p>
          <p><span class="badge rounded-pill">Reposición requerida</span></p>
        </article>`,
          )
          .join("")
      : "<p>No hay productos bajo el umbral crítico.</p>";
  }

  // HU37: ventas del día.
  const contenedorVentas = document.getElementById("lista-ventas");
  if (contenedorVentas) {
    const ventas = Datos.ventas().slice().reverse();
    const totalEl = document.getElementById("total-ventas");
    if (totalEl) {
      totalEl.textContent = formato(
        ventas.reduce((suma, v) => suma + v.monto, 0),
      );
    }
    contenedorVentas.innerHTML = ventas.length
      ? ventas
          .map(
            (v) => `
        <article class="card card-body mb-4">
          <h2 class="h3 mb-2">${v.hora} · ${v.pupilo}</h2>
          <p>${v.detalle} · ${formato(v.monto)} · Responsable: ${v.responsable}</p>
        </article>`,
          )
          .join("")
      : "<p>No hay ventas registradas el día de hoy.</p>";
  }
})();
