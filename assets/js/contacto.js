// HU25 (contacto) + HU44. Los campos se validan con HTML (required, type,
// maxlength, pattern); aquí queda el contador en vivo y la confirmación.
(function () {
  const form = document.getElementById("form-contacto");
  if (!form || !window.Validacion) return;

  const comentario = document.getElementById("contacto-comentario");
  const contador = document.getElementById("contacto-comentario-contador");
  const aviso = document.getElementById("contacto-aviso");

  function actualizarContador() {
    if (!contador || !comentario) return;
    contador.textContent = `${comentario.value.length} / 500`;
    contador.classList.toggle(
      "ce-contador--excedido",
      comentario.value.length > 500,
    );
  }

  comentario.addEventListener("input", actualizarContador);
  actualizarContador();

  window.Validacion.preparar(form, {
    alValidar: () => {
      window.Validacion.mostrarAviso(
        aviso,
        "Gracias. Recibimos tu consulta y te responderemos al correo indicado.",
        "ok",
      );
      form.reset();
      actualizarContador();
    },
  });
})();
