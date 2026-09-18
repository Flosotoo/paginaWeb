// Dominio de reservas: reservar materiales (HU23), mis reservas (HU24),
// preparar reservas (HU35) y entregar reservas (HU36). Sobre la base simulada.
(function () {
  if (!window.Datos || !window.Sesion || !window.Validacion) return;
  const V = window.Validacion;
  const sesion = Sesion.actual();

  // ------------------------------------------------------------------
  // Apoderado: reservar materiales
  // ------------------------------------------------------------------
  const aviso = document.getElementById("reserva-aviso");
  const lista = document.querySelector("[data-filtro-lista]");
  const items = [];

  function agregarItem(codigo) {
    const producto = Datos.buscarProducto(codigo);
    if (!producto) return;
    const existente = items.find((i) => i.codigo === codigo);
    if (existente) existente.cantidad += 1;
    else items.push({ codigo, nombre: producto.nombre, cantidad: 1 });
    if (aviso) {
      V.mostrarAviso(
        aviso,
        `${producto.nombre} agregado. Materiales distintos en la reserva: ${items.length}.`,
        "info",
      );
    }
  }

  if (lista) {
    lista.addEventListener("click", (evento) => {
      const boton = evento.target.closest("[data-agregar]");
      if (!boton || boton.disabled) return;
      agregarItem(boton.dataset.agregar);
    });
  }

  const form = document.getElementById("formReserva");
  if (form) {
    const pupilo = document.getElementById("hijoReserva");
    const cantidad = document.getElementById("cantidad");

    V.preparar(form, {
      alValidar: () => {
        if (!items.length) {
          V.mostrarAviso(
            aviso,
            "Agrega al menos un material con el botón «Añadir a la reserva».",
            "error",
          );
          return;
        }
        const nombrePupilo = pupilo.options[pupilo.selectedIndex].text
          .split(",")[0]
          .trim();
        const unidades = Number(cantidad.value) || 1;
        let registradas = 0;

        items.forEach((item) => {
          const producto = Datos.buscarProducto(item.codigo);
          const total = item.cantidad * unidades;
          if (!producto || producto.stock < total) return;
          Datos.descontarStock(item.codigo, total);
          Datos.agregarReserva({
            codigo: Datos.siguienteCodigoReserva(),
            correo: sesion.correo,
            pupilo: nombrePupilo,
            producto: item.nombre,
            cantidad: total,
            fecha: new Date().toISOString().slice(0, 10),
            fechaLimite: "2026-09-30",
            estado: "Pendiente",
          });
          registradas += 1;
        });

        if (!registradas) {
          V.mostrarAviso(
            aviso,
            "No hay stock suficiente para los materiales seleccionados.",
            "error",
          );
          return;
        }
        items.length = 0;
        V.mostrarAviso(
          aviso,
          `Reserva registrada en estado Pendiente (${registradas} material(es)). Revísala en «Mis reservas».`,
          "ok",
        );
      },
    });
  }

  // HU24: listado de reservas del apoderado.
  const contenedor = document.getElementById("lista-reservas");
  if (contenedor && sesion) {
    const reservas = Datos.reservasDe(sesion.correo).slice().reverse();
    contenedor.innerHTML = reservas.length
      ? reservas
          .map(
            (r) => `
        <article class="ce-tarjeta">
          <h2 class="ce-subtitulo">${r.codigo} · ${r.estado}</h2>
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
          <article class="ce-tarjeta">
            <h2 class="ce-subtitulo">${r.codigo}</h2>
            <p>${r.pupilo} · ${r.producto} · ${r.cantidad} unidad(es) · Creada el ${r.fecha}</p>
            <button class="btn-ce btn-ce--primario" type="button" data-preparar="${r.codigo}">
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
          <article class="ce-tarjeta">
            <h2 class="ce-subtitulo">${r.codigo}</h2>
            <p>${r.pupilo} · ${r.producto} · ${r.cantidad} unidad(es)</p>
            <button class="btn-ce btn-ce--primario" type="button" data-entregar="${r.codigo}">
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
