// Formulario de aporte (HU68, fuera de E1). HTML valida requeridos y monto
// (type=number min=1 step=1); aquí solo queda preparar el paso a Webpay.
(function () {
  const form = document.getElementById("formAporte");
  if (!form || !window.Validacion) return;

  const aviso = document.getElementById("aporte-aviso");

  window.Validacion.preparar(form, {
    alValidar: () =>
      window.Validacion.mostrarAviso(
        aviso,
        "Aporte preparado para continuar a Webpay.",
        "info",
      ),
  });
})();


// ======================================================
// RESERVA DE MATERIALES
// ======================================================

// Buscar las tarjetas de hijos disponibles
const hijosReserva = document.querySelectorAll(".hijo-reserva");

// Elementos del carrito
const saldoInicialTexto = document.getElementById("saldoInicial");
const saldoRestanteTexto = document.getElementById("saldoRestante");
const carritoVacio = document.getElementById("carritoVacio");

// Variables de la reserva
let hijoSeleccionado = "";
let saldoDisponible = 0;


// Seleccionar hijo
hijosReserva.forEach(function(tarjeta) {

    tarjeta.addEventListener("click", function() {

        // Obtener datos de la tarjeta seleccionada
        hijoSeleccionado = tarjeta.dataset.hijo;
        saldoDisponible = Number(tarjeta.dataset.saldo);

        // Quitar selecci├│n de todas las tarjetas
        hijosReserva.forEach(function(hijo) {
            hijo.classList.remove("border-primary");
        });

        // Destacar la tarjeta seleccionada
        tarjeta.classList.add("border-primary");

        // Mostrar saldo del hijo seleccionado
        if (saldoInicialTexto) {
            saldoInicialTexto.textContent =
                "$" + saldoDisponible.toLocaleString("es-CL");
        }

        if (saldoRestanteTexto) {
            saldoRestanteTexto.textContent =
                "$" + saldoDisponible.toLocaleString("es-CL");
        }

        if (carritoVacio) {
            carritoVacio.textContent =
                "Aún no has agregado materiales.";
        }

    });

});
// ======================================================
// AGREGAR PRODUCTOS AL CARRITO
// ======================================================

const botonesAgregar = document.querySelectorAll(".agregar-material");
const listaCarrito = document.getElementById("listaCarrito");
const totalReservaTexto = document.getElementById("totalReserva");

let carritoReserva = [];

botonesAgregar.forEach(function(boton) {

    boton.addEventListener("click", function() {

        // Primero debe seleccionar un hijo
        if (hijoSeleccionado == "") {
            alert("Primero debes seleccionar un hijo.");
            return;
        }

        const nombre = boton.dataset.nombre;
        const precio = Number(boton.dataset.precio);

        // Buscar la cantidad del mismo producto
        const filaProducto = boton.closest("tr");
        const inputCantidad =
            filaProducto.querySelector(".cantidad-material");

        const cantidad = Number(inputCantidad.value);

        // Validar cantidad
        if (cantidad < 1) {
            alert("La cantidad debe ser mayor a 0.");
            return;
        }

        const subtotal = precio * cantidad;

        // Guardar producto en el carrito
        carritoReserva.push({
            nombre: nombre,
            precio: precio,
            cantidad: cantidad,
            subtotal: subtotal
        });

        mostrarCarrito();

    });

});


function mostrarCarrito() {

    listaCarrito.innerHTML = "";

    let total = 0;

    carritoReserva.forEach(function(producto) {

        total = total + producto.subtotal;

        listaCarrito.innerHTML += `
            <div class="border-bottom py-2">
                <strong>${producto.nombre}</strong><br>

                <small>
                    ${producto.cantidad} x
                    $${producto.precio.toLocaleString("es-CL")}
                </small>

                <span class="float-end">
                    $${producto.subtotal.toLocaleString("es-CL")}
                </span>
            </div>
        `;

    });

    // Validar que no supere el saldo disponible
    if (total > saldoDisponible) {

        alert("El total de la reserva supera el saldo disponible.");

        carritoReserva.pop();

        mostrarCarrito();

        return;
    }

    carritoVacio.style.display = "none";

    totalReservaTexto.textContent =
        "$" + total.toLocaleString("es-CL");

    saldoRestanteTexto.textContent =
        "$" + (saldoDisponible - total).toLocaleString("es-CL");
}
