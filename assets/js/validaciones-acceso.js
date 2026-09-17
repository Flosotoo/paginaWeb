const formRegistro = document.getElementById("formRegistro");

if (formRegistro) {
  const clave = document.getElementById("clave");
  const confirmacion = document.getElementById("clave-repetir");

  function validarCoincidencia() {
    const coincide = clave.value === confirmacion.value;
    confirmacion.setCustomValidity(coincide ? "" : "Las contraseñas no coinciden.");
  }

  clave.addEventListener("input", validarCoincidencia);
  confirmacion.addEventListener("input", validarCoincidencia);
  formRegistro.addEventListener("submit", validarCoincidencia);
}
