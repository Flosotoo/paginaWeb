// Formulario de aporte (HU68, fuera de E1). HTML valida requeridos y monto
// (type=number min=1 step=1); aquí solo queda preparar el paso a Webpay.
(function () {
  const form = document.getElementById("formAporte");
  if (!form || !window.Validacion) return;

  const aviso = document.getElementById("aporte-aviso");

  window.Validacion.preparar(form, {
    alValidar: () =>
      window.Validacion.mostrarAviso(
        aviso,
        "Aporte preparado para continuar a Webpay.",
        "info",
      ),
  });
})();
