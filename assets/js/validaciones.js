// Validación HTML-first (HU44).
// Todo lo que el navegador puede validar se deja en atributos HTML:
// required, type, minlength, maxlength, min, max, step y pattern.
// Este archivo resuelve SOLO lo que HTML no puede: reglas cruzadas entre
// campos (confirmar contraseña, comuna según región, dígito verificador del
// RUN, stock/saldo) y el manejo del envío cuando no hay backend.
(function () {
  const REGIONES = [
    {
      codigo: "RM",
      nombre: "Región Metropolitana",
      comunas: ["Santiago", "Maipú", "La Florida", "Puente Alto"],
    },
    {
      codigo: "V",
      nombre: "Valparaíso",
      comunas: ["Valparaíso", "Viña del Mar", "Quilpué", "Villa Alemana"],
    },
    {
      codigo: "VIII",
      nombre: "Biobío",
      comunas: ["Concepción", "Talcahuano", "Los Ángeles", "Chiguayante"],
    },
    {
      codigo: "IX",
      nombre: "La Araucanía",
      comunas: ["Temuco", "Padre Las Casas", "Villarrica"],
    },
  ];

  function poblarRegiones(selectRegion) {
    selectRegion.replaceChildren(new Option("Elige una región", ""));
    REGIONES.forEach((region) =>
      selectRegion.add(new Option(region.nombre, region.codigo)),
    );
  }

  function comunasDe(codigo) {
    const region = REGIONES.find((item) => item.codigo === codigo);
    return region ? region.comunas : [];
  }

  function comunaPertenece(codigoRegion, comuna) {
    return comunasDe(codigoRegion).includes(comuna);
  }

  function conectarRegionComuna(selectRegion, selectComuna) {
    poblarRegiones(selectRegion);

    function recargarComunas() {
      selectComuna.replaceChildren(new Option("Elige una comuna", ""));
      comunasDe(selectRegion.value).forEach((comuna) =>
        selectComuna.add(new Option(comuna, comuna)),
      );
      selectComuna.disabled = !selectRegion.value;
      selectComuna.setCustomValidity("");
    }

    selectRegion.addEventListener("change", recargarComunas);
    recargarComunas();
  }

  // Módulo 11 chileno: lo único del RUN que HTML no puede calcular.
  function digitoVerificadorValido(cuerpo, dv) {
    if (!/^[0-9]+$/.test(cuerpo)) return false;
    let suma = 0;
    let factor = 2;
    for (let i = cuerpo.length - 1; i >= 0; i -= 1) {
      suma += Number(cuerpo[i]) * factor;
      factor = factor === 7 ? 2 : factor + 1;
    }
    const resto = 11 - (suma % 11);
    const calculado = resto === 11 ? "0" : resto === 10 ? "K" : String(resto);
    return calculado === dv;
  }

  function mensajeRun(valor) {
    const run = String(valor || "")
      .replace(/[.\-]/g, "")
      .toUpperCase();
    if (!/^[0-9]{6,8}[0-9K]$/.test(run)) {
      return "RUN sin puntos ni guion, de 7 a 9 caracteres.";
    }
    const cuerpo = run.slice(0, -1);
    const dv = run.slice(-1);
    return digitoVerificadorValido(cuerpo, dv)
      ? ""
      : "El dígito verificador del RUN no es válido.";
  }

  // Reglas cruzadas: se declaran en cada formulario. `validar` devuelve "" si
  // el campo es válido o el mensaje (que el navegador muestra en su globo).
  function preparar(form, opciones) {
    const { cruzadas = [], alValidar } = opciones || {};
    const aplicadores = [];

    cruzadas.forEach(({ campo, dependeDe, validar }) => {
      if (!campo) return;
      const aplicar = () =>
        campo.setCustomValidity(validar(campo.value, form) || "");
      aplicadores.push(aplicar);
      (dependeDe || [campo]).forEach((otro) => {
        otro.addEventListener("input", aplicar);
        otro.addEventListener("change", aplicar);
      });
      aplicar();
    });

    // Tras un reset los valores quedan vacíos: hay que recalcular las cruzadas.
    form.addEventListener("reset", () => {
      window.setTimeout(() => aplicadores.forEach((aplicar) => aplicar()), 0);
    });

    form.addEventListener("submit", (evento) => {
      evento.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      if (typeof alValidar === "function") alValidar(form);
    });
  }

  function mostrarAviso(elemento, mensaje, tipo) {
    if (!elemento) return;
    elemento.className = `ce-aviso ce-aviso--${tipo || "info"}`;
    elemento.textContent = mensaje;
    elemento.hidden = false;
  }

  window.Validacion = {
    regiones: REGIONES,
    poblarRegiones,
    comunasDe,
    comunaPertenece,
    conectarRegionComuna,
    digitoVerificadorValido,
    mensajeRun,
    preparar,
    mostrarAviso,
  };
})();
