// Búsqueda y filtros del catálogo (HU55 a HU67) y control de acceso (HU17).
// Los productos salen de la "base de datos" simulada (assets/js/app.js).
(function () {
  // HU17 CA2: el catálogo es exclusivo de apoderados autenticados.
  if (window.Sesion && !window.Sesion.requerir(["Cliente"])) return;

  const productos = window.Datos ? window.Datos.productos() : [];

  const normalizar = (valor) =>
    String(valor || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

  const precio = (valor) => `$${valor.toLocaleString("es-CL")}`;

  function tarjeta(producto, modo) {
    const disponible = producto.stock > 0;
    const accion =
      modo === "reserva"
        ? `<button class="btn-ce btn-ce--primario" type="button" data-agregar="${producto.codigo}" ${
            disponible ? "" : "disabled"
          }>Añadir a la reserva</button>`
        : `<a class="btn-ce btn-ce--primario" href="producto-detalle.html?codigo=${encodeURIComponent(
            producto.codigo,
          )}">Ver detalle</a>`;
    return `
      <article class="ce-tarjeta">
        <img src="${producto.imagen}" alt="${producto.nombre}" width="240" height="120" />
        <h2 class="ce-subtitulo">${producto.nombre}</h2>
        <p>${producto.descripcion}</p>
        <p><strong>${precio(producto.precio)}</strong> · ${
          disponible ? `${producto.stock} disponibles` : "Agotado"
        }</p>
        ${accion}
      </article>`;
  }

  function montar({ clave, modo = "detalle" }) {
    const buscar = (valor) => document.querySelector(`[data-filtro="${valor}"]`);
    const buscarTodos = (valor) =>
      Array.from(document.querySelectorAll(`[data-filtro="${valor}"]`));

    const textoEl = buscar("texto");
    const ordenEl = buscar("orden");
    const disponEl = buscar("disponibles");
    const minEl = buscar("minimo");
    const maxEl = buscar("maximo");
    const nivelesBox = document.querySelector("[data-filtro-niveles]");
    const materiasBox = document.querySelector("[data-filtro-materias]");
    const tagsBox = document.querySelector("[data-filtro-tags]");
    const resultadoEl = document.querySelector("[data-filtro-resultado]");
    const vacioEl = document.querySelector("[data-filtro-vacio]");
    const listaEl = document.querySelector("[data-filtro-lista]");
    const limpiarEl = document.querySelector("[data-filtro-limpiar]");
    const errorPrecioEl = document.querySelector("[data-filtro-precio-error]");

    const precioMin = Math.min(...productos.map((p) => p.precio), 0);
    const precioMax = Math.max(...productos.map((p) => p.precio), 0);
    const guardado =
      (window.Edusaldo && Edusaldo.almacen.leer(clave)) || {};
    const estado = {
      texto: "",
      minimo: precioMin,
      maximo: precioMax,
      niveles: [],
      materias: [],
      disponibles: false,
      orden: "nombre-asc",
      ...guardado,
    };
    estado.minimo = Number.isFinite(Number(estado.minimo))
      ? Number(estado.minimo)
      : precioMin;
    estado.maximo = Number.isFinite(Number(estado.maximo))
      ? Number(estado.maximo)
      : precioMax;

    // HU57/HU58: niveles y materias se derivan del catálogo cargado.
    function poblarOpciones(box, tipo, valores) {
      if (!box) return;
      box.replaceChildren();
      valores.forEach((valor) => {
        const label = document.createElement("label");
        label.className = "ce-opcion";
        const input = document.createElement("input");
        input.type = "checkbox";
        input.dataset.filtro = tipo;
        input.value = valor;
        if (estado[tipo === "nivel" ? "niveles" : "materias"].includes(valor)) {
          input.checked = true;
        }
        label.append(input, document.createTextNode(` ${valor}`));
        box.appendChild(label);
      });
    }

    const niveles = [...new Set(productos.flatMap((p) => p.niveles))].sort();
    const materias = [...new Set(productos.flatMap((p) => p.materias))].sort();
    poblarOpciones(nivelesBox, "nivel", niveles);
    poblarOpciones(materiasBox, "materia", materias);

    function leerControles() {
      if (textoEl) estado.texto = textoEl.value;
      if (ordenEl) estado.orden = ordenEl.value;
      if (disponEl) estado.disponibles = disponEl.checked;
      estado.niveles = buscarTodos("nivel")
        .filter((c) => c.checked)
        .map((c) => c.value);
      estado.materias = buscarTodos("materia")
        .filter((c) => c.checked)
        .map((c) => c.value);
    }

    function filtrar() {
      let resultado = productos.filter((producto) => {
        const texto = normalizar(
          `${producto.nombre} ${producto.codigo} ${producto.descripcion}`,
        );
        const coincideTexto =
          !estado.texto || texto.includes(normalizar(estado.texto));
        const coincidePrecio =
          producto.precio >= estado.minimo && producto.precio <= estado.maximo;
        const coincideNivel =
          !estado.niveles.length ||
          !producto.niveles.length ||
          estado.niveles.some((nivel) => producto.niveles.includes(nivel));
        const coincideMateria =
          !estado.materias.length ||
          !producto.materias.length ||
          estado.materias.some((materia) => producto.materias.includes(materia));
        return (
          coincideTexto &&
          coincidePrecio &&
          coincideNivel &&
          coincideMateria &&
          (!estado.disponibles || producto.stock > 0)
        );
      });

      const direccion = estado.orden.endsWith("desc") ? -1 : 1;
      resultado.sort((a, b) => {
        const campo = estado.orden.startsWith("precio")
          ? a.precio - b.precio
          : normalizar(a.nombre).localeCompare(normalizar(b.nombre));
        return campo * direccion;
      });
      return resultado;
    }

    // HU60 CA3: cada filtro activo se muestra como etiqueta removible.
    function pintarTags() {
      if (!tagsBox) return;
      tagsBox.replaceChildren();
      const chips = [];
      if (estado.texto) {
        chips.push({ tipo: "texto", label: `Búsqueda: ${estado.texto}` });
      }
      if (estado.minimo !== precioMin || estado.maximo !== precioMax) {
        chips.push({
          tipo: "precio",
          label: `Precio: ${precio(estado.minimo)} a ${precio(estado.maximo)}`,
        });
      }
      estado.niveles.forEach((nivel) =>
        chips.push({ tipo: "nivel", valor: nivel, label: `Nivel ${nivel}` }),
      );
      estado.materias.forEach((materia) =>
        chips.push({ tipo: "materia", valor: materia, label: materia }),
      );
      if (estado.disponibles) {
        chips.push({ tipo: "disponibles", label: "Solo disponibles" });
      }

      tagsBox.hidden = chips.length === 0;
      chips.forEach((chip) => {
        const boton = document.createElement("button");
        boton.type = "button";
        boton.className = "ce-etiqueta";
        boton.textContent = `${chip.label} ×`;
        boton.addEventListener("click", () => quitarFiltro(chip));
        tagsBox.appendChild(boton);
      });
    }

    function quitarFiltro(chip) {
      if (chip.tipo === "texto" && textoEl) textoEl.value = "";
      if (chip.tipo === "precio") {
        if (minEl) minEl.value = precioMin;
        if (maxEl) maxEl.value = precioMax;
      }
      if (chip.tipo === "nivel" || chip.tipo === "materia") {
        buscarTodos(chip.tipo).forEach((c) => {
          if (c.value === chip.valor) c.checked = false;
        });
      }
      if (chip.tipo === "disponibles" && disponEl) disponEl.checked = false;
      aplicar();
    }

    // HU67: mensaje claro cuando la combinación no devuelve productos.
    function pintarVacio(resultado) {
      if (!vacioEl) return;
      if (resultado.length > 0) {
        vacioEl.hidden = true;
        vacioEl.textContent = "";
        return;
      }
      const texto = normalizar(estado.texto);
      const hayPorTexto = productos.some((producto) =>
        normalizar(
          `${producto.nombre} ${producto.codigo} ${producto.descripcion}`,
        ).includes(texto),
      );
      vacioEl.textContent = hayPorTexto
        ? "Los productos que coinciden con tu búsqueda no tienen stock disponible. Desactiva el filtro de disponibilidad o limpia los filtros."
        : "No existe un producto que coincida con tu búsqueda y filtros. Ajusta el término o limpia los filtros.";
      vacioEl.hidden = false;
    }

    function aplicar() {
      // HU56 CA3: un mínimo mayor que el máximo impide aplicar el filtro.
      if (minEl && maxEl && minEl.value !== "" && maxEl.value !== "") {
        const minimo = Number(minEl.value);
        const maximo = Number(maxEl.value);
        if (
          Number.isFinite(minimo) &&
          Number.isFinite(maximo) &&
          minimo > maximo
        ) {
          if (errorPrecioEl) {
            errorPrecioEl.textContent =
              "El precio mínimo no puede ser mayor que el máximo.";
            errorPrecioEl.classList.add("ce-error--visible");
          }
          return;
        }
        if (errorPrecioEl) {
          errorPrecioEl.textContent = "";
          errorPrecioEl.classList.remove("ce-error--visible");
        }
      }

      leerControles();
      if (minEl && minEl.value !== "") estado.minimo = Number(minEl.value);
      if (maxEl && maxEl.value !== "") estado.maximo = Number(maxEl.value);

      const resultado = filtrar();
      if (window.Edusaldo) Edusaldo.almacen.guardar(clave, estado);

      if (listaEl) {
        listaEl.innerHTML = resultado.map((p) => tarjeta(p, modo)).join("");
      }
      if (resultadoEl) {
        resultadoEl.textContent = `${resultado.length} producto(s) encontrado(s)`;
      }
      pintarTags();
      pintarVacio(resultado);
    }

    function limpiar() {
      estado.texto = "";
      estado.minimo = precioMin;
      estado.maximo = precioMax;
      estado.niveles = [];
      estado.materias = [];
      estado.disponibles = false;
      estado.orden = "nombre-asc";
      if (textoEl) textoEl.value = "";
      if (ordenEl) ordenEl.value = "nombre-asc";
      if (disponEl) disponEl.checked = false;
      if (minEl) minEl.value = precioMin;
      if (maxEl) maxEl.value = precioMax;
      buscarTodos("nivel").forEach((c) => (c.checked = false));
      buscarTodos("materia").forEach((c) => (c.checked = false));
      if (errorPrecioEl) {
        errorPrecioEl.textContent = "";
        errorPrecioEl.classList.remove("ce-error--visible");
      }
      if (window.Edusaldo) Edusaldo.almacen.quitar(clave);
      aplicar();
    }

    if (textoEl) {
      textoEl.value = estado.texto;
      textoEl.addEventListener("input", aplicar);
    }
    if (ordenEl) {
      ordenEl.value = estado.orden;
      ordenEl.addEventListener("change", aplicar);
    }
    if (disponEl) {
      disponEl.checked = estado.disponibles;
      disponEl.addEventListener("change", aplicar);
    }
    if (minEl) {
      minEl.value = estado.minimo;
      minEl.addEventListener("change", aplicar);
    }
    if (maxEl) {
      maxEl.value = estado.maximo;
      maxEl.addEventListener("change", aplicar);
    }
    buscarTodos("nivel").forEach((c) => c.addEventListener("change", aplicar));
    buscarTodos("materia").forEach((c) => c.addEventListener("change", aplicar));
    if (limpiarEl) limpiarEl.addEventListener("click", limpiar);

    // El panel es un <form>; Enter en la búsqueda no debe recargar la página.
    const panel = document.getElementById("panelFiltros");
    if (panel) {
      panel.addEventListener("submit", (evento) => evento.preventDefault());
    }

    aplicar();
    return { estado, aplicar, limpiar };
  }

  window.filtros = { montar, productos };
})();
