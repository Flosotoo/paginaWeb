// Formulario para aportar saldo
const formAporte = document.getElementById("formAporte");

formAporte.addEventListener("submit", function(event) {

    // Evita que el formulario se envíe automáticamente
    event.preventDefault();

    // Obtiene los datos ingresados en el formulario
    const hijo = document.getElementById("hijo");
    const monto = document.getElementById("monto");

    // Validar selección del hijo
    if (hijo.value == "") {
        alert("Debes seleccionar un hijo.");
        return;
    }

    // Validar monto
    if (monto.value == "" || monto.value <= 0) {
        alert("Debes ingresar un monto mayor a $0.");
        return;
    }

    // Mensaje de confirmación
    alert("Aporte registrado correctamente.");

});
// Buscador de materiales para reserva
const buscarMaterial = document.getElementById("buscarMaterial");
const material = document.getElementById("material");

if (buscarMaterial && material) {

    // Guardar los materiales originales
    const opcionesMateriales = Array.from(material.options);

    buscarMaterial.addEventListener("input", function() {

        const textoBusqueda = buscarMaterial.value.toLowerCase();

        // Limpiar el selector
        material.innerHTML = "";

        // Recorrer los materiales
        opcionesMateriales.forEach(function(opcion) {

            const nombreMaterial = opcion.text.toLowerCase();

            if (nombreMaterial.includes(textoBusqueda)) {
                material.appendChild(opcion);
            }

        });

    });

}