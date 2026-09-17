// HU23 (reservar materiales) + HU24. HTML valida pupilo (required) y cantidad
// (type=number min=1 step=1); aquí se emula la confirmación con un código.
(function () {
  const form = document.getElementById("formReserva");
  if (!form || !window.Validacion) return;

  const V = window.Validacion;
  const pupilo = document.getElementById("hijoReserva");
  const aviso = document.getElementById("reserva-aviso");
  const lista = document.querySelector("[data-filtro-lista]");

  let correlativo = 14;

  V.preparar(form, {
    alValidar: () => {
      correlativo += 1;
      const codigo = `ED-2026-${String(correlativo).padStart(3, "0")}`;
      V.mostrarAviso(
        aviso,
        `Reserva ${codigo} registrada en estado Pendiente para ${pupilo.options[pupilo.selectedIndex].text}.`,
        "ok",
      );
    },
  });

  // El botón lo genera filtros.js; se delega el evento en la lista.
  if (lista) {
    lista.addEventListener("click", (evento) => {
      const boton = evento.target.closest("button");
      if (!boton || boton.disabled) return;
      if (!pupilo.value) {
        V.mostrarAviso(
          aviso,
          "Selecciona primero un pupilo antes de añadir materiales.",
          "error",
        );
        pupilo.focus();
      }
    });
  }
})();
