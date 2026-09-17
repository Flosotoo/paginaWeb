// Formularios de acceso (HU10-HU15). HTML valida required, tipo, largos y
// pattern; aquí solo van las reglas cruzadas y la confirmación del envío.
(function () {
  if (!window.Validacion) return;
  const V = window.Validacion;

  // HU13: inicio de sesión
  const formLogin = document.getElementById("formLogin");
  if (formLogin) {
    const correo = document.getElementById("correo");
    const aviso = document.getElementById("aviso-credenciales");
    V.preparar(formLogin, {
      alValidar: () => {
        sessionStorage.setItem(
          "edusaldoSesion",
          correo.value.trim().toLowerCase(),
        );
        V.mostrarAviso(
          aviso,
          "Acceso concedido. Sesión iniciada correctamente.",
          "info",
        );
      },
    });
  }

  // HU10 + HU11 + HU12 + HU06: registro de apoderado
  const formRegistro = document.getElementById("formRegistro");
  if (formRegistro) {
    const run = document.getElementById("run");
    const clave = document.getElementById("clave");
    const repetir = document.getElementById("clave-repetir");
    const region = document.getElementById("region");
    const comuna = document.getElementById("comuna");
    const aviso = document.getElementById("registro-aviso");

    V.conectarRegionComuna(region, comuna);

    V.preparar(formRegistro, {
      cruzadas: [
        { campo: run, validar: (valor) => V.mensajeRun(valor) },
        {
          campo: repetir,
          dependeDe: [clave, repetir],
          validar: (valor) =>
            valor === clave.value ? "" : "Las contraseñas no coinciden.",
        },
        {
          campo: comuna,
          dependeDe: [region, comuna],
          validar: (valor) =>
            V.comunaPertenece(region.value, valor)
              ? ""
              : "La comuna no pertenece a la región seleccionada.",
        },
      ],
      alValidar: () => {
        // HU06 CA2: consentimiento con fecha y versión del aviso.
        localStorage.setItem(
          "edusaldoConsentimiento",
          JSON.stringify({
            aceptado: true,
            fecha: new Date().toISOString(),
            version: "v1",
          }),
        );
        V.mostrarAviso(
          aviso,
          "Cuenta creada. Registramos tu consentimiento de datos y te enviamos la confirmación.",
          "ok",
        );
      },
    });
  }

  // HU15: cambio de contraseña temporal
  const formCambio = document.getElementById("formCambio");
  if (formCambio) {
    const actual = document.getElementById("actual");
    const nueva = document.getElementById("nueva");
    const confirmacion = document.getElementById("confirmacion");
    const aviso = document.getElementById("cambio-aviso");

    V.preparar(formCambio, {
      cruzadas: [
        {
          campo: nueva,
          dependeDe: [actual, nueva],
          validar: (valor) =>
            valor === actual.value
              ? "La nueva contraseña debe ser distinta a la temporal."
              : "",
        },
        {
          campo: confirmacion,
          dependeDe: [nueva, confirmacion],
          validar: (valor) =>
            valor === nueva.value
              ? ""
              : "La confirmación no coincide con la nueva contraseña.",
        },
      ],
      alValidar: () =>
        V.mostrarAviso(
          aviso,
          "Contraseña actualizada. Usa la nueva en tu próximo inicio de sesión.",
          "ok",
        ),
    });
  }
})();
