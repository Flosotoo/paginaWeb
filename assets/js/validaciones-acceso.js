// Formularios de acceso (HU13 login, HU15 cambio de contraseña, HU06
// consentimiento). HTML valida required, tipo, largos y pattern; aquí solo van
// las reglas cruzadas y la confirmación del envío.
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

  // HU15 + HU06: primer ingreso. Cambio de contraseña y consentimiento.
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
          "Contraseña actualizada y consentimiento registrado. Ya puedes usar la plataforma.",
          "ok",
        );
      },
    });
  }
})();
