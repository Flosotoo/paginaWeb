// Dominio de productos: alta (HU28), edición (HU29), listado administrativo
// (HU27), detalle (HU30), stock (HU31/HU32) y baja (HU33).
// Incluye log auxiliar (logs.js) y buscador compartido (buscador.js).
(function () {
  if (!window.Datos || !window.Validacion) return;
  const V = window.Validacion;

  const actor = () =>
    window.Sesion && Sesion.actual() ? Sesion.actual().correo : "";
  const escapar = (texto) =>
    String(texto == null ? "" : texto).replace(
      /[&<>"']/g,
      (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
          c
        ],
    );

  function formato(valor) {
    return `$${Number(valor).toLocaleString("es-CL")}`;
  }

  // Modal de confirmación (HU33). Usa el modal de Bootstrap si está cargado y
  // cae a confirm() como respaldo.
  function confirmar(mensaje, textoConfirmar) {
    if (!window.bootstrap) return Promise.resolve(window.confirm(mensaje));
    return new Promise((resolve) => {
      const previo = document.getElementById("modal-edusaldo");
      if (previo) previo.remove();
      const wrapper = document.createElement("div");
      wrapper.innerHTML = `
        <div class="modal fade" id="modal-edusaldo" tabindex="-1" aria-hidden="true">
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
              <div class="modal-header">
                <h2 class="modal-title h5">Confirmar acción</h2>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
              </div>
              <div class="modal-body"><p class="mb-0">${mensaje}</p></div>
              <div class="modal-footer">
                <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
                <button type="button" class="btn btn-danger" data-confirmar>${textoConfirmar}</button>
              </div>
            </div>
          </div>
        </div>`;
      const modal = wrapper.firstElementChild;
      document.body.appendChild(modal);
      const instancia = new window.bootstrap.Modal(modal);
      let aceptado = false;
      modal
        .querySelector("[data-confirmar]")
        .addEventListener("click", () => {
          aceptado = true;
          instancia.hide();
        });
      modal.addEventListener("hidden.bs.modal", () => {
        modal.remove();
        resolve(aceptado);
      });
      instancia.show();
    });
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

        if (!existente && Datos.buscarProducto(producto.codigo)) {
          V.mostrarAviso(
            aviso,
            "Ya existe un producto con ese código.",
            "error",
          );
          return;
        }

        // HU29 CA3: si cambia el stock o el stock crítico, queda en el log.
        if (existente && window.Logs) {
          const antes = {
            stock: existente.stock,
            stockCritico: existente.stockCritico,
          };
          const despues = {
            stock: producto.stock,
            stockCritico: producto.stockCritico,
          };
          if (
            antes.stock !== despues.stock ||
            antes.stockCritico !== despues.stockCritico
          ) {
            window.Logs.registrar({
              accion: "ajuste_stock",
              entidad: "producto",
              id: producto.codigo,
              antes,
              despues,
              datosAntes: antes,
              datosDespues: despues,
              actor: actor(),
            });
          }
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
    const input = document.getElementById("buscar-productos");

    function tarjeta(p, i) {
      const sesion = window.Sesion ? Sesion.actual() : null;
      const esAdmin = sesion && sesion.rol === "Administrador";
      const critico = p.stockCritico != null && p.stock <= p.stockCritico;
      const acciones = esAdmin
        ? `<a class="btn btn-outline-primary btn-sm" href="producto-editar.html?codigo=${encodeURIComponent(
            p.codigo,
          )}">Editar</a>
           <button class="btn btn-outline-danger btn-sm" type="button" data-baja="${p.codigo}">Dar de baja</button>`
        : "";
      return `
        <article class="card card-body mb-4">
          <h2 class="h3 mb-2">${p.codigo} · ${p.nombre}</h2>
          <p>Precio: ${formato(p.precio)} · Stock: ${p.stock} · Crítico: ${
            p.stockCritico == null ? "-" : p.stockCritico
          } · Categoría: ${p.categoria}</p>
          ${critico ? '<p><span class="badge rounded-pill">Reposición requerida</span></p>' : ""}
          <div class="d-flex flex-wrap align-items-center gap-3 mt-4">${acciones}</div>
          <div class="accordion accordion-flush" id="det-${i}">
            <div class="accordion-item">
              <h3 class="accordion-header">
                <button class="accordion-button collapsed px-0" type="button" data-bs-toggle="collapse" data-bs-target="#det-${i}-c" aria-expanded="false" aria-controls="det-${i}-c">Ver detalle</button>
              </h3>
              <div id="det-${i}-c" class="accordion-collapse collapse" data-bs-parent="#det-${i}">
                <div class="accordion-body px-0">
                  <dl class="mb-3">
                    <dt><span class="badge rounded-pill">Descripción</span></dt><dd>${p.descripcion}</dd>
                    <dt><span class="badge rounded-pill">Stock</span></dt><dd>${p.stock}</dd>
                    <dt><span class="badge rounded-pill">Stock crítico</span></dt><dd>${
                      p.stockCritico == null ? "Sin definir" : p.stockCritico
                    }</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </article>`;
    }

    function pintar(lista) {
      contenedor.innerHTML =
        lista.map((p, i) => tarjeta(p, i)).join("") ||
        '<p class="text-body-secondary">No hay productos que coincidan.</p>';
    }

    let buscador = null;
    if (window.Buscador && input) {
      buscador = window.Buscador.crear({
        input,
        items: () => Datos.productos(),
        keys: (p) => [p.codigo, p.nombre, p.descripcion, p.categoria],
        render: (lista) => pintar(lista),
      });
    } else {
      pintar(Datos.productos());
    }

    contenedor.addEventListener("click", async (evento) => {
      const boton = evento.target.closest("[data-baja]");
      if (!boton) return;
      const producto = Datos.buscarProducto(boton.dataset.baja);
      if (!producto) return;

      // HU33: advertencia si aún tiene stock (no se descuenta al dar de baja).
      const advertencia =
        producto.stock > 0
          ? ` Este producto aún tiene ${producto.stock} unidades. Se ocultará del catálogo pero el stock no se descuenta.`
          : "";
      const mensaje = `¿Dar de baja ${escapar(producto.codigo)} · ${escapar(
        producto.nombre,
      )}?${advertencia}`;
      const aceptado = await confirmar(mensaje, "Dar de baja");
      if (!aceptado) return;

      Datos.darDeBajaProducto(producto.codigo);
      if (window.Logs) {
        window.Logs.registrar({
          accion: "baja_producto",
          entidad: "producto",
          id: producto.codigo,
          stockAlMomento: producto.stock,
          datosAntes: producto,
          datosDespues: null,
          actor: actor(),
        });
      }
      if (buscador) buscador.pintar();
      else pintar(Datos.productos());
    });
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
