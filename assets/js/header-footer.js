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
  <a class="ce-saltar" href="#contenido-principal">Saltar al contenido</a>
  <header class="ce-cabecera">
    <div class="ce-contenedor ce-cabecera__interior">
      <a class="ce-logo" href="${RAIZ}index.html">
        <svg class="ce-logo__marca" viewBox="0 0 32 32" aria-hidden="true">
          <rect x="2" y="7" width="6" height="18" rx="2" fill="#9E5837" />
          <rect x="11" y="3" width="6" height="22" rx="2" fill="#7A4229" />
          <rect x="20" y="12" width="6" height="13" rx="2" fill="#C99070" />
        </svg>
        EduSaldo
      </a>
      <nav class="ce-nav" aria-label="Navegación principal">
        <ul>
          <li><a href="${RAIZ}index.html">Inicio</a></li>
          <li><a href="${RAIZ}pages/publico/blog.html">Blog</a></li>
          <li><a href="${RAIZ}pages/publico/como-funciona.html">Cómo funciona</a></li>
          <li><a href="${RAIZ}pages/publico/contacto.html">Contacto</a></li>
          <li id="nav-sesion"></li>
        </ul>
      </nav>
    </div>
  </header>
`;

const footerHTML = `
  <footer class="ce-pie">
    <div class="ce-contenedor ce-pie__interior">
      <p>© 2026 EduSaldo - Centro General de Padres</p>
    </div>
  </footer>
`;

// "/sitio/" y "/sitio/index.html" cuentan como la misma página
function normalizarRuta(pathname) {
  return pathname.endsWith("/") ? `${pathname}index.html` : pathname;
}

// HU16: la cabecera muestra "Iniciar sesión" o "Cerrar sesión" según la sesión.
function pintarAccesoSesion() {
  const contenedor = document.getElementById("nav-sesion");
  if (!contenedor) return;

  const sesion = sessionStorage.getItem("edusaldoSesion");
  if (!sesion) {
    contenedor.innerHTML = `<a href="${RAIZ}pages/acceso/login.html">Iniciar sesión</a>`;
    return;
  }

  const enlace = document.createElement("a");
  enlace.href = "#";
  enlace.textContent = "Cerrar sesión";
  enlace.addEventListener("click", (evento) => {
    evento.preventDefault();
    sessionStorage.removeItem("edusaldoSesion");
    window.location.href = `${RAIZ}pages/acceso/login.html`;
  });
  contenedor.appendChild(enlace);
}

// HU05/HU18/HU29/HU36: botón "Volver" único para todo el sitio.
// Se inyecta una sola vez y no aparece en el index raíz.
function inyectarBotonAtras() {
  const principal = document.getElementById("contenido-principal");
  if (!principal) return;
  if (window.location.pathname.split("/").pop() === "index.html") return;

  const wrapper = document.createElement("div");
  wrapper.className = "ce-contenedor";
  wrapper.innerHTML = `
    <div class="ce-acciones">
      <button class="btn-ce btn-ce--secundario btn-ce--chico" type="button" data-volver>
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
  pintarAccesoSesion();

  // Marca el enlace activo comparando el pathname actual
  const pathActual = window.location.pathname.split("/").pop() || "index.html";
  const enlaces = headerContainer.querySelectorAll(".ce-nav a");
  enlaces.forEach((a) => {
    const destino = a.getAttribute("href").split("/").pop();
    if (destino === pathActual) {
      a.setAttribute("aria-current", "page");
    }
  });

  inyectarBotonAtras();
});
