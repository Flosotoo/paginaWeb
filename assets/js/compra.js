// HU52 (registrar compra) y HU53 (rechazo por saldo insuficiente). HTML valida
// requeridos y cantidad (min=1 step=1); el total y la comparación con el saldo
// y el stock no se pueden validar con HTML, por eso van en JavaScript.
(function () {
  const form = document.getElementById("formCompra");
  if (!form || !window.Validacion) return;

  const V = window.Validacion;
  const producto = document.getElementById("compra-producto");
  const cantidad = document.getElementById("compra-cantidad");
  const totalEl = document.getElementById("compra-total");
  const aviso = document.getElementById("compra-aviso");
  const saldo = 21510;

  const formato = (valor) => `$${valor.toLocaleString("es-CL")}`;

  function calcularTotal() {
    const opcion = producto.options[producto.selectedIndex];
    const precio = Number(opcion?.dataset.precio || 0);
    const unidades = Number(cantidad.value || 0);
    return precio * (Number.isFinite(unidades) ? unidades : 0);
  }

  function refrescarTotal() {
    if (totalEl) totalEl.textContent = formato(calcularTotal());
  }

  producto.addEventListener("change", refrescarTotal);
  cantidad.addEventListener("input", refrescarTotal);
  refrescarTotal();

  V.preparar(form, {
    alValidar: () => {
      const opcion = producto.options[producto.selectedIndex];
      const stock = Number(opcion?.dataset.stock || 0);
      const unidades = Number(cantidad.value);
      const total = calcularTotal();

      if (unidades > stock) {
        V.mostrarAviso(
          aviso,
          `No hay stock suficiente: quedan ${stock} unidades de ${opcion.text}.`,
          "error",
        );
        return;
      }

      if (total > saldo) {
        const diferencia = total - saldo;
        V.mostrarAviso(
          aviso,
          `Compra rechazada. Total ${formato(total)}, saldo disponible ${formato(saldo)} y monto faltante ${formato(diferencia)}.`,
          "error",
        );
        return;
      }

      V.mostrarAviso(
        aviso,
        `Compra confirmada por ${formato(total)}. El saldo del estudiante se descontó correctamente.`,
        "ok",
      );
    },
  });
})();
