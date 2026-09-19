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

  // RUN tolerante: acepta con o sin puntos, con o sin guion, con o sin dígito
  // verificador, y con K minúscula o mayúscula. Solo rechaza errores reales
  // (caracteres inválidos, largo fuera de rango o DV incorrecto cuando se da).
  function normalizarRun(valor) {
    return String(valor == null ? "" : valor)
      .replace(/[.\-\s]/g, "")
      .toUpperCase();
  }

  function runEsValido(valor) {
    const run = normalizarRun(valor);
    if (run.length < 6 || run.length > 9) return false;
    if (!/^[0-9K]+$/.test(run)) return false;
    if (run.includes("K") && !run.endsWith("K")) return false;

    const cuerpo = run.slice(0, -1);
    const dv = run.slice(-1);

    // 1) Venía con dígito verificador: se comprueba.
    if (/^[0-9]+$/.test(cuerpo) && digitoVerificadorValido(cuerpo, dv)) {
      return true;
    }

    // 2) No venía dígito verificador: se acepta si el cuerpo tiene 6 a 8 dígitos.
    if (/^[0-9]+$/.test(run) && run.length >= 6 && run.length <= 8) {
      return true;
    }

    return false;
  }

  function mensajeRun(valor) {
    const run = normalizarRun(valor);
    if (run === "") return "Ingresa el RUN.";
    if (!/^[0-9K]+$/.test(run)) {
      return "El RUN solo puede contener números y la letra K.";
    }
    if (run.includes("K") && !run.endsWith("K")) {
      return "La letra K solo puede ir al final como dígito verificador.";
    }
    if (run.length < 6 || run.length > 9) {
      return "El RUN debe tener entre 6 y 9 caracteres.";
    }
    return runEsValido(run)
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
    const clases = { ok: "alert-success", error: "alert-danger", info: "alert-info" };
    elemento.className = `alert ${clases[tipo] || clases.info}`;
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
    normalizarRun,
    runEsValido,
    preparar,
    mostrarAviso,
  };
})();
