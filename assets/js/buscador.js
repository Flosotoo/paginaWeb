// Buscador en tiempo real compartido (HU27, HU36, HU38, HU51 a HU67).
// Normaliza tildes y mayúsculas, aplica debounce y delega el dibujo al render.
// Se usa en el panel admin, en la librería, en el catálogo y en los formularios.
(function () {
  function normalizar(texto) {
    return String(texto == null ? "" : texto)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  // keys: arreglo de nombres de campo o función (item) => [valores].
  function valoresDe(item, keys) {
    if (typeof keys === "function") return keys(item) || [];
    return (keys || []).map((campo) => item && item[campo]);
  }

  function crear(opciones) {
    const {
      input,
      contenedor,
      items,
      keys = [],
      render,
      debounce = 180,
      minLength = 0,
    } = opciones || {};
    if (!input || typeof render !== "function") return null;

    let temporizador = null;
    const fuente = () => (typeof items === "function" ? items() : items) || [];

    function filtrar(consulta) {
      const q = normalizar(consulta);
      if (q.length < minLength) return fuente();
      return fuente().filter((item) =>
        valoresDe(item, keys).some((valor) => normalizar(valor).includes(q)),
      );
    }

    function pintar() {
      const consulta = input.value;
      const resultados = filtrar(consulta);
      render(resultados, consulta);
      if (contenedor) {
        contenedor.hidden = normalizar(consulta).length < minLength;
      }
      return resultados;
    }

    function programar() {
      window.clearTimeout(temporizador);
      temporizador = window.setTimeout(pintar, debounce);
    }

    input.addEventListener("input", programar);
    input.addEventListener("search", programar);
    pintar();

    return { pintar, programar, filtrar, normalizar };
  }

  function debounce(fn, ms = 180) {
    let temporizador = null;
    return function (...args) {
      window.clearTimeout(temporizador);
      temporizador = window.setTimeout(() => fn.apply(this, args), ms);
    };
  }

  window.Buscador = { crear, normalizar, debounce };
})();
