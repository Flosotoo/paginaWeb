// Raíz del sitio calculada desde la ubicación de ESTE archivo (assets/js/ → ../../).
// Sin esto, "index.html" desde pages/publico/ apunta a pages/publico/index.html (404).
function obtenerRaiz() {
  const script =
    document.currentScript ||
    document.querySelector('script[src$="header-footer.js"]');
  return new URL("../../", script.src).href;
}

const RAIZ = obtenerRaiz();

const headerHTML = `
  <a class="visually-hidden-focusable position-fixed top-0 start-0 z-3 bg-primary text-white px-3 py-2 rounded-bottom" href="#contenido-principal">Saltar al contenido</a>
  <header>
    <nav class="navbar navbar-expand-md bg-body-tertiary border-bottom shadow-sm" aria-label="Navegación principal">
      <div class="container">
        <a class="navbar-brand d-inline-flex align-items-center gap-2" href="${RAIZ}index.html">
          <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
            <rect x="2" y="7" width="6" height="18" rx="2" fill="#9E5837" />
            <rect x="11" y="3" width="6" height="22" rx="2" fill="#7A4229" />
            <rect x="20" y="12" width="6" height="13" rx="2" fill="#C99070" />
          </svg>
          EduSaldo
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#menu-principal" aria-controls="menu-principal" aria-expanded="false" aria-label="Abrir o cerrar el menú">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="menu-principal">
          <ul class="navbar-nav ms-auto align-items-md-center gap-md-1" id="nav-principal"></ul>
        </div>
      </div>
    </nav>
  </header>
`;

const footerHTML = `
  <footer class="bg-body-tertiary border-top py-4">
    <div class="container">
      <p class="small text-body-secondary mb-0">© 2026 EduSaldo</p>
    </div>
  </footer>
`;

// Enlaces públicos siempre visibles (pages/publico).
const ENLACES_PUBLICOS = [
  { texto: "Blog", url: `${RAIZ}pages/publico/blog.html` },
  { texto: "Cómo funciona", url: `${RAIZ}pages/publico/como-funciona.html` },
  { texto: "Contacto", url: `${RAIZ}pages/publico/contacto.html` },
];

// Menú del área, uno por carpeta de pages/ según el rol. Todo va dentro del
// desplegable "Mi panel" para no duplicar enlaces en la barra.
const AREAS = {
  Cliente: [
    { texto: "Inicio", url: `${RAIZ}pages/apoderado/inicio.html` },
    { texto: "Catálogo", url: `${RAIZ}pages/apoderado/productos.html` },
    {
      texto: "Reservar materiales",
      url: `${RAIZ}pages/apoderado/reservar-materiales.html`,
    },
    { texto: "Mis reservas", url: `${RAIZ}pages/apoderado/mis-reservas.html` },
    { texto: "Perfil", url: `${RAIZ}pages/apoderado/perfil.html` },
  ],
  Vendedor: [
    { texto: "Inicio", url: `${RAIZ}pages/libreria/inicio.html` },
    { texto: "Productos", url: `${RAIZ}pages/libreria/productos.html` },
    { texto: "Stock", url: `${RAIZ}pages/libreria/stock.html` },
    {
      texto: "Preparar reservas",
      url: `${RAIZ}pages/libreria/preparar-reservas.html`,
    },
    {
      texto: "Entregar reservas",
      url: `${RAIZ}pages/libreria/entregar-reservas.html`,
    },
    { texto: "Registrar compra", url: `${RAIZ}pages/libreria/registrar-compra.html` },
    { texto: "Ventas del día", url: `${RAIZ}pages/libreria/ventas-dia.html` },
    { texto: "Nómina", url: `${RAIZ}pages/libreria/nomina-import.html` },
  ],
  Administrador: [
    { texto: "Panel", url: `${RAIZ}pages/administrador/inicio.html` },
    { texto: "Productos", url: `${RAIZ}pages/administrador/productos.html` },
    { texto: "Usuarios", url: `${RAIZ}pages/administrador/usuarios.html` },
    {
      texto: "Estudiantes",
      url: `${RAIZ}pages/administrador/estudiantes.html`,
    },
  ],
};

