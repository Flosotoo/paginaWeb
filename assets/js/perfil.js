// HU07 (acceso a datos), HU08 (rectificación) y HU06 (consentimiento).
// La rectificación NO modifica los datos: crea una solicitud PENDIENTE con el
// diff, que el administrador aprueba o rechaza.
(function () {
  if (!window.Datos || !window.Sesion) return;
  const V = window.Validacion;
  const sesion = Sesion.actual();
  if (!sesion) return;

  const form = document.getElementById("formPerfil");
  const primerNombre = document.getElementById("perfil-primer-nombre");
  const segundoNombre = document.getElementById("perfil-segundo-nombre");
  const apellidoPaterno = document.getElementById("perfil-apellido-paterno");
  const apellidoMaterno = document.getElementById("perfil-apellido-materno");
  const correo = document.getElementById("perfil-correo");
  const direccion = document.getElementById("perfil-direccion");
  const aviso = document.getElementById("perfil-aviso");
  const btnDescargar = document.getElementById("btn-descargar-datos");
  const btnRevocar = document.getElementById("btn-revocar-consentimiento");
  const estadoConsent = document.getElementById("consentimiento-estado");

  function usuarioActual() {
    return Datos.buscarUsuario(sesion.correo);
  }

  function cargar() {
    const usuario = usuarioActual();
    if (!usuario) return;
    primerNombre.value = usuario.primerNombre || "";
    segundoNombre.value = usuario.segundoNombre || "";
    apellidoPaterno.value = usuario.apellidoPaterno || "";
    apellidoMaterno.value = usuario.apellidoMaterno || "";
    correo.value = usuario.correo;
    correo.readOnly = true;
    direccion.value = usuario.direccion || "";
  }

  cargar();

  function pintarConsentimiento() {
    if (!estadoConsent) return;
    const actual = usuarioActual();
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

  // HU08 CA1: registrar la solicitud con el diff, sin tocar los datos.
  if (form && V) {
    V.preparar(form, {
      alValidar: () => {
        const usuario = usuarioActual();
        const valores = {
          primerNombre: primerNombre.value.trim(),
          segundoNombre: segundoNombre.value.trim(),
          apellidoPaterno: apellidoPaterno.value.trim(),
          apellidoMaterno: apellidoMaterno.value.trim(),
          correo: correo.value.trim().toLowerCase(),
          direccion: direccion.value.trim(),
        };
        let creadas = 0;
        Object.keys(valores).forEach((campo) => {
          const anterior = String(usuario[campo] || "");
          const solicitado = String(valores[campo] || "");
          if (anterior !== solicitado) {
            Datos.agregarSolicitud({
              id: Datos.siguienteIdSolicitud(),
              correo: sesion.correo,
              solicitante: sesion.correo,
              campo,
              valorActual: anterior,
              valorSolicitado: solicitado,
              timestamp: new Date().toISOString(),
              estado: "Pendiente",
            });
            creadas += 1;
          }
        });
        if (!creadas) {
          V.mostrarAviso(
            aviso,
            "No hay cambios que solicitar: tus datos ya están actualizados.",
            "info",
          );
          return;
        }
        V.mostrarAviso(
          aviso,
          creadas === 1
            ? "Solicitud enviada. El administrador la revisará y, si la aprueba, actualizará tus datos."
            : `Se enviaron ${creadas} solicitudes. El administrador las revisará y, si las aprueba, actualizará tus datos.`,
          "ok",
        );
      },
    });
  }

  // HU07 CA2: descarga legible con los cuatro campos por separado.
  if (btnDescargar) {
    btnDescargar.addEventListener("click", () => {
      const actual = usuarioActual();
      const datos = {
        run: actual.run,
        primerNombre: actual.primerNombre,
        segundoNombre: actual.segundoNombre,
        apellidoPaterno: actual.apellidoPaterno,
        apellidoMaterno: actual.apellidoMaterno,
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
        "Consentimiento revocado. Tus datos y los de tus alumnos serán anonimizados en un plazo no mayor a 30 días.",
        "ok",
      );
      pintarConsentimiento();
    });
  }
})();
