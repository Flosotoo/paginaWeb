// Dominio de reservas: reservar materiales (HU23), mis reservas (HU24),
// preparar reservas (HU35) y entregar reservas (HU36). Sobre la base simulada.
(function () {
  if (!window.Datos || !window.Sesion || !window.Validacion) return;
  const V = window.Validacion;
  const sesion = Sesion.actual();

  // ------------------------------------------------------------------
  // Apoderado: reservar materiales (HU23) con carrito y control de saldo.
  // Una reserva aparta materiales pero no mueve el saldo: el descuento ocurre
  // como compra al entregarla. Por eso el tope es el saldo disponible menos lo
  // ya comprometido en reservas del alumno que aún no se retiran.
  // ------------------------------------------------------------------
  const aviso = document.getElementById("reserva-aviso");
  const listaPupilos = document.getElementById("lista-pupilos");
  const pesos = (monto) => `$${Math.round(monto).toLocaleString("es-CL")}`;
  const escapar = (texto) =>
    String(texto == null ? "" : texto).replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );
  const normalizar = window.Edusaldo.normalizar;
  const fechaCorta = (texto) => {
    const [a, m, d] = String(texto).split("-").map(Number);
    return new Date(a, m - 1, d).toLocaleDateString("es-CL");
  };
  const SIN_RETIRAR = ["Pendiente", "Lista para retiro"];

  // Valor de una reserva. Las antiguas no guardaban el monto: se calcula.
  function montoReserva(r) {
    if (r.monto != null) return r.monto;
    const producto = Datos.productos().find((p) => p.nombre === r.producto);
    return producto ? producto.precio * r.cantidad : 0;
  }

  if (listaPupilos && sesion) {
    const carrito = [];
    let pupilo = null;

    const elItems = document.getElementById("carrito-items");
    const elPupilo = document.getElementById("carrito-pupilo");
    const elSaldo = document.getElementById("carrito-saldo");
    const elComprometido = document.getElementById("carrito-comprometido");
    const elTotal = document.getElementById("carrito-total");
    const elRestante = document.getElementById("carrito-restante");
    const confirmar = document.getElementById("btnConfirmarReserva");
    const lista = document.querySelector("[data-filtro-lista]");

    const totalCarrito = () =>
      carrito.reduce((suma, item) => suma + item.precio * item.cantidad, 0);
    const avisar = (mensaje, tipo) => V.mostrarAviso(aviso, mensaje, tipo);

    // Saldo ya apartado en reservas del alumno que aún no se retiran.
    const comprometidoDe = (nombre) =>
      Datos.reservas()
        .filter((r) => SIN_RETIRAR.includes(r.estado) && normalizar(r.pupilo) === normalizar(nombre))
        .reduce((suma, r) => suma + montoReserva(r), 0);

    // Paso 1: los alumnos asociados al apoderado, con su saldo disponible.
    const pupilos = Datos.alumnosDe(sesion.correo).map((e) => ({
      id: e.id,
      nombre: e.nombreCompleto,
      curso: e.curso,
      saldo: Datos.saldoDe(e.nombreCompleto),
      comprometido: comprometidoDe(e.nombreCompleto),
    }));
    // Lo que el alumno todavía puede reservar.
    const tope = () => (pupilo ? pupilo.saldo - pupilo.comprometido : 0);

    listaPupilos.innerHTML = pupilos.length
      ? pupilos
          .map(
            (p) => `
        <div class="col">
          <input class="btn-check" type="radio" name="pupilo" id="pupilo-${p.id}" value="${p.id}" autocomplete="off" />
          <label class="btn btn-outline-primary w-100 h-100 text-start d-flex flex-column align-items-start p-3" for="pupilo-${p.id}">
            <span class="fw-bold">${escapar(p.nombre)}</span>
            <span class="small">${escapar(p.curso)}</span>
            <span class="small mt-2">Saldo disponible: <strong class="font-monospace">${pesos(p.saldo)}</strong></span>
          </label>
        </div>`,
          )
          .join("")
      : `<div class="col-12"><p class="alert alert-info mb-0">Aún no tienes alumnos asociados. El Centro de Padres los vincula a tu cuenta con la nómina del colegio.</p></div>`;

    listaPupilos.addEventListener("change", (evento) => {
      pupilo = pupilos.find((p) => p.id === evento.target.value) || null;
      aviso.hidden = true;
      if (pupilo && totalCarrito() > tope()) {
        avisar(
          `La reserva (${pesos(totalCarrito())}) supera el saldo que ${pupilo.nombre} tiene disponible para reservar (${pesos(tope())}). Quita materiales para continuar.`,
          "error",
        );
      }
      pintar();
    });

    function pintar() {
      const total = totalCarrito();
      const saldo = pupilo ? pupilo.saldo : 0;
      const comprometido = pupilo ? pupilo.comprometido : 0;
      const restante = saldo - comprometido - total;

      elPupilo.textContent = pupilo
        ? `Para ${pupilo.nombre} · ${pupilo.curso}`
        : "Aún no eliges un alumno.";
      elSaldo.textContent = pesos(saldo);
      elComprometido.textContent = `−${pesos(comprometido)}`;
      document.querySelectorAll("[data-comprometido]").forEach((el) => {
        el.hidden = comprometido === 0;
      });
      elTotal.textContent = pesos(total);
      elRestante.textContent = pesos(restante);
      elRestante.classList.toggle("text-danger", restante < 0);

      elItems.innerHTML = carrito.length
        ? carrito
            .map(
              (item) => `
          <li class="list-group-item">
            <div class="d-flex justify-content-between gap-2">
              <span class="fw-bold">${escapar(item.nombre)}</span>
              <span class="font-monospace">${pesos(item.precio * item.cantidad)}</span>
            </div>
            <div class="d-flex align-items-center justify-content-between gap-2 mt-2">
              <div class="input-group input-group-sm w-auto" role="group" aria-label="Cantidad de ${escapar(item.nombre)}">
                <button class="btn btn-outline-primary" type="button" data-restar="${item.codigo}" aria-label="Quitar una unidad">−</button>
                <span class="input-group-text font-monospace bg-body">${item.cantidad}</span>
                <button class="btn btn-outline-primary" type="button" data-sumar="${item.codigo}" aria-label="Agregar una unidad">+</button>
              </div>
              <span class="small text-body-secondary">${pesos(item.precio)} c/u</span>
              <button class="btn btn-link btn-sm text-danger" type="button" data-quitar="${item.codigo}">Quitar</button>
            </div>
          </li>`,
            )
            .join("")
        : `<li class="list-group-item text-body-secondary py-4 text-center">Aún no has agregado materiales.</li>`;

      confirmar.disabled = !pupilo || !carrito.length || restante < 0;
    }

    // Suma una unidad solo si hay stock y el total no supera el saldo.
    function sumar(codigo) {
      const producto = Datos.buscarProducto(codigo);
      if (!producto) return;
      if (!pupilo) {
        avisar("Primero elige para qué alumno es la reserva.", "error");
        listaPupilos.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      const item = carrito.find((i) => i.codigo === codigo);
      const cantidad = item ? item.cantidad + 1 : 1;
      if (cantidad > producto.stock) {
        avisar(`Solo quedan ${producto.stock} unidad(es) de ${producto.nombre}.`, "error");
        return;
      }
      if (totalCarrito() + producto.precio > tope()) {
        avisar(
          `No se puede agregar ${producto.nombre}: la reserva superaría el saldo disponible para reservar de ${pupilo.nombre} (${pesos(tope())}).`,
          "error",
        );
        return;
      }
      if (item) item.cantidad = cantidad;
      else carrito.push({ codigo, nombre: producto.nombre, precio: producto.precio, cantidad: 1 });
      aviso.hidden = true;
      pintar();
    }

    function restar(codigo, todo) {
      const indice = carrito.findIndex((i) => i.codigo === codigo);
      if (indice < 0) return;
      carrito[indice].cantidad -= 1;
      if (todo || carrito[indice].cantidad < 1) carrito.splice(indice, 1);
      aviso.hidden = true;
      pintar();
    }

    if (lista) {
      lista.addEventListener("click", (evento) => {
        const boton = evento.target.closest("[data-agregar]");
        if (boton && !boton.disabled) sumar(boton.dataset.agregar);
      });
    }

    elItems.addEventListener("click", (evento) => {
      const boton = evento.target.closest("button");
      if (!boton) return;
      if (boton.dataset.sumar) sumar(boton.dataset.sumar);
      if (boton.dataset.restar) restar(boton.dataset.restar, false);
      if (boton.dataset.quitar) restar(boton.dataset.quitar, true);
    });

    // Una reserva por material, en estado Pendiente y con 7 días para retirar.
    confirmar.addEventListener("click", () => {
      if (confirmar.disabled) return;
      const hoy = new Date();
      const limite = new Date(hoy);
      limite.setDate(hoy.getDate() + 7);
      const fecha = (d) => d.toISOString().slice(0, 10);

      const sinStock = carrito.filter((item) => {
        const producto = Datos.buscarProducto(item.codigo);
        return !producto || producto.stock < item.cantidad;
      });
      if (sinStock.length) {
        avisar(`Ya no hay stock suficiente de: ${sinStock.map((i) => i.nombre).join(", ")}.`, "error");
        return;
      }

      const valor = totalCarrito();
      const codigos = carrito.map((item) => {
        Datos.descontarStock(item.codigo, item.cantidad);
        const codigo = Datos.siguienteCodigoReserva();
        Datos.agregarReserva({
          codigo,
          correo: sesion.correo,
          pupilo: pupilo.nombre,
          producto: item.nombre,
          cantidad: item.cantidad,
          monto: item.precio * item.cantidad,
          fecha: fecha(hoy),
          fechaLimite: fecha(limite),
          estado: "Pendiente",
        });
        return codigo;
      });

      carrito.length = 0;
      pupilo.comprometido += valor;
      pintar();
      aviso.innerHTML = `<strong>Reserva confirmada</strong> (${codigos.join(", ")}) por ${pesos(valor)}.
        Esto todavía no es una entrega: la librería escolar preparará los materiales y
        podrás retirarlos hasta el ${escapar(fechaCorta(fecha(limite)))}. Al retirarlos se
        registrará la compra y se descontará el saldo.
        <a class="alert-link" href="mis-reservas.html">Ver mis reservas</a>.`;
      aviso.className = "alert alert-success mt-3 mb-0";
      aviso.hidden = false;
    });

    pintar();
  }

  // HU24: listado de reservas del apoderado.
  const ESTADOS = {
    Pendiente: {
      clase: "rounded-pill",
      texto: "La librería escolar aún no prepara los materiales.",
    },
    "Lista para retiro": {
      clase: "text-bg-success",
      texto: "Los materiales están listos. Retíralos en la librería escolar.",
    },
    Entregada: {
      clase: "text-bg-secondary",
      texto: "Materiales retirados. La compra ya se descontó del saldo.",
    },
  };
  // Nombre del alumno tal como está en la nómina (los datos antiguos lo
  // guardaban normalizado, sin tildes ni mayúsculas).
  const nombreAlumno = (texto) => {
    const e = Datos.estudiantes().find(
      (x) => normalizar(`${x.nombre} ${x.apellido}`) === normalizar(texto),
    );
    return e ? `${e.nombre} ${e.apellido}` : texto;
  };
  const tarjetaReserva = (r, extra) => {
    const estado = ESTADOS[r.estado] || { clase: "rounded-pill", texto: "" };
    return `
        <article class="card card-body mb-4">
          <div class="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
            <h2 class="h3 mb-0"><span class="font-monospace">${escapar(r.codigo)}</span> · ${escapar(r.producto)}</h2>
            <span class="badge ${estado.clase}">${escapar(r.estado)}</span>
          </div>
          <p class="mb-1">Alumno: ${escapar(nombreAlumno(r.pupilo))} · ${r.cantidad} unidad(es) · Valor <strong class="font-monospace">${pesos(
            montoReserva(r),
          )}</strong></p>
          <p class="small text-body-secondary mb-0">Reservada el ${fechaCorta(r.fecha)} · retiro hasta el ${fechaCorta(
            r.fechaLimite,
          )}. ${estado.texto}</p>
          ${extra || ""}
        </article>`;
  };

  const contenedor = document.getElementById("lista-reservas");
  if (contenedor && sesion) {
    const reservas = Datos.reservasDe(sesion.correo).slice().reverse();
    contenedor.innerHTML = reservas.length
      ? reservas.map((r) => tarjetaReserva(r)).join("")
      : '<p>No tienes reservas registradas. <a href="reservar-materiales.html">Reservar materiales</a>.</p>';
  }

  // ------------------------------------------------------------------
  // Librería: preparar reservas (HU35)
  // ------------------------------------------------------------------
  const preparar = document.getElementById("lista-preparar-reservas");
  if (preparar) {
    const pintarPreparar = () => {
      const pendientes = Datos.reservas().filter((r) => r.estado === "Pendiente");
      preparar.innerHTML = pendientes.length
        ? pendientes
            .map((r) =>
              tarjetaReserva(
                r,
                `<button class="btn btn-primary mt-3 align-self-start" type="button" data-preparar="${escapar(r.codigo)}">Marcar como lista para retiro</button>`,
              ),
            )
            .join("")
        : "<p>No hay reservas pendientes.</p>";
    };
    preparar.addEventListener("click", (evento) => {
      const boton = evento.target.closest("[data-preparar]");
      if (!boton) return;
      Datos.actualizarReserva(boton.dataset.preparar, {
        estado: "Lista para retiro",
        fechaPreparacion: new Date().toISOString().slice(0, 10),
        responsable: sesion ? sesion.correo : "",
      });
      pintarPreparar();
    });
    pintarPreparar();
  }

  // ------------------------------------------------------------------
  // Librería: entregar reservas (HU36). La entrega es la COMPRA: descuenta
  // el saldo del alumno y queda como movimiento y como venta del día.
  // ------------------------------------------------------------------
  const entregar = document.getElementById("lista-entregar-reservas");
  if (entregar) {
    const avisoEntregas = document.getElementById("entregas-aviso");
    const pintarEntregar = () => {
      const listas = Datos.reservas().filter((r) => r.estado === "Lista para retiro");
      entregar.innerHTML = listas.length
        ? listas
            .map((r) =>
              tarjetaReserva(
                r,
                `<p class="small mt-2 mb-0">Saldo disponible del alumno: <strong class="font-monospace">${pesos(
                  Datos.saldoDe(r.pupilo),
                )}</strong></p>
                <button class="btn btn-primary mt-3 align-self-start" type="button" data-entregar="${escapar(r.codigo)}">Entregar y registrar compra</button>`,
              ),
            )
            .join("")
        : "<p>No hay reservas listas para retirar.</p>";
    };
    entregar.addEventListener("click", (evento) => {
      const boton = evento.target.closest("[data-entregar]");
      if (!boton) return;
      const reserva = Datos.buscarReserva(boton.dataset.entregar);
      if (!reserva) return;
      const monto = montoReserva(reserva);
      const saldo = Datos.saldoDe(reserva.pupilo);
      if (monto > saldo) {
        V.mostrarAviso(
          avisoEntregas,
          `No se puede entregar ${reserva.codigo}: el valor es ${pesos(monto)} y ${nombreAlumno(reserva.pupilo)} tiene ${pesos(
            saldo,
          )} de saldo disponible.`,
          "error",
        );
        return;
      }
      const ahora = new Date();
      const fecha = ahora.toISOString().slice(0, 10);
      Datos.ajustarSaldo(reserva.pupilo, -monto);
      Datos.agregarMovimiento({
        correo: reserva.correo,
        pupilo: reserva.pupilo,
        fecha,
        tipo: "Compra",
        detalle: `Retiro de reserva ${reserva.codigo} · ${reserva.producto} x${reserva.cantidad}`,
        monto: -monto,
      });
      Datos.agregarVenta({
        fecha,
        hora: ahora.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }),
        pupilo: reserva.pupilo,
        detalle: `Reserva ${reserva.codigo} · ${reserva.producto} x${reserva.cantidad}`,
        monto,
        responsable: sesion ? sesion.correo : "",
      });
      Datos.actualizarReserva(reserva.codigo, {
        estado: "Entregada",
        monto,
        fechaEntrega: fecha,
      });
      V.mostrarAviso(
        avisoEntregas,
        `Reserva ${reserva.codigo} entregada. Se registró la compra por ${pesos(monto)}; nuevo saldo de ${nombreAlumno(reserva.pupilo)}: ${pesos(Datos.saldoDe(reserva.pupilo))}.`,
        "ok",
      );
      pintarEntregar();
    });
    pintarEntregar();
  }

  const formEntrega = document.getElementById("formEntrega");
  if (formEntrega) {
    const codigo = document.getElementById("codigo");
    const avisoEntrega = document.getElementById("entrega-aviso");
    formEntrega.addEventListener("submit", (evento) => {
      evento.preventDefault();
      const reserva = Datos.buscarReserva(codigo.value.trim());
      if (!reserva) {
        V.mostrarAviso(
          avisoEntrega,
          "No existe una reserva con ese código.",
          "error",
        );
        return;
      }
      V.mostrarAviso(
        avisoEntrega,
        `Reserva ${reserva.codigo} · alumno ${nombreAlumno(reserva.pupilo)} · ${reserva.producto} x${reserva.cantidad} · valor ${pesos(montoReserva(reserva))} · estado: ${reserva.estado}.`,
        "info",
      );
    });
  }
})();
