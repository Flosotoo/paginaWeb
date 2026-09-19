// Dominio de reservas: reservar materiales (HU23), mis reservas (HU24),
// preparar reservas (HU35) y entregar reservas (HU36). Sobre la base simulada.
(function () {
  if (!window.Datos || !window.Sesion || !window.Validacion) return;
  const V = window.Validacion;
  const sesion = Sesion.actual();

  // ------------------------------------------------------------------
  // Apoderado: reservar materiales (HU23) con carrito y control de saldo.
  // El total de la reserva no puede superar el saldo del pupilo elegido.
  // ------------------------------------------------------------------
  const aviso = document.getElementById("reserva-aviso");
  const listaPupilos = document.getElementById("lista-pupilos");
  const pesos = (monto) => `$${Math.round(monto).toLocaleString("es-CL")}`;
  const escapar = (texto) =>
    String(texto == null ? "" : texto).replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );

  if (listaPupilos && sesion) {
    const carrito = [];
    let pupilo = null;

    const elItems = document.getElementById("carrito-items");
    const elPupilo = document.getElementById("carrito-pupilo");
    const elSaldo = document.getElementById("carrito-saldo");
    const elTotal = document.getElementById("carrito-total");
    const elRestante = document.getElementById("carrito-restante");
    const confirmar = document.getElementById("btnConfirmarReserva");
    const lista = document.querySelector("[data-filtro-lista]");

    const totalCarrito = () =>
      carrito.reduce((suma, item) => suma + item.precio * item.cantidad, 0);
    const avisar = (mensaje, tipo) => V.mostrarAviso(aviso, mensaje, tipo);

    // Paso 1: los pupilos asociados al apoderado, con su saldo.
    const pupilos = Datos.estudiantes()
      .filter((e) => String(e.apoderado).toLowerCase() === String(sesion.correo).toLowerCase())
      .map((e) => {
        const nombre = `${e.nombre} ${e.apellido}`;
        return { id: e.id, nombre, curso: e.curso, saldo: Datos.saldoDe(nombre) };
      });

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
      : `<div class="col-12"><p class="alert alert-info mb-0">No tienes pupilos asociados. Pide al Centro General de Padres que los vincule a tu cuenta.</p></div>`;

    listaPupilos.addEventListener("change", (evento) => {
      pupilo = pupilos.find((p) => p.id === evento.target.value) || null;
      aviso.hidden = true;
      if (pupilo && totalCarrito() > pupilo.saldo) {
        avisar(
          `El carrito (${pesos(totalCarrito())}) supera el saldo de ${pupilo.nombre}. Quita materiales para continuar.`,
          "error",
        );
      }
      pintar();
    });

    function pintar() {
      const total = totalCarrito();
      const saldo = pupilo ? pupilo.saldo : 0;
      const restante = saldo - total;

      elPupilo.textContent = pupilo
        ? `Para ${pupilo.nombre} · ${pupilo.curso}`
        : "Aún no eliges un pupilo.";
      elSaldo.textContent = pesos(saldo);
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
        avisar("Primero elige para qué pupilo es la reserva.", "error");
        listaPupilos.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      const item = carrito.find((i) => i.codigo === codigo);
      const cantidad = item ? item.cantidad + 1 : 1;
      if (cantidad > producto.stock) {
        avisar(`Solo quedan ${producto.stock} unidad(es) de ${producto.nombre}.`, "error");
        return;
      }
      if (totalCarrito() + producto.precio > pupilo.saldo) {
        avisar(
          `No se puede agregar ${producto.nombre}: el total superaría el saldo de ${pupilo.nombre} (${pesos(pupilo.saldo)}).`,
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
      pintar();
      aviso.innerHTML = `Reserva registrada (${codigos.join(", ")}) en estado Pendiente. Retira hasta el ${escapar(
        fecha(limite),
      )}. <a class="alert-link" href="mis-reservas.html">Ver mis reservas</a>.`;
      aviso.className = "alert alert-success mt-3 mb-0";
      aviso.hidden = false;
    });

    pintar();
  }

  // HU24: listado de reservas del apoderado.
  const contenedor = document.getElementById("lista-reservas");
  if (contenedor && sesion) {
    const reservas = Datos.reservasDe(sesion.correo).slice().reverse();
    contenedor.innerHTML = reservas.length
      ? reservas
          .map(
            (r) => `
        <article class="card card-body mb-4">
          <h2 class="h3 mb-2">${r.codigo} · ${r.estado}</h2>
          <p>${r.producto} · ${r.cantidad} unidad(es) · Creada el ${r.fecha}</p>
          <p>Retiro disponible hasta el ${r.fechaLimite}.</p>
        </article>`,
          )
          .join("")
      : '<p>No tienes reservas registradas. <a href="reservar-materiales.html">Reservar materiales</a>.</p>';
  }

  // ------------------------------------------------------------------
  // Librería: preparar reservas (HU35)
  // ------------------------------------------------------------------
  const preparar = document.getElementById("lista-preparar-reservas");
  if (preparar) {
    const pintarPreparar = () => {
      const pendientes = Datos.reservas().filter(
        (r) => r.estado === "Pendiente",
      );
      preparar.innerHTML = pendientes.length
        ? pendientes
            .map(
              (r) => `
          <article class="card card-body mb-4">
            <h2 class="h3 mb-2">${r.codigo}</h2>
            <p>${r.pupilo} · ${r.producto} · ${r.cantidad} unidad(es) · Creada el ${r.fecha}</p>
            <button class="btn btn-primary" type="button" data-preparar="${r.codigo}">
              Marcar como lista para retirar
            </button>
          </article>`,
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
  // Librería: entregar reservas (HU36)
  // ------------------------------------------------------------------
  const entregar = document.getElementById("lista-entregar-reservas");
  if (entregar) {
    const pintarEntregar = () => {
      const listas = Datos.reservas().filter(
        (r) => r.estado === "Lista para retiro",
      );
      entregar.innerHTML = listas.length
        ? listas
            .map(
              (r) => `
          <article class="card card-body mb-4">
            <h2 class="h3 mb-2">${r.codigo}</h2>
            <p>${r.pupilo} · ${r.producto} · ${r.cantidad} unidad(es)</p>
            <button class="btn btn-primary" type="button" data-entregar="${r.codigo}">
              Confirmar entrega
            </button>
          </article>`,
            )
            .join("")
        : "<p>No hay reservas listas para retirar.</p>";
    };
    entregar.addEventListener("click", (evento) => {
      const boton = evento.target.closest("[data-entregar]");
      if (!boton) return;
      Datos.actualizarReserva(boton.dataset.entregar, {
        estado: "Entregada",
        fechaEntrega: new Date().toISOString().slice(0, 10),
      });
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
        `Reserva ${reserva.codigo} de ${reserva.pupilo} (estado: ${reserva.estado}).`,
        "info",
      );
    });
  }
})();
