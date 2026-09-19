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
function crearMenuArea(items) {
  const li = document.createElement("li");
  li.className = "nav-item dropdown";

  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = "nav-link dropdown-toggle";
  boton.setAttribute("data-bs-toggle", "dropdown");
  boton.setAttribute("aria-expanded", "false");
  boton.textContent = "Mi panel";
  li.appendChild(boton);

  const submenu = document.createElement("ul");
  submenu.className = "dropdown-menu dropdown-menu-md-end";
  items.forEach((item) => {
    const entrada = document.createElement("li");
    entrada.appendChild(crearEnlace(item.texto, item.url, "dropdown-item"));
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

function pintarNavegacion() {
  const lista = document.getElementById("nav-principal");
  if (!lista) return;

  const sesion = window.Sesion ? window.Sesion.actual() : null;
  lista.replaceChildren();

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
  if (window.location.pathname.split("/").pop() === "index.html") return;

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

  wrapper.querySelector("[data-volver]").addEventListener("click", () => {
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

  headerContainer.innerHTML = headerHTML;
  footerContainer.innerHTML = footerHTML;
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
