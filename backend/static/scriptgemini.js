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


// ... (El código del 'DOMContentLoaded' y del mensaje motivacional se queda igual) ...