function crearEnlace(texto, url, clase = "nav-link") {
  const a = document.createElement("a");
  a.className = clase;
  a.href = url;
  a.textContent = texto;
  return a;
}

function crearItem(texto, url) {
  const li = document.createElement("li");
  li.className = "nav-item";
  li.appendChild(crearEnlace(texto, url));
  return li;
}

function crearSeparador() {
  const li = document.createElement("li");
  li.className = "nav-item d-none d-md-flex align-self-stretch py-2";
  li.setAttribute("aria-hidden", "true");
  li.innerHTML = `<span class="vr"></span>`;
  return li;
}

function crearGrupo(items) {
  const fragment = document.createDocumentFragment();
  items.forEach((item) =>
    fragment.appendChild(crearItem(item.texto, item.url)),
  );
  return fragment;
}

// Desplegable "Mi panel" (dropdown de Bootstrap): es la única entrada al área
// del usuario.
function crearMenuArea(items, titulo = "Mi panel") {
  const li = document.createElement("li");
  li.className = "nav-item dropdown";

  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = "nav-link dropdown-toggle";
  boton.setAttribute("data-bs-toggle", "dropdown");
  boton.setAttribute("aria-expanded", "false");
  boton.textContent = titulo;
  li.appendChild(boton);

  const submenu = document.createElement("ul");
  submenu.className = "dropdown-menu dropdown-menu-md-end";
  items.forEach((item) => {
    const entrada = document.createElement("li");
    const enlace = crearEnlace(item.texto, item.url, "dropdown-item");
    if (item.contador) {
      // Pendientes de la jornada, a la vista sin abrir la página.
      enlace.classList.add("d-flex", "justify-content-between", "align-items-center", "gap-3");
      enlace.insertAdjacentHTML(
        "beforeend",
        `<span class="badge rounded-pill">${item.contador}</span>`,
      );
    }
    entrada.appendChild(enlace);
    submenu.appendChild(entrada);
  });
  li.appendChild(submenu);

  return li;
}

function crearAcceso(sesion) {
  const li = document.createElement("li");
  li.className = "nav-item d-md-flex align-items-md-center gap-md-2";

  if (!sesion) {
    li.appendChild(crearEnlace("Iniciar sesión", `${RAIZ}pages/acceso/login.html`));
    return li;
  }

  const usuario = document.createElement("span");
  usuario.className = "navbar-text small text-nowrap";
  const rolVisible = window.Sesion.etiquetaRol
    ? window.Sesion.etiquetaRol(sesion.rol)
    : sesion.rol;
  usuario.textContent = `${sesion.nombre} · ${rolVisible}`;
  li.appendChild(usuario);

  const salir = crearEnlace("Cerrar sesión", "#");
  salir.addEventListener("click", (evento) => {
    evento.preventDefault();
    if (window.Sesion) window.Sesion.cerrar();
    window.location.href = `${RAIZ}pages/acceso/login.html`;
  });
  li.appendChild(salir);

  return li;
}

// Área de librería: el vendedor (bibliotecario) solo ve sus tareas, agrupadas
// por momento del día, sin los enlaces del sitio público.
function esAreaLibreria() {
  return window.location.pathname.includes("/pages/libreria/");
}

function pintarNavegacionLibreria(lista, sesion) {
  const L = `${RAIZ}pages/libreria/`;
  const reservas = window.Datos ? Datos.reservas() : [];
  const cuenta = (estado) => reservas.filter((r) => r.estado === estado).length;

  lista.appendChild(crearItem("Inicio", `${L}inicio.html`));
  lista.appendChild(crearItem("Registrar compra", `${L}registrar-compra.html`));
  lista.appendChild(
    crearMenuArea(
      [
        { texto: "Preparar reservas", url: `${L}preparar-reservas.html`, contador: cuenta("Pendiente") },
        { texto: "Entregar reservas", url: `${L}entregar-reservas.html`, contador: cuenta("Lista para retiro") },
      ],
      "Reservas",
    ),
  );
  lista.appendChild(
    crearMenuArea(
      [
        { texto: "Consultar saldo", url: `${L}consulta-saldo.html` },
        { texto: "Ventas del día", url: `${L}ventas-dia.html` },
      ],
      "Caja",
    ),
  );
  lista.appendChild(
    crearMenuArea(
      [
        { texto: "Productos", url: `${L}productos.html` },
        { texto: "Stock crítico", url: `${L}stock.html` },
        { texto: "Importar nómina", url: `${L}nomina-import.html` },
      ],
      "Inventario",
    ),
  );
  lista.appendChild(crearSeparador());
  lista.appendChild(crearAcceso(sesion));

  // Tiene más entradas que la barra pública: colapsa en lg y, entre lg y xl,
  // oculta el nombre del usuario para que todo quepa en una línea.
  const barra = lista.closest(".navbar");
  if (barra) barra.classList.replace("navbar-expand-md", "navbar-expand-lg");
  [lista, ...lista.querySelectorAll("*")].forEach((el) =>
    [...el.classList]
      .filter((clase) => clase.includes("-md-"))
      .forEach((clase) => el.classList.replace(clase, clase.replace("-md-", "-lg-"))),
  );
  const usuario = lista.querySelector(".navbar-text");
  if (usuario) usuario.classList.add("d-lg-none", "d-xl-inline");
}

function pintarNavegacion() {
  const lista = document.getElementById("nav-principal");
  if (!lista) return;

  const sesion = window.Sesion ? window.Sesion.actual() : null;
  lista.replaceChildren();

  if (esAreaLibreria()) {
    pintarNavegacionLibreria(lista, sesion);
    return;
  }

  lista.appendChild(crearItem("Inicio", `${RAIZ}index.html`));
  lista.appendChild(crearSeparador());
  lista.appendChild(crearGrupo(ENLACES_PUBLICOS));

  const area = sesion ? AREAS[sesion.rol] || [] : [];
  if (area.length) {
    lista.appendChild(crearSeparador());
    lista.appendChild(crearMenuArea(area));
  }

  lista.appendChild(crearSeparador());
  lista.appendChild(crearAcceso(sesion));
}

// HU05/HU18/HU29/HU36: botón "Volver" único para todo el sitio.
// Se inyecta una sola vez y no aparece en el index raíz.
function inyectarBotonAtras() {
  const principal = document.getElementById("contenido-principal");
  if (!principal) return;
  const ruta = window.location.pathname;
  if (ruta.split("/").pop() === "index.html") return;
  // El inicio de librería es la portada del vendedor: no hay adónde volver.
  if (ruta.endsWith("/pages/libreria/inicio.html")) return;

  const wrapper = document.createElement("div");
  wrapper.className = "container";
  wrapper.innerHTML = `
    <div class="mb-3">
      <button class="btn btn-outline-primary btn-sm" type="button" data-volver>
        Volver
      </button>
    </div>
  `;
  principal.insertBefore(wrapper, principal.firstChild);
  wrapper.querySelector("[data-volver]").addEventListener("click", volver);
}

function volver() {
  let mismaOrigen = false;
  try {
    mismaOrigen =
      Boolean(document.referrer) &&
      new URL(document.referrer).origin === window.location.origin;
  } catch (error) {
    mismaOrigen = false;
  }

  if (mismaOrigen) {
    window.history.back();
  } else {
    window.location.href = destinoSeccion();
  }
}

function cerrarSesion() {
  if (window.Sesion) window.Sesion.cerrar();
  window.location.href = `${RAIZ}pages/acceso/login.html`;
}

