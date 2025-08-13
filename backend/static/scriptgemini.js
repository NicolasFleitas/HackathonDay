// Este evento se asegura de que nuestro código se ejecute solo cuando
// todo el contenido de la página (el DOM) se haya cargado.
document.addEventListener('DOMContentLoaded', () => {

    // Obtenemos una referencia al elemento textarea por su ID.
    const messageTextarea = document.getElementById('motivationalMessage');

    // Definimos una función asíncrona para obtener el mensaje.
    // Usar async/await hace que el código sea más legible.
    const fetchMotivationalMessage = async () => {
        try {
            // Hacemos una petición GET a nuestra propia API en el backend.
            // El navegador se encargará de añadir el dominio y puerto correctos.
            const response = await fetch('/get-motivational-message');

            // Si la respuesta del servidor no es exitosa (ej: error 500),
            // lanzamos un error para ser capturado por el bloque catch.
            if (!response.ok) {
                throw new Error(`Error del servidor: ${response.status}`);
            }

            // Convertimos la respuesta de formato JSON a un objeto de JavaScript.
            const data = await response.json();

            // Actualizamos el valor del textarea con el mensaje recibido.
            if (data.message) {
                messageTextarea.value = data.message;
            } else {
                // Si la respuesta no contiene un mensaje, mostramos un error.
                messageTextarea.value = "Error: No se recibió un mensaje válido.";
            }

        } catch (error) {
            // Si ocurre cualquier error durante la petición (ej: red caída, error del servidor),
            // lo mostramos en la consola y en el textarea para informar al usuario.
            console.error('Error al obtener el mensaje:', error);
            messageTextarea.value = "Cree en ti, el resto seguirá !!";
        }
    };

    // Llamamos a la función para que se ejecute en cuanto la página cargue.
    fetchMotivationalMessage();
});


// static/js/main.js

// ... (El código del 'DOMContentLoaded' y del mensaje motivacional se queda igual) ...

document.addEventListener('DOMContentLoaded', () => {

    // ... (Tu código existente para fetchMotivationalMessage) ...

    // --- LÓGICA PARA EL GENERADOR DE ÍCONOS (VERSIÓN MEJORADA) ---

    // 1. Obtenemos las referencias a nuestros elementos HTML
    const iconInput = document.getElementById('iconInput');
    const generateIconButton = document.getElementById('generateIconButton');
    const iconResultContainer = document.getElementById('iconResultContainer');

    // 2. Creamos una función reutilizable que contiene toda la lógica de generación.
    //    Esto es una buena práctica para no repetir código (principio DRY).
    const handleIconGeneration = async () => {
        // Obtenemos el texto del input y quitamos espacios en blanco
        const description = iconInput.value.trim();

        // Validamos que el usuario haya escrito algo
        if (!description) {
            alert('Por favor, escribe una descripción para el ícono.');
            return; // Detenemos la función si no hay texto
        }

        // Mostramos un estado de carga para que el usuario sepa que algo está pasando
        iconResultContainer.innerHTML = 'Generando...';

        try {
            // Hacemos la llamada fetch a nuestra API de backend
            const response = await fetch('/generate-icon', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ description: description }),
            });

            if (!response.ok) {
                throw new Error('La respuesta del servidor no fue exitosa.');
            }

            const data = await response.json();

            // Mostramos el ícono SVG o un mensaje de error
            if (data.svg_code) {
                iconResultContainer.innerHTML = data.svg_code;
            } else {
                iconResultContainer.innerHTML = 'Error al generar.';
            }

        } catch (error) {
            console.error('Error al generar el ícono:', error);
            iconResultContainer.innerHTML = 'Falló la petición.';
        }
    };

    // 3. Asignamos la función al evento 'click' del botón.
    //    Ahora el botón simplemente llama a nuestra función principal.
    generateIconButton.addEventListener('click', handleIconGeneration);

    // 4. (ESTA ES LA PARTE NUEVA) Asignamos un evento al input para escuchar las teclas.
    iconInput.addEventListener('keydown', (event) => {
        // Verificamos si la tecla presionada fue 'Enter'.
        // 'event.key' es la forma moderna y recomendada de hacer esto.
        if (event.key === 'Enter') {
            // Prevenimos el comportamiento por defecto del 'Enter' en un formulario,
            // que normalmente recargaría la página. ¡Esto es muy importante!
            event.preventDefault(); 
            
            // Llamamos a la misma función que usa el botón.
            handleIconGeneration();
        }
    });

}); // Fin del addEventListener 'DOMContentLoaded'