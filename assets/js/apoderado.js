const formAporte = document.getElementById("formAporte");

if (formAporte) {
  formAporte.addEventListener("submit", (evento) => {
    evento.preventDefault();
    const aviso = document.getElementById("aporte-aviso");

    if (!formAporte.checkValidity()) {
      formAporte.classList.add("was-validated");
      if (aviso) aviso.textContent = "Revisa el pupilo y el monto ingresado.";
      return;
    }

    if (aviso) {
      aviso.textContent = "Aporte preparado para continuar a Webpay.";
      aviso.hidden = false;
    }
  });
}