// --------------------------------------------------------------------------
// Panel de administración: barra lateral + barra superior con buscador.
// Reemplaza la cabecera pública en las páginas del administrador (y en las de
// librería cuando entra un administrador, para no perder la navegación).
// --------------------------------------------------------------------------
const ADMIN = "pages/administrador/";
const LIBRERIA = "pages/libreria/";

const MENU_ADMIN = [
  {
    grupo: "General",
    items: [
      { texto: "Panel", icono: "speedometer2", url: `${ADMIN}inicio.html` },
      { texto: "Usuarios", icono: "people", url: `${ADMIN}usuarios.html`, contador: "usuarios" },
      { texto: "Estudiantes", icono: "mortarboard", url: `${ADMIN}estudiantes.html`, contador: "estudiantes" },
      { texto: "Productos", icono: "box-seam", url: `${ADMIN}productos.html`, contador: "criticos" },
    ],
  },
  {
    grupo: "Librería",
    items: [
      { texto: "Stock crítico", icono: "exclamation-triangle", url: `${LIBRERIA}stock.html` },
      { texto: "Preparar reservas", icono: "clipboard-check", url: `${LIBRERIA}preparar-reservas.html`, contador: "pendientes" },
      { texto: "Entregar reservas", icono: "bag-check", url: `${LIBRERIA}entregar-reservas.html`, contador: "listas" },
      { texto: "Registrar compra", icono: "cart-plus", url: `${LIBRERIA}registrar-compra.html` },
      { texto: "Ventas del día", icono: "receipt", url: `${LIBRERIA}ventas-dia.html` },
      { texto: "Importar nómina", icono: "upload", url: `${LIBRERIA}nomina-import.html` },
    ],
  },
];

function usaPanelAdmin() {
  const ruta = window.location.pathname;
  if (ruta.includes(`/${ADMIN}`)) return true;
  const sesion = window.Sesion ? window.Sesion.actual() : null;
  return ruta.includes(`/${LIBRERIA}`) && Boolean(sesion) && sesion.rol === "Administrador";
}

function contadoresAdmin() {
  if (!window.Datos) return {};
  const reservas = Datos.reservas();
  return {
    usuarios: Datos.usuarios().filter((u) => u.estado === "activo").length,
    estudiantes: Datos.estudiantes().length,
    criticos: Datos.productos().filter(
      (p) => p.stockCritico != null && p.stock <= p.stockCritico,
    ).length,
    pendientes: reservas.filter((r) => r.estado === "Pendiente").length,
    listas: reservas.filter((r) => r.estado === "Lista para retiro").length,
  };
}

function iniciales(nombre) {
  return String(nombre || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0].toUpperCase())
    .join("");
}

function escapar(texto) {
  return String(texto == null ? "" : texto).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
}

function htmlMenuAdmin() {
  const actual = window.location.pathname;
  const cuentas = contadoresAdmin();
  return MENU_ADMIN.map(
    ({ grupo, items }) => `
      <p class="text-uppercase small fw-bold px-3 mt-4 mb-2" data-rotulo>${grupo}</p>
      <ul class="nav nav-pills flex-column gap-1 px-2">
        ${items
          .map((item) => {
            const activo = actual.endsWith(`/${item.url}`);
            const cuenta = item.contador ? cuentas[item.contador] : 0;
            const alerta = item.contador === "criticos" || item.contador === "pendientes";
            return `
          <li class="nav-item">
            <a class="nav-link d-flex align-items-center gap-2${activo ? " active" : ""}"
               href="${RAIZ}${item.url}"${activo ? ' aria-current="page"' : ""}>
              <i class="bi bi-${item.icono}" aria-hidden="true"></i>
              <span class="flex-grow-1">${item.texto}</span>
              ${
                cuenta
                  ? `<span class="badge rounded-pill ${alerta ? "text-bg-danger" : "text-bg-light"}">${cuenta}</span>`
                  : ""
              }
            </a>
          </li>`;
          })
          .join("")}
      </ul>`,
  ).join("");
}

