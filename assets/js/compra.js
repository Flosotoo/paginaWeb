// Operación de librería: consulta de saldo (HU51), registrar compra (HU52),
// rechazo por saldo insuficiente (HU53), stock (HU31/HU32) y ventas del día
// (HU37). Todo sobre la base simulada.
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

  // HU51: consulta de saldo de un estudiante.
  const formSaldo = document.getElementById("formConsultaSaldo");
  if (formSaldo) {
    const input = document.getElementById("estudiante");
    const resultado = document.getElementById("saldo-resultado");
    formSaldo.addEventListener("submit", (evento) => {
      evento.preventDefault();
      const texto = input.value.trim();
      const existe = Datos.pupilos().some(
        (p) => p === window.Edusaldo.normalizar(texto),
      );
      if (!texto || !existe) {
        resultado.innerHTML =
          "<p>No encontramos un estudiante con ese nombre o identificador.</p>";
        return;
      }
      resultado.innerHTML = `
        <article class="card card-body mb-4">
          <h2 class="h3 mb-2">${texto}</h2>
          <p>Saldo disponible: <strong>${formato(
            Datos.saldoDe(texto),
          )}</strong></p>
        </article>`;
    });
  }

  // HU52 + HU53: registrar compra descontando saldo y stock.
  const formCompra = document.getElementById("formCompra");
  if (formCompra) {
    const estudiante = document.getElementById("compra-estudiante");
    const select = document.getElementById("compra-producto");
    const cantidad = document.getElementById("compra-cantidad");
    const totalEl = document.getElementById("compra-total");
    const saldoEl = document.getElementById("compra-saldo");
    const aviso = document.getElementById("compra-aviso");

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
        saldoEl.textContent = formato(Datos.saldoDe(estudiante.value));
    }

    select.addEventListener("change", refrescar);
    cantidad.addEventListener("input", refrescar);
    estudiante.addEventListener("input", refrescar);
    refrescar();

    if (V) {
      V.preparar(formCompra, {
        alValidar: () => {
          const producto = productoActual();
          const unidades = Number(cantidad.value);
          const total = calcularTotal();
          const saldo = Datos.saldoDe(estudiante.value);

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
          Datos.ajustarSaldo(estudiante.value, -total);
          // El movimiento es del alumno: se asocia a su apoderado para que
          // lo vea en "Movimientos"; el vendedor queda como responsable.
          Datos.agregarMovimiento({
            correo: Datos.apoderadoDe(estudiante.value),
            pupilo: estudiante.value,
            fecha: hoy(),
            tipo: "Compra",
            detalle: `Compra en la librería escolar · ${producto.nombre} x${unidades}`,
            monto: -total,
            responsable: sesion ? sesion.correo : "",
          });
          Datos.agregarVenta({
            fecha: hoy(),
            hora: hora(),
            pupilo: estudiante.value,
            detalle: `${producto.nombre} x${unidades}`,
            monto: total,
            responsable: sesion ? sesion.correo : "",
          });

          V.mostrarAviso(
            aviso,
            `Compra registrada por ${formato(total)}. Nuevo saldo disponible de ${
              estudiante.value
            }: ${formato(Datos.saldoDe(estudiante.value))}.`,
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
