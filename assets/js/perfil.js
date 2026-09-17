// HU07 (acceso a datos), HU08 (rectificación) y HU06 (consentimiento).
(function () {
  const V = window.Validacion;
  const form = document.getElementById("formPerfil");
  const aviso = document.getElementById("perfil-aviso");
  const btnDescargar = document.getElementById("btn-descargar-datos");
  const btnRevocar = document.getElementById("btn-revocar-consentimiento");
  const estadoConsent = document.getElementById("consentimiento-estado");

  function leerConsentimiento() {
    try {
      return JSON.parse(
        localStorage.getItem("edusaldoConsentimiento") || "null",
      );
    } catch (error) {
      return null;
    }
  }

  function pintarConsentimiento() {
    if (!estadoConsent) return;
    const consentimiento = leerConsentimiento();
    estadoConsent.textContent =
      consentimiento && consentimiento.aceptado
        ? `Consentimiento otorgado el ${new Date(
            consentimiento.fecha,
          ).toLocaleDateString("es-CL")} (versión ${consentimiento.version}).`
        : "No registras un consentimiento vigente.";
  }

  pintarConsentimiento();

  // HU08: rectificación (HTML valida requeridos, tipo y largos).
  if (form && V) {
    V.preparar(form, {
      alValidar: () =>
        V.mostrarAviso(
          aviso,
          "Solicitud de rectificación registrada. El administrador fue notificado.",
          "ok",
        ),
    });
  }

  // HU07 CA2: archivo descargable y legible con los datos del apoderado.
  if (btnDescargar) {
    btnDescargar.addEventListener("click", () => {
      const datos = {
        nombre: document.getElementById("perfil-nombre")?.value || "",
        correo: document.getElementById("perfil-correo")?.value || "",
        direccion: document.getElementById("perfil-direccion")?.value || "",
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

  // HU06 CA3 y CA4: revocar consentimiento y programar la anonimización.
  if (btnRevocar) {
    btnRevocar.addEventListener("click", () => {
      localStorage.removeItem("edusaldoConsentimiento");
      V.mostrarAviso(
        aviso,
        "Consentimiento revocado. Tus datos y los de tus pupilos serán anonimizados en un plazo no mayor a 30 días.",
        "ok",
      );
      pintarConsentimiento();
    });
  }
})();
