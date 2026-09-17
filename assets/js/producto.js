// HU28 (crear) + HU29 (editar) + HU44. El formulario se valida con HTML
// (required, maxlength, type=number con min/step, select required); aquí solo
// queda confirmar el guardado.
(function () {
  const form = document.getElementById("formProducto");
  if (!form || !window.Validacion) return;

  const aviso = document.getElementById("producto-aviso");

  window.Validacion.preparar(form, {
    alValidar: () =>
      window.Validacion.mostrarAviso(
        aviso,
        "Producto guardado correctamente.",
        "ok",
      ),
  });
})();
