const frames = [
  '/static/hearts.png',
  '/static/hearts.png',
  '/static/hearts.png',
  '/static/hearts.png',
  '/static/hearts.png',
];

let currentFrame = 0;
let imagesShown = 0;

// Function to update hearts display based on backend vidas
function updateHearts() {
  fetch('/get_vidas')
    .then(res => res.json())
    .then(data => {
      const vidas = data.vidas || 0;
      const heartsContainer = document.getElementById('heartscontainers');
      heartsContainer.innerHTML = ''; // Clear old hearts

      for (let i = 0; i < vidas && i < frames.length; i++) {
        const img = document.createElement('img');
        img.src = frames[i];
        img.alt = 'Heart animation frame';
        img.style.marginRight = '5px';
        heartsContainer.appendChild(img);
      }

      imagesShown = vidas;
      currentFrame = vidas % frames.length;
    })
    .catch(err => console.error('Error fetching vidas:', err));
}

// Function to add a task to DOM with complete/edit/delete options
function addTaskToDOM(messageObj) {
  const { id, content, completed } = messageObj;
  const messagesContainer = document.getElementById('messagesContainer');
  const completedContainer = document.getElementById('completedTasksContainer');

  const taskDiv = document.createElement('div');
  taskDiv.style.display = 'flex';
  taskDiv.style.alignItems = 'center';
  taskDiv.style.marginBottom = '8px';
  taskDiv.classList.add('d-flex', 'justify-content-between', 'align-items-center', 'bg-light', 'p-2', 'rounded', 'task-divider');

  const taskText = document.createElement('span');
  taskText.textContent = content;
  taskText.style.flexGrow = '1';

  taskDiv.appendChild(taskText);

  if (!completed) {
    // Create Complete button
    const completeButton = document.createElement('button');
    completeButton.style.marginLeft = '10px';
    completeButton.classList.add('btn', 'btn-success', 'btn-sm');
    completeButton.innerHTML = '<i class="bi bi-check-circle-fill"></i>';

    // Create Edit button
    const editButton = document.createElement('button');
    editButton.style.marginLeft = '10px';
    editButton.classList.add('btn', 'btn-warning', 'btn-sm');
    editButton.innerHTML = '<i class="bi bi-pencil-square"></i>';

    // Create Delete button
    const deleteButton = document.createElement('button');
    deleteButton.style.marginLeft = '10px';
    deleteButton.classList.add('btn', 'btn-danger', 'btn-sm');
    deleteButton.innerHTML = '<i class="bi bi-trash-fill"></i>';

    taskDiv.appendChild(completeButton);
    taskDiv.appendChild(editButton);
    taskDiv.appendChild(deleteButton);

    // Complete button handler
    completeButton.addEventListener('click', () => {
      fetch(`/complete-task/${id}`, { method: 'POST' })
        .then(response => {
          if (!response.ok) throw new Error('Failed to mark completed');

          // Move task to completed container, remove buttons
          taskDiv.innerHTML = '';
          taskText.textContent = content;
          taskDiv.appendChild(taskText);
          completedContainer.appendChild(taskDiv);

          updateHearts();
        })
        .catch(() => alert('Error marking task as completed'));
    });

    // Edit button handler
    editButton.addEventListener('click', () => {
      const newContent = prompt('Editar tarea:', taskText.textContent);
      if (newContent !== null && newContent.trim() !== '') {
        fetch(`/edit-task/${id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: newContent.trim() }),
        })
        .then(response => {
          if (!response.ok) throw new Error('Error editing task');
          taskText.textContent = newContent.trim();
        })
        .catch(() => alert('Error editing task'));
      }
    });

    // Delete button handler
    deleteButton.addEventListener('click', () => {
      if (confirm('¿Estás seguro de eliminar esta tarea?')) {
        fetch(`/delete-task/${id}`, { method: 'DELETE' })
          .then(response => {
            if (!response.ok) throw new Error('Error deleting task');
            taskDiv.remove();
          })
          .catch(() => alert('Error deleting task'));
      }
    });

    messagesContainer.appendChild(taskDiv);
  } else {
    // Completed tasks: no buttons, just text in completed container
    completedContainer.appendChild(taskDiv);
  }
}

// Load existing tasks and hearts on page load
window.addEventListener('DOMContentLoaded', () => {
  fetch('/messages')
    .then(response => response.json())
    .then(data => {
      document.getElementById('messagesContainer').innerHTML = '';
      document.getElementById('completedTasksContainer').innerHTML = '';
      imagesShown = 0;
      currentFrame = 0;

      data.messages.forEach(msg => addTaskToDOM(msg));
    })
    .catch(() => console.error('Error loading messages'));

  updateHearts();
});

// Handle new task submissions
document.getElementById('taskForm').addEventListener('submit', (event) => {
  event.preventDefault();

  const input = document.getElementById('inputMessage');
  const message = input.value.trim();
  if (message === "") return;

  fetch('/button-click', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  })
  .then(response => {
    if (!response.ok) throw new Error('Network response was not ok');
    return response.text();
  })
  .then(() => {
    // Reload tasks to get correct IDs and status
    fetch('/messages')
      .then(response => response.json())
      .then(data => {
        document.getElementById('messagesContainer').innerHTML = '';
        document.getElementById('completedTasksContainer').innerHTML = '';
        imagesShown = 0;
        currentFrame = 0;
        data.messages.forEach(msg => addTaskToDOM(msg));
      });
    input.value = '';
  })
  .catch(() => alert('Error sending message'));
});


document.getElementById('deleteCompletedBtn').addEventListener('click', () => {
  if (confirm('¿Estás seguro de eliminar todas las tareas completadas y reiniciar los corazones?')) {
    fetch('/delete-completed-tasks', { method: 'POST' })
      .then(response => {
        if (!response.ok) throw new Error('Error eliminando tareas completadas');
        // Clear completed tasks container and hearts container in UI
        document.getElementById('completedTasksContainer').innerHTML = '';
        document.getElementById('heartscontainers').innerHTML = '';
        alert('Tareas completadas eliminadas y corazones reiniciados');
      })
      .catch(() => alert('Error al eliminar tareas completadas'));
  }
});
