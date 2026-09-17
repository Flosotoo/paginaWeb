// Raíz del sitio calculada desde la ubicación de ESTE archivo (assets/js/ → ../../).
// Sin esto, "index.html" desde pages/publico/ apunta a pages/publico/index.html (404).
function obtenerRaiz() {
  const script =
    document.currentScript ||
    document.querySelector('script[src$="header-footer.js"]');
  return new URL('../../', script.src).href;
}
 
const RAIZ = obtenerRaiz();
 
// El logo es texto fijo, no un enlace. Para volver al inicio se usa "Inicio".
const headerHTML = `
  <a class="ce-saltar" href="#contenido-principal">Saltar al contenido</a>
  <header class="ce-cabecera">
    <div class="ce-contenedor ce-cabecera__interior">
      <span class="ce-logo">EduSaldo</span>
      <nav class="ce-nav" aria-label="Navegación principal">
        <ul>
          <li><a href="${RAIZ}index.html">Inicio</a></li>
          <li><a href="${RAIZ}pages/publico/como-funciona.html">Cómo funciona</a></li>
          <li><a href="${RAIZ}pages/publico/nosotros.html">Nosotros</a></li>
          <li><a href="${RAIZ}pages/publico/contacto.html">Contacto</a></li>
          <li><a href="${RAIZ}pages/acceso/login.html">Iniciar sesión</a></li>
        </ul>
      </nav>
    </div>
  </header>
`;
 
const footerHTML = `
  <footer class="ce-pie">
    <div class="ce-contenedor ce-pie__interior">
      <p>© 2026 EduSaldo — Centro General de Padres</p>
    </div>
  </footer>
`;
 
// "/sitio/" y "/sitio/index.html" cuentan como la misma página
function normalizarRuta(pathname) {
  return pathname.endsWith('/') ? `${pathname}index.html` : pathname;
}
 
document.addEventListener('DOMContentLoaded', () => {
  const headerContainer = document.getElementById('header-container');
  const footerContainer = document.getElementById('footer-container');
 
  if (!headerContainer || !footerContainer) {
    console.warn('[header-footer] Faltan #header-container o #footer-container.');
    return;
  }
 
  headerContainer.innerHTML = headerHTML;
  footerContainer.innerHTML = footerHTML;

  // Marca el enlace activo comparando el pathname actual
  const pathActual = window.location.pathname.split('/').pop() || 'index.html';
  const enlaces = headerContainer.querySelectorAll('.ce-nav a');
  enlaces.forEach((a) => {
    const destino = a.getAttribute('href').split('/').pop();
    if (destino === pathActual) {
      a.setAttribute('aria-current', 'page');
    }
  });
});