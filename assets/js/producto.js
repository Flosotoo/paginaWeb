// Dominio de productos: alta (HU28), edición (HU29), listado administrativo
// (HU27), detalle (HU30), stock (HU31/HU32) y baja (HU33).
(function () {
  if (!window.Datos || !window.Validacion) return;
  const V = window.Validacion;

  function formato(valor) {
    return `$${Number(valor).toLocaleString("es-CL")}`;
  }

  const form = document.getElementById("formProducto");
  if (form) {
    const codigo = document.getElementById("codigo");
    const nombre = document.getElementById("nombre");
    const descripcion = document.getElementById("descripcion");
    const precio = document.getElementById("precio");
    const stock = document.getElementById("stock");
    const stockCritico = document.getElementById("stock-critico");
    const categoria = document.getElementById("categoria");
    const titulo = document.getElementById("titulo-producto");
    const aviso = document.getElementById("producto-aviso");

    const parametros = new URLSearchParams(window.location.search);
    const codigoParam = parametros.get("codigo");
    const existente = codigoParam ? Datos.buscarProducto(codigoParam) : null;

    if (existente) {
      if (titulo) titulo.textContent = "Editar producto";
      codigo.value = existente.codigo;
      codigo.readOnly = true;
      nombre.value = existente.nombre;
      descripcion.value = existente.descripcion;
      precio.value = existente.precio;
      stock.value = existente.stock;
      stockCritico.value =
        existente.stockCritico == null ? "" : existente.stockCritico;
      categoria.value = existente.categoria;
    } else if (titulo) {
      titulo.textContent = "Crear producto";
    }

    V.preparar(form, {
      alValidar: () => {
        const producto = {
          codigo: codigo.value.trim().toUpperCase(),
          nombre: nombre.value.trim(),
          descripcion: descripcion.value.trim(),
          precio: Number(precio.value),
          stock: Number(stock.value),
          stockCritico:
            stockCritico.value === "" ? null : Number(stockCritico.value),
          categoria: categoria.value,
          niveles: existente ? existente.niveles : [],
          materias: existente ? existente.materias : [],
          imagen:
            (existente && existente.imagen) ||
            "../../assets/img/landing-page.jpg",
        };

        if (
          !existente &&
          Datos.buscarProducto(producto.codigo)
        ) {
          V.mostrarAviso(
            aviso,
            "Ya existe un producto con ese código.",
            "error",
          );
          return;
        }

        Datos.guardarProducto(producto);
        V.mostrarAviso(aviso, "Producto guardado correctamente.", "ok");
        window.setTimeout(() => window.location.assign("productos.html"), 700);
      },
    });
  }

  // HU27: listado. Las acciones de administrador solo se muestran al admin;
  // el vendedor ve el listado en modo lectura (HU27 CA4).
  const contenedor = document.getElementById("lista-productos-admin");
  if (contenedor) {
    function pintar() {
      const sesion = window.Sesion ? Sesion.actual() : null;
      const esAdmin = sesion && sesion.rol === "Administrador";
      const productos = Datos.productos();
      contenedor.innerHTML =
        productos
          .map((p) => {
            const critico =
              p.stockCritico != null && p.stock <= p.stockCritico;
            const acciones = esAdmin
              ? `<a class="btn-ce btn-ce--secundario btn-ce--chico" href="producto-editar.html?codigo=${encodeURIComponent(
                  p.codigo,
                )}">Editar</a>
                 <button class="btn-ce btn-ce--destructivo btn-ce--chico" type="button" data-baja="${p.codigo}">Dar de baja</button>`
              : "";
            return `
            <article class="ce-tarjeta">
              <h2 class="ce-subtitulo">${p.codigo} · ${p.nombre}</h2>
              <p>Precio: ${formato(p.precio)} · Stock: ${p.stock} · Crítico: ${
                p.stockCritico == null ? "-" : p.stockCritico
              } · Categoría: ${p.categoria}</p>
              ${critico ? '<p class="ce-etiqueta">Reposición requerida</p>' : ""}
              <div class="ce-acciones">${acciones}</div>
              <details class="ce-preguntas">
                <summary>Ver detalle</summary>
                <dl class="ce-datos">
                  <dt class="ce-etiqueta">Descripción</dt><dd>${p.descripcion}</dd>
                  <dt class="ce-etiqueta">Stock</dt><dd>${p.stock}</dd>
                  <dt class="ce-etiqueta">Stock crítico</dt><dd>${
                    p.stockCritico == null ? "Sin definir" : p.stockCritico
                  }</dd>
                </dl>
              </details>
            </article>`;
          })
          .join("") || "<p>No hay productos registrados.</p>";
    }

    contenedor.addEventListener("click", (evento) => {
      const boton = evento.target.closest("[data-baja]");
      if (!boton) return;
      Datos.darDeBajaProducto(boton.dataset.baja);
      pintar();
    });

    pintar();
  }

  // HU54: alerta de stock crítico en el panel administrativo.
  const alerta = document.getElementById("alerta-stock");
  if (alerta) {
    const criticos = Datos.productos().filter(
      (p) => p.stockCritico != null && p.stock <= p.stockCritico,
    );
    alerta.innerHTML = criticos.length
      ? `<ul>${criticos
          .map((p) => `<li>${p.nombre} (${p.stock} unidades)</li>`)
          .join("")}</ul>`
      : "<p>Sin productos por reponer.</p>";
  }
})();