function montarPanelAdmin(headerContainer, footerContainer) {
  // Íconos oficiales de Bootstrap, solo para el panel.
  if (!document.querySelector('link[href*="bootstrap-icons"]')) {
    const iconos = document.createElement("link");
    iconos.rel = "stylesheet";
    iconos.href =
      "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css";
    document.head.appendChild(iconos);
  }

  const sesion = window.Sesion ? window.Sesion.actual() : null;
  const nombre = sesion ? sesion.nombre : "Administrador";
  const rol = sesion && window.Sesion.etiquetaRol
    ? window.Sesion.etiquetaRol(sesion.rol)
    : "Administrador";

  headerContainer.className = "";
  headerContainer.innerHTML = `
    <a class="visually-hidden-focusable position-fixed top-0 start-0 z-3 bg-primary text-white px-3 py-2 rounded-bottom" href="#contenido-principal">Saltar al contenido</a>
  `;

  const marco = document.createElement("div");
  marco.className = "d-flex flex-grow-1";
  marco.innerHTML = `
    <aside class="offcanvas-lg offcanvas-start flex-shrink-0" id="panel-lateral" tabindex="-1" aria-labelledby="panel-lateral-titulo">
      <div class="offcanvas-header">
        <p class="offcanvas-title h5 mb-0" id="panel-lateral-titulo">Menú de administración</p>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas" data-bs-target="#panel-lateral" aria-label="Cerrar menú"></button>
      </div>
      <div class="offcanvas-body d-flex flex-column p-0">
        <a class="d-flex align-items-center gap-2 px-3 py-3 text-white text-decoration-none" href="${RAIZ}${ADMIN}inicio.html" data-marca>
          <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">
            <rect x="2" y="7" width="6" height="18" rx="2" fill="#F4EAE4" />
            <rect x="11" y="3" width="6" height="22" rx="2" fill="#FFFFFF" />
            <rect x="20" y="12" width="6" height="13" rx="2" fill="#C99070" />
          </svg>
          <span class="fw-bold">EduSaldo</span>
        </a>

        <div class="text-center px-3 pt-3 pb-4 border-bottom border-light border-opacity-25">
          <p class="small text-uppercase fw-bold mb-3" data-rotulo>Bienvenida</p>
          <span class="d-inline-flex align-items-center justify-content-center rounded-circle bg-white text-primary fw-bold border border-4 border-light border-opacity-50" data-avatar aria-hidden="true">${escapar(iniciales(nombre))}</span>
          <p class="fw-bold text-uppercase mt-3 mb-0">${escapar(nombre)}</p>
          <p class="small mb-0" data-rotulo>${escapar(rol)}</p>
        </div>

        <nav aria-label="Administración">${htmlMenuAdmin()}</nav>

        <div class="mt-auto border-top border-light border-opacity-25 p-2 pt-3">
          <ul class="nav nav-pills flex-column gap-1">
            <li class="nav-item">
              <a class="nav-link d-flex align-items-center gap-2" href="${RAIZ}index.html">
                <i class="bi bi-house" aria-hidden="true"></i> Ver sitio público
              </a>
            </li>
            <li class="nav-item">
              <button class="nav-link d-flex align-items-center gap-2 w-100 text-start" type="button" data-salir>
                <i class="bi bi-box-arrow-right" aria-hidden="true"></i> Cerrar sesión
              </button>
            </li>
          </ul>
        </div>
      </div>
    </aside>

    <div class="d-flex flex-column flex-grow-1" id="contenido-admin">
      <header class="navbar sticky-top bg-body border-bottom px-3 px-lg-4 gap-2 flex-nowrap" id="barra-admin">
        <button class="btn btn-outline-primary btn-sm d-lg-none" type="button" data-bs-toggle="offcanvas" data-bs-target="#panel-lateral" aria-controls="panel-lateral" aria-label="Abrir menú">
          <i class="bi bi-list fs-5" aria-hidden="true"></i>
        </button>

        <form class="position-relative flex-grow-1" role="search" id="buscador-admin" action="#">
          <label class="visually-hidden" for="buscar-admin">Buscar en el panel</label>
          <div class="input-group">
            <span class="input-group-text bg-body"><i class="bi bi-search" aria-hidden="true"></i></span>
            <input class="form-control" type="search" id="buscar-admin" autocomplete="off"
              placeholder="Buscar usuarios, productos o estudiantes"
              aria-controls="resultados-admin" aria-expanded="false" />
          </div>
          <div class="dropdown-menu w-100 mt-1" id="resultados-admin"></div>
        </form>

        <div class="d-flex align-items-center gap-2 ms-auto">
          <button class="btn btn-outline-primary btn-sm" type="button" data-volver>
            <i class="bi bi-arrow-left" aria-hidden="true"></i><span class="d-none d-sm-inline">Volver</span>
          </button>
          <button class="btn btn-primary btn-sm" type="button" data-salir>
            <span class="d-none d-sm-inline">Cerrar sesión</span><i class="bi bi-box-arrow-right" aria-hidden="true"></i>
          </button>
        </div>
      </header>
    </div>
  `;

  headerContainer.after(marco);
  const columna = marco.querySelector("#contenido-admin");
  const principal = document.getElementById("contenido-principal");
  if (principal) {
    principal.classList.replace("pt-5", "pt-4");
    principal.querySelectorAll(":scope > .container").forEach((contenedor) => {
      contenedor.classList.replace("container", "container-fluid");
      contenedor.classList.add("px-3", "px-lg-4");
    });
    columna.appendChild(principal);
  }
  footerContainer.innerHTML = `
    <footer class="border-top py-3 px-3 px-lg-4">
      <p class="small text-body-secondary mb-0">© 2026 EduSaldo · Panel de administración</p>
    </footer>
  `;
  columna.appendChild(footerContainer);

  marco.querySelectorAll("[data-salir]").forEach((boton) =>
    boton.addEventListener("click", cerrarSesion),
  );
  marco.querySelector("[data-volver]").addEventListener("click", volver);
  conectarBuscadorAdmin(marco.querySelector("#buscador-admin"));
}

