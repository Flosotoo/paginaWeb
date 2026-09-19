// Dominio de usuarios: alta (HU10, HU39), edición (HU40), detalle (HU41), baja
// (HU42), perfiles (HU14) y rectificaciones (HU08). Base simulada + log auxiliar.
(function () {
  if (!window.Datos || !window.Validacion) return;
  const V = window.Validacion;
  const E = window.Edusaldo;

  const nombreCompleto = (u) =>
    E
      ? E.nombreCompletoUsuario(u)
      : [u.primerNombre, u.segundoNombre, u.apellidoPaterno, u.apellidoMaterno]
          .filter(Boolean)
          .join(" ");
  const etiquetaRol = (r) => (E ? E.etiquetaRol(r) : r);
  const etiquetaCampo = (campo) =>
    E && E.etiquetasCampo ? E.etiquetasCampo[campo] || campo : campo;
  const actor = () =>
    window.Sesion && Sesion.actual() ? Sesion.actual().correo : "";

  function generarTemporal() {
    return Math.random().toString(36).slice(2, 8);
  }

  // ------------------------------------------------------------------
  // Alta y edición
  // ------------------------------------------------------------------
  const form = document.getElementById("formUsuario");
  if (form) {
    const primerNombre = document.getElementById("usuario-primer-nombre");
    const segundoNombre = document.getElementById("usuario-segundo-nombre");
    const apellidoPaterno = document.getElementById("usuario-apellido-paterno");
    const apellidoMaterno = document.getElementById("usuario-apellido-materno");
    const run = document.getElementById("usuario-run");
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
      primerNombre.value = editando.primerNombre;
      segundoNombre.value = editando.segundoNombre || "";
      apellidoPaterno.value = editando.apellidoPaterno;
      apellidoMaterno.value = editando.apellidoMaterno || "";
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
          primerNombre: primerNombre.value.trim(),
          segundoNombre: segundoNombre.value.trim(),
          apellidoPaterno: apellidoPaterno.value.trim(),
          apellidoMaterno: apellidoMaterno.value.trim(),
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
            editando.correo.toLowerCase() ===
              String(sesion.correo).toLowerCase() &&
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

  // ------------------------------------------------------------------
  // Listado (HU38) con detalle (HU41), baja (HU42) y buscador (HU27/HU38)
  // ------------------------------------------------------------------
  const contenedor = document.getElementById("lista-usuarios");
  if (contenedor) {
    const input = document.getElementById("buscar-usuarios");
    const sesion = window.Sesion ? Sesion.actual() : null;

    function tarjeta(u, i) {
      const esPropia =
        sesion &&
        u.correo.toLowerCase() === String(sesion.correo).toLowerCase();
      const sinBaja = u.estado === "inactivo" || esPropia;
      return `
        <article class="card card-body mb-4">
          <h2 class="h3 mb-2">${nombreCompleto(u)}${
            esPropia ? " (tu cuenta)" : ""
          }</h2>
          <p>${u.correo} · Perfil: ${etiquetaRol(u.rol)} · Estado: ${u.estado}</p>
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
                    <dt><span class="badge rounded-pill">Primer nombre</span></dt><dd>${u.primerNombre}</dd>
                    <dt><span class="badge rounded-pill">Segundo nombre</span></dt><dd>${u.segundoNombre || "—"}</dd>
                    <dt><span class="badge rounded-pill">Apellido paterno</span></dt><dd>${u.apellidoPaterno}</dd>
                    <dt><span class="badge rounded-pill">Apellido materno</span></dt><dd>${u.apellidoMaterno || "—"}</dd>
                    <dt><span class="badge rounded-pill">Tipo de usuario</span></dt><dd>${etiquetaRol(u.rol)}</dd>
                    <dt><span class="badge rounded-pill">Dirección</span></dt><dd>${u.direccion}, ${u.comuna}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </article>`;
    }

    function pintar(lista) {
      contenedor.innerHTML =
        lista.map((u, i) => tarjeta(u, i)).join("") ||
        '<p class="text-body-secondary">No hay usuarios que coincidan.</p>';
    }

    let buscador = null;
    if (window.Buscador && input) {
      buscador = window.Buscador.crear({
        input,
        items: () => Datos.usuarios(),
        keys: (u) => [
          u.primerNombre,
          u.segundoNombre,
          u.apellidoPaterno,
          u.apellidoMaterno,
          u.correo,
          u.run,
        ],
        render: (lista) => pintar(lista),
      });
    } else {
      pintar(Datos.usuarios());
    }

    contenedor.addEventListener("click", (evento) => {
      const boton = evento.target.closest("[data-baja]");
      if (!boton || boton.disabled) return;
      // HU42: un administrador no puede darse de baja a sí mismo.
      if (
        sesion &&
        String(sesion.correo).toLowerCase() ===
          String(boton.dataset.baja).toLowerCase()
      ) {
        return;
      }
      const usuario = Datos.buscarUsuario(boton.dataset.baja);
      Datos.darDeBajaUsuario(boton.dataset.baja);
      if (window.Logs) {
        window.Logs.registrar({
          accion: "baja_usuario",
          entidad: "usuario",
          id: boton.dataset.baja,
          datosAntes: usuario,
          datosDespues: Object.assign({}, usuario, { estado: "inactivo" }),
          actor: actor(),
        });
      }
      if (buscador) buscador.pintar();
      else pintar(Datos.usuarios());
    });
  }

  // ------------------------------------------------------------------
  // Solicitudes de rectificación (HU08 CA2/CA3)
  // ------------------------------------------------------------------
  const panelSolicitudes = document.getElementById("lista-solicitudes");
  if (panelSolicitudes) {
    function pintarSolicitudes() {
      const pendientes = Datos.solicitudesPendientes();
      panelSolicitudes.innerHTML = pendientes.length
        ? pendientes
            .map((s) => {
              const u = Datos.buscarUsuario(s.correo);
              return `
        <article class="card card-body mb-4">
          <h3 class="h5 mb-1">${u ? nombreCompleto(u) : s.correo} · ${etiquetaCampo(s.campo)}</h3>
          <p class="mb-1">Valor actual: <strong>${s.valorActual || "—"}</strong></p>
          <p class="mb-1">Valor solicitado: <strong>${s.valorSolicitado || "—"}</strong></p>
          <p class="small text-body-secondary mb-3">${new Date(s.timestamp).toLocaleString("es-CL")}</p>
          <div class="d-flex flex-wrap gap-2 align-items-center">
            <button class="btn btn-primary btn-sm" type="button" data-aprobar="${s.id}">Aprobar</button>
            <input class="form-control form-control-sm w-auto" type="text" data-motivo="${s.id}" placeholder="Motivo del rechazo" aria-label="Motivo del rechazo" />
            <button class="btn btn-outline-danger btn-sm" type="button" data-rechazar="${s.id}">Rechazar</button>
          </div>
        </article>`;
            })
            .join("")
        : '<p class="text-body-secondary">No hay solicitudes pendientes.</p>';
    }

    panelSolicitudes.addEventListener("click", (evento) => {
      const aprobar = evento.target.closest("[data-aprobar]");
      const rechazar = evento.target.closest("[data-rechazar]");
      if (aprobar) {
        const s = Datos.buscarSolicitud(aprobar.dataset.aprobar);
        if (!s) return;
        const cambios = {};
        cambios[s.campo] = s.valorSolicitado;
        Datos.actualizarUsuario(s.correo, cambios);
        Datos.actualizarSolicitud(s.id, {
          estado: "Aprobada",
          resueltoPor: actor(),
          resueltoEn: new Date().toISOString(),
        });
        if (window.Logs) {
          window.Logs.registrar({
            accion: "aprobar_rectificacion",
            entidad: "usuario",
            id: s.correo,
            datosAntes: { [s.campo]: s.valorActual },
            datosDespues: { [s.campo]: s.valorSolicitado },
            actor: actor(),
          });
        }
        pintarSolicitudes();
      }
      if (rechazar) {
        const s = Datos.buscarSolicitud(rechazar.dataset.rechazar);
        if (!s) return;
        const campo = panelSolicitudes.querySelector(
          `[data-motivo="${s.id}"]`,
        );
        const motivo = campo ? campo.value.trim() : "";
        if (!motivo) {
          if (campo) campo.focus();
          window.alert("Debes indicar el motivo del rechazo.");
          return;
        }
        Datos.actualizarSolicitud(s.id, {
          estado: "Rechazada",
          motivo,
          resueltoPor: actor(),
          resueltoEn: new Date().toISOString(),
        });
        pintarSolicitudes();
      }
    });

    pintarSolicitudes();
  }
})();
