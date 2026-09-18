// HU07 (acceso a datos), HU08 (rectificación) y HU06 (consentimiento).
// Lee y escribe sobre el usuario autenticado en la base simulada.
(function () {
  if (!window.Datos || !window.Sesion) return;
  const V = window.Validacion;
  const sesion = Sesion.actual();
  if (!sesion) return;
  const usuario = Datos.buscarUsuario(sesion.correo);
  if (!usuario) return;

  const form = document.getElementById("formPerfil");
  const nombre = document.getElementById("perfil-nombre");
  const correo = document.getElementById("perfil-correo");
  const direccion = document.getElementById("perfil-direccion");
  const aviso = document.getElementById("perfil-aviso");
  const btnDescargar = document.getElementById("btn-descargar-datos");
  const btnRevocar = document.getElementById("btn-revocar-consentimiento");
  const estadoConsent = document.getElementById("consentimiento-estado");

  nombre.value = usuario.nombre;
  correo.value = usuario.correo;
  correo.readOnly = true;
  direccion.value = usuario.direccion;

  function pintarConsentimiento() {
    if (!estadoConsent) return;
    const actual = Datos.buscarUsuario(sesion.correo);
    estadoConsent.textContent =
      actual && actual.consentimiento
        ? `Consentimiento otorgado${
            actual.consentimientoFecha
              ? ` el ${new Date(actual.consentimientoFecha).toLocaleDateString("es-CL")}`
              : ""
          } (versión ${actual.consentimientoVersion || "v1"}).`
        : "No registras un consentimiento vigente.";
  }

  pintarConsentimiento();

  // HU08: rectificación.
  if (form && V) {
    V.preparar(form, {
      alValidar: () => {
        Datos.actualizarUsuario(sesion.correo, {
          nombre: nombre.value.trim(),
          direccion: direccion.value.trim(),
        });
        V.mostrarAviso(
          aviso,
          "Solicitud de rectificación registrada. El administrador fue notificado.",
          "ok",
        );
      },
    });
  }

  // HU07 CA2: descarga legible de los datos.
  if (btnDescargar) {
    btnDescargar.addEventListener("click", () => {
      const actual = Datos.buscarUsuario(sesion.correo);
      const datos = {
        run: actual.run,
        nombre: actual.nombre,
        apellidos: actual.apellidos,
        correo: actual.correo,
        direccion: actual.direccion,
        region: actual.region,
        comuna: actual.comuna,
        rol: actual.rol,
        consentimiento: actual.consentimiento,
        solicitado: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(datos, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = "mis-datos-edusaldo.json";
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      URL.revokeObjectURL(url);
      V.mostrarAviso(aviso, "Descarga generada con tus datos personales.", "ok");
    });
  }

  // HU06 CA3/CA4: revocar consentimiento y programar anonimización.
  if (btnRevocar) {
    btnRevocar.addEventListener("click", () => {
      Datos.actualizarUsuario(sesion.correo, {
        consentimiento: false,
        consentimientoFecha: new Date().toISOString(),
      });
      V.mostrarAviso(
        aviso,
        "Consentimiento revocado. Tus datos y los de tus pupilos serán anonimizados en un plazo no mayor a 30 días.",
        "ok",
      );
      pintarConsentimiento();
    });
  }
})();