// Buscador de la barra superior: busca en la base simulada y muestra los
// resultados como un menú desplegable de Bootstrap.
function conectarBuscadorAdmin(form) {
  if (!form || !window.Datos) return;
  const campo = form.querySelector("#buscar-admin");
  const menu = form.querySelector("#resultados-admin");
  const normal = (texto) =>
    String(texto || "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase();

  function buscar(consulta) {
    const q = normal(consulta).trim();
    if (q.length < 2) return [];
    const coincide = (...campos) => campos.some((c) => normal(c).includes(q));
    const rol = (r) => (window.Sesion && Sesion.etiquetaRol ? Sesion.etiquetaRol(r) : r);
    return [
      ...Datos.usuarios()
        .filter((u) => coincide(u.nombre, u.apellidos, u.correo, u.run))
        .map((u) => ({
          icono: "person",
          titulo: `${u.nombre} ${u.apellidos}`,
          detalle: `${rol(u.rol)} · ${u.correo}`,
          url: `${RAIZ}${ADMIN}usuario-crear.html?correo=${encodeURIComponent(u.correo)}`,
        })),
      ...Datos.productos()
        .filter((p) => coincide(p.codigo, p.nombre, p.categoria))
        .map((p) => ({
          icono: "box-seam",
          titulo: `${p.codigo} · ${p.nombre}`,
          detalle: `Producto · stock ${p.stock}`,
          url: `${RAIZ}${ADMIN}producto-editar.html?codigo=${encodeURIComponent(p.codigo)}`,
        })),
      ...Datos.estudiantes()
        .filter((e) => coincide(e.id, e.nombre, e.apellido, e.curso))
        .map((e) => ({
          icono: "mortarboard",
          titulo: `${e.nombre} ${e.apellido}`,
          detalle: `Estudiante · ${e.curso}`,
          url: `${RAIZ}${ADMIN}estudiantes.html`,
        })),
    ].slice(0, 8);
  }

  function mostrar(abierto) {
    menu.classList.toggle("show", abierto);
    campo.setAttribute("aria-expanded", abierto ? "true" : "false");
  }

  function pintar() {
    const consulta = campo.value;
    const resultados = buscar(consulta);
    if (normal(consulta).trim().length < 2) {
      mostrar(false);
      return;
    }
    menu.innerHTML = resultados.length
      ? resultados
          .map(
            (r) => `
        <a class="dropdown-item d-flex align-items-center gap-2" href="${r.url}">
          <i class="bi bi-${r.icono} text-primary" aria-hidden="true"></i>
          <span class="d-flex flex-column lh-sm">
            <span>${escapar(r.titulo)}</span>
            <small class="text-body-secondary">${escapar(r.detalle)}</small>
          </span>
        </a>`,
          )
          .join("")
      : `<span class="dropdown-item-text text-body-secondary">Sin resultados para «${escapar(consulta)}».</span>`;
    mostrar(true);
  }

  campo.addEventListener("input", pintar);
  campo.addEventListener("focus", pintar);
  form.addEventListener("submit", (evento) => {
    evento.preventDefault();
    const primero = menu.querySelector("a.dropdown-item");
    if (primero) window.location.href = primero.href;
  });
  document.addEventListener("click", (evento) => {
    if (!form.contains(evento.target)) mostrar(false);
  });
  form.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape") {
      mostrar(false);
      campo.focus();
    }
  });
}

