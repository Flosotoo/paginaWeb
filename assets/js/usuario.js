// HU14, HU39, HU40 + HU44. HTML valida required, tipo, largos y pattern del
// correo; aquí queda la regla cruzada región/comuna y la confirmación.
(function () {
  const form = document.getElementById("formUsuario");
  if (!form || !window.Validacion) return;

  const V = window.Validacion;
  const run = document.getElementById("usuario-run");
  const region = document.getElementById("usuario-region");
  const comuna = document.getElementById("usuario-comuna");
  const aviso = document.getElementById("usuario-aviso");

  V.conectarRegionComuna(region, comuna);

  V.preparar(form, {
    cruzadas: [
      { campo: run, validar: (valor) => V.mensajeRun(valor) },
      {
        campo: comuna,
        dependeDe: [region, comuna],
        validar: (valor) =>
          V.comunaPertenece(region.value, valor)
            ? ""
            : "La comuna no pertenece a la región seleccionada.",
      },
    ],
    alValidar: () =>
      V.mostrarAviso(
        aviso,
        "Usuario guardado. Si es nuevo, se generó una contraseña temporal.",
        "ok",
      ),
  });
})();
