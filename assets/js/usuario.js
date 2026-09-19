// Dominio de usuarios: alta con contraseña temporal (HU10, HU39), edición
// (HU40), detalle (HU41), baja (HU42) y perfil (HU14). Lee y escribe en la
// base simulada.
(function () {
  if (!window.Datos || !window.Validacion) return;
  const V = window.Validacion;

  function generarTemporal() {
    return Math.random().toString(36).slice(2, 8);
  }

  const form = document.getElementById("formUsuario");
  if (form) {
    const run = document.getElementById("usuario-run");
    const nombre = document.getElementById("usuario-nombre");
    const apellidos = document.getElementById("usuario-apellidos");
    const correo = document.getElementById("usuario-correo");
    const nacimiento = document.getElementById("usuario-nacimiento");
    const tipo = document.getElementById("usuario-tipo");
    const region = document.getElementById("usuario-region");
    const comuna = document.getElementById("usuario-comuna");
    const direccion = document.getElementById("usuario-direccion");
    const aviso = document.getElementById("usuario-aviso");
    const titulo = document.getElementById("titulo-usuario");

    // HU40: edición: carga los datos y deja el RUN en solo lectura.
    const correoEditar = new URLSearchParams(window.location.search).get(
      "correo",
    );
    const editando = correoEditar ? Datos.buscarUsuario(correoEditar) : null;

    V.conectarRegionComuna(region, comuna);

    if (editando) {
      if (titulo) titulo.textContent = "Editar usuario";
      run.value = editando.run;
      run.readOnly = true;
      nombre.value = editando.nombre;
      apellidos.value = editando.apellidos;
      correo.value = editando.correo;
      nacimiento.value = editando.nacimiento || "";
      tipo.value = editando.rol;
      direccion.value = editando.direccion;
      region.value = editando.region;
      region.dispatchEvent(new Event("change"));
      comuna.value = editando.comuna;
    }

    V.preparar(form, {
      cruzadas: [
        { campo: run, validar: (valor) => V.mensajeRun(valor) },
        {
          campo: comuna,
          dependeDe: [region, comuna],
          validar: (valor) =>
            V.comunaPertenece(region.value, valor)
              ? ""
              : "La comuna no pertenece a la región seleccionada.",
        },
      ],
      alValidar: () => {
        const datos = {
          run: run.value.trim(),
          nombre: nombre.value.trim(),
          apellidos: apellidos.value.trim(),
          correo: correo.value.trim().toLowerCase(),
          nacimiento: nacimiento.value,
          rol: tipo.value,
          region: region.value,
          comuna: comuna.value,
          direccion: direccion.value.trim(),
        };

        if (editando) {
          // HU40 CA6: no puede quitarse a sí mismo el perfil Administrador.
          const sesion = window.Sesion ? Sesion.actual() : null;
          if (
            sesion &&
            editando.correo.toLowerCase() === String(sesion.correo).toLowerCase() &&
            datos.rol !== "Administrador"
          ) {
            V.mostrarAviso(
              aviso,
              "No puedes cambiar tu propio perfil a uno distinto de Administrador.",
              "error",
            );
            return;
          }
          Datos.actualizarUsuario(editando.correo, datos);
          V.mostrarAviso(aviso, "Usuario actualizado correctamente.", "ok");
          window.setTimeout(
            () => window.location.assign("usuarios.html"),
            700,
          );
          return;
        }

        if (Datos.buscarUsuario(datos.correo)) {
          V.mostrarAviso(
            aviso,
            "Ya existe una cuenta con ese correo.",
            "error",
          );
          return;
        }

        // HU39 CA8/CA9: sin campo de contraseña; se genera una temporal.
        const temporal = generarTemporal();
        Datos.crearUsuario(
          Object.assign({}, datos, {
            clave: temporal,
            temporal: true,
            consentimiento: false,
            estado: "activo",
          }),
        );
        V.mostrarAviso(
          aviso,
          `Usuario creado. Contraseña temporal (se muestra solo ahora): ${temporal}. El usuario deberá cambiarla en su primer ingreso.`,
          "ok",
        );
        form.reset();
      },
    });
  }

  // HU38/HU41/HU42: listado, detalle y baja.
  const contenedor = document.getElementById("lista-usuarios");
  if (contenedor) {
    function pintar() {
      const sesion = window.Sesion ? Sesion.actual() : null;
      const usuarios = Datos.usuarios();
      const rol = (r) =>
        window.Edusaldo ? Edusaldo.etiquetaRol(r) : r;
      contenedor.innerHTML = usuarios
        .map((u, i) => {
          const esPropia =
            sesion &&
            u.correo.toLowerCase() === String(sesion.correo).toLowerCase();
          const sinBaja = u.estado === "inactivo" || esPropia;
          return `
        <article class="card card-body mb-4">
          <h2 class="h3 mb-2">${u.nombre} ${u.apellidos}${
            esPropia ? " (tu cuenta)" : ""
          }</h2>
          <p>${u.correo} · Perfil: ${rol(u.rol)} · Estado: ${u.estado}</p>
          <div class="d-flex flex-wrap align-items-center gap-3 mt-4">
            <a class="btn btn-outline-primary btn-sm" href="usuario-crear.html?correo=${encodeURIComponent(u.correo)}">Editar</a>
            <button class="btn btn-outline-danger btn-sm" type="button" data-baja="${u.correo}" ${
              sinBaja ? "disabled" : ""
            } ${esPropia ? 'title="No puedes dar de baja tu propia cuenta"' : ""}>
              ${esPropia ? "Tu cuenta" : "Dar de baja"}
            </button>
          </div>
          <div class="accordion accordion-flush" id="det-${i}">
                <div class="accordion-item">
                  <h3 class="accordion-header">
                    <button class="accordion-button collapsed px-0" type="button" data-bs-toggle="collapse" data-bs-target="#det-${i}-c" aria-expanded="false" aria-controls="det-${i}-c">Ver detalle</button>
                  </h3>
                  <div id="det-${i}-c" class="accordion-collapse collapse" data-bs-parent="#det-${i}">
                    <div class="accordion-body px-0">
            <dl class="mb-3">
              <dt><span class="badge rounded-pill">RUN</span></dt><dd>${u.run}</dd>
              <dt><span class="badge rounded-pill">Tipo de usuario</span></dt><dd>${rol(u.rol)}</dd>
              <dt><span class="badge rounded-pill">Dirección</span></dt><dd>${u.direccion}, ${u.comuna}</dd>
            </dl>
</div>
                  </div>
                </div>
              </div>
        </article>`;
        })
        .join("");
    }

    contenedor.addEventListener("click", (evento) => {
      const boton = evento.target.closest("[data-baja]");
      if (!boton || boton.disabled) return;
      // HU42: un administrador no puede darse de baja a sí mismo.
      const sesion = window.Sesion ? Sesion.actual() : null;
      if (
        sesion &&
        String(sesion.correo).toLowerCase() ===
          String(boton.dataset.baja).toLowerCase()
      ) {
        return;
      }
      Datos.darDeBajaUsuario(boton.dataset.baja);
      pintar();
    });

    pintar();
  }
})();
