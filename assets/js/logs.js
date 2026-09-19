// Log auxiliar de la demo (E1). NO es un log de sistema: al abrir con file://
// no hay backend, así que se persiste en localStorage bajo la clave
// "edusaldo.logs" como un arreglo. Cada entrada tiene una forma estable
// —{accion, entidad, id, datosAntes, datosDespues, actor, timestamp}— para
// migrarla a una tabla real en E2/E3 sin cambiar a quien la llama.
(function () {
  const CLAVE = "edusaldo.logs";

  function listar() {
    try {
      const crudo = localStorage.getItem(CLAVE);
      return crudo ? JSON.parse(crudo) : [];
    } catch (error) {
      return [];
    }
  }

  function registrar(evento) {
    const entrada = Object.assign({}, evento);
    entrada.accion = evento.accion || "";
    entrada.entidad = evento.entidad || "";
    entrada.id = evento.id == null ? "" : evento.id;
    entrada.datosAntes = evento.datosAntes == null ? null : evento.datosAntes;
    entrada.datosDespues =
      evento.datosDespues == null ? null : evento.datosDespues;
    entrada.actor = evento.actor || "";
    entrada.timestamp = new Date().toISOString();
    try {
      const lista = listar();
      lista.push(entrada);
      localStorage.setItem(CLAVE, JSON.stringify(lista));
    } catch (error) {
      /* sin almacenamiento disponible */
    }
    return entrada;
  }

  function limpiar() {
    try {
      localStorage.removeItem(CLAVE);
    } catch (error) {
      /* ignore */
    }
  }

  window.Logs = { registrar, listar, limpiar, CLAVE };
})();
