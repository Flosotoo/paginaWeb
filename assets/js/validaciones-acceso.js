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

  // Registro público: solo crea cuentas de apoderado. El personal (Administrador
  // y Vendedor) sigue creándose desde el panel de administración.
  const formRegistro = document.getElementById("formRegistro");
  if (formRegistro && window.Datos && window.Sesion) {
    const campo = (id) => document.getElementById(`registro-${id}`);
    const run = campo("run");
    const region = campo("region");
    const comuna = campo("comuna");
    const clave = campo("clave");
    const confirmacion = campo("confirmacion");
    const aviso = document.getElementById("registro-aviso");

    V.conectarRegionComuna(region, comuna);

    V.preparar(formRegistro, {
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
        {
          campo: confirmacion,
          dependeDe: [clave, confirmacion],
          validar: (valor) =>
            valor === clave.value ? "" : "Las contraseñas no coinciden.",
        },
      ],
      alValidar: () => {
        const correo = campo("correo").value.trim().toLowerCase();
        if (Datos.buscarUsuario(correo)) {
          V.mostrarAviso(aviso, "Ya existe una cuenta con ese correo.", "error");
          return;
        }
        const runNormal = V.normalizarRun(run.value);
        if (Datos.usuarios().some((u) => V.normalizarRun(u.run) === runNormal)) {
          V.mostrarAviso(aviso, "Ya existe una cuenta con ese RUN.", "error");
          return;
        }

        const usuario = Datos.crearUsuario({
          run: run.value.trim(),
          primerNombre: campo("primer-nombre").value.trim(),
          segundoNombre: campo("segundo-nombre").value.trim(),
          apellidoPaterno: campo("apellido-paterno").value.trim(),
          apellidoMaterno: campo("apellido-materno").value.trim(),
          correo,
          clave: clave.value,
          rol: "Cliente",
          region: region.value,
          comuna: comuna.value,
          direccion: campo("direccion").value.trim(),
          nacimiento: "",
          temporal: false,
          consentimiento: true,
          consentimientoFecha: new Date().toISOString(),
          consentimientoVersion: window.Edusaldo
            ? window.Edusaldo.VERSION_CONSENTIMIENTO
            : "v1",
          estado: "activo",
        });
        Sesion.iniciar(usuario);
        V.mostrarAviso(aviso, "Cuenta creada. Entrando a tu área...", "ok");
        window.setTimeout(
          () => window.location.assign(Sesion.homeDe(usuario.rol)),
          600,
        );
      },
    });
  }

  // Recuperar contraseña: genera una temporal que obliga a cambiarla en el
  // siguiente ingreso (mismo flujo que HU15).
  const formRecuperar = document.getElementById("formRecuperar");
  if (formRecuperar && window.Datos) {
    const correo = document.getElementById("recuperar-correo");
    const aviso = document.getElementById("recuperar-aviso");

    V.preparar(formRecuperar, {
      alValidar: () => {
        // El mensaje es el mismo exista o no la cuenta, para no revelar qué
        // correos están registrados.
        let mensaje =
          "Si el correo está registrado, te enviamos una contraseña temporal.";
        const usuario = Datos.buscarUsuario(correo.value.trim());
        if (usuario && usuario.estado === "activo") {
          const temporal = Math.random().toString(36).slice(2, 8);
          Datos.actualizarUsuario(usuario.correo, {
            clave: temporal,
            temporal: true,
          });
          // Sin servidor de correo, la demo la muestra en pantalla.
          mensaje += ` (Demostración: tu contraseña temporal es ${temporal}).`;
        }
        V.mostrarAviso(aviso, mensaje, "info");
        formRecuperar.reset();
      },
    });
  }
})();