// Si no hay historial propio, se vuelve al home de la sección (no a una URL rota).
function destinoSeccion() {
  const ruta = window.location.pathname;
  if (ruta.includes("/pages/apoderado/")) return `${RAIZ}pages/apoderado/inicio.html`;
  if (ruta.includes("/pages/libreria/")) return `${RAIZ}pages/libreria/inicio.html`;
  if (ruta.includes("/pages/administrador/")) return `${RAIZ}pages/administrador/inicio.html`;
  if (ruta.includes("/pages/acceso/")) return `${RAIZ}pages/acceso/login.html`;
  if (ruta.includes("/pages/publico/")) return `${RAIZ}index.html`;
  return `${RAIZ}index.html`;
}

document.addEventListener("DOMContentLoaded", () => {
  const headerContainer = document.getElementById("header-container");
  const footerContainer = document.getElementById("footer-container");

  if (!headerContainer || !footerContainer) {
    console.warn(
      "[header-footer] Faltan #header-container o #footer-container.",
    );
    return;
  }

  if (usaPanelAdmin()) {
    montarPanelAdmin(headerContainer, footerContainer);
    return;
  }

  headerContainer.innerHTML = headerHTML;
  footerContainer.innerHTML = footerHTML;
  if (esAreaLibreria()) {
    // El logo lleva al inicio de la librería, no a la portada pública.
    const marca = headerContainer.querySelector(".navbar-brand");
    marca.href = `${RAIZ}pages/libreria/inicio.html`;
    marca.insertAdjacentHTML(
      "beforeend",
      `<span class="badge rounded-pill ms-1">Librería</span>`,
    );
  }
  pintarNavegacion();

  // Marca el enlace activo comparando el pathname actual.
  const pathActual = window.location.pathname.split("/").pop() || "index.html";
  headerContainer.querySelectorAll(".nav-link, .dropdown-item").forEach((a) => {
    const href = a.getAttribute("href") || "";
    if (href.startsWith("#")) return;
    const destino = href.split("/").pop().split("#")[0];
    if (destino === pathActual) {
      a.setAttribute("aria-current", "page");
      a.classList.add("active");
    }
  });

  // Si la página actual está dentro del área, resalta el disparador.
  const activo = headerContainer.querySelector(".dropdown-item.active");
  if (activo) {
    const menu = activo.closest(".dropdown");
    const disparador = menu && menu.querySelector(".dropdown-toggle");
    if (disparador) disparador.classList.add("active");
  }

  inyectarBotonAtras();
});
