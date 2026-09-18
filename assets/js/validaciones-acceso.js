// Formularios de acceso (HU13 login, HU15 cambio de contraseña, HU06
// consentimiento). La validación de campos es HTML; aquí va la autenticación
// simulada, las reglas cruzadas y el flujo de primer ingreso.
(function () {
  if (!window.Validacion) return;
  const V = window.Validacion;
  const RAIZ = window.Edusaldo ? window.Edusaldo.RAIZ : "../../";

  // HU13: inicio de sesión contra la "base de datos" simulada.
  const formLogin = document.getElementById("formLogin");
  if (formLogin && window.Datos && window.Sesion) {
    const correo = document.getElementById("correo");
    const clave = document.getElementById("clave");
    const aviso = document.getElementById("aviso-credenciales");

    V.preparar(formLogin, {
      alValidar: () => {
        const usuario = Datos.buscarUsuario(correo.value.trim());
        if (!usuario || usuario.clave !== clave.value) {
          V.mostrarAviso(
            aviso,
            "El correo o la contraseña no son correctos.",
            "error",
          );
          return;
        }
        if (usuario.estado !== "activo") {
          V.mostrarAviso(aviso, "La cuenta está inactiva.", "error");
          return;
        }

        const sesion = Sesion.iniciar(usuario);

        // HU15: primer ingreso con contraseña temporal: cambio obligatorio.
        if (sesion.temporal) {
          V.mostrarAviso(
            aviso,
            "Primer ingreso: debes cambiar tu contraseña temporal.",
            "info",
          );
          window.setTimeout(
            () => window.location.assign(`${RAIZ}pages/acceso/cambiar-contrasena.html`),
            700,
          );
          return;
        }

        // HU13 CA4: cada perfil va a su área.
        V.mostrarAviso(aviso, "Acceso concedido. Entrando a tu área...", "info");
        window.setTimeout(
          () => window.location.assign(Sesion.homeDe(usuario.rol)),
          500,
        );
      },
    });
  }

  // HU15 + HU06: primer ingreso. Cambio de contraseña y consentimiento.
  const formCambio = document.getElementById("formCambio");
  if (formCambio && window.Datos && window.Sesion) {
    const sesion = Sesion.actual();
    if (!sesion || !sesion.correo) {
      window.location.replace(`${RAIZ}pages/acceso/login.html`);
      return;
    }

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
        // HU06: el consentimiento queda con fecha y versión.
        Datos.actualizarUsuario(sesion.correo, {
          clave: nueva.value,
          temporal: false,
          consentimiento: true,
          consentimientoFecha: new Date().toISOString(),
          consentimientoVersion: window.Edusaldo
            ? window.Edusaldo.VERSION_CONSENTIMIENTO
            : "v1",
        });
        Sesion.actualizar({ temporal: false });
        V.mostrarAviso(
          aviso,
          "Contraseña actualizada y consentimiento registrado. Entrando...",
          "ok",
        );
        window.setTimeout(
          () => window.location.assign(Sesion.homeDe(sesion.rol)),
          600,
        );
      },
    });
  }
})();
