import './style.css'

let tasks = [];
let taskId = 1;
let currentFilter = 'all';


window.onload = function() {
    let savedTasks = localStorage.getItem('tasks');

    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
        taskId = tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1;
    }
    
    document.getElementById('addBtn').onclick = addTask;
    
    let filterButtons = document.querySelectorAll('.filter-btn');
    for (let i = 0; i < filterButtons.length; i++) {
        filterButtons[i].onclick = function() {
            filterTasks(this.getAttribute('data-filter'));
        };
    }
    
    document.getElementById('taskInput').onkeypress = function(e) {
        if (e.key === 'Enter') {
            addTask();
        }
    };
    
    renderTasks();
    updateStats();
};

function addTask() {
    let input = document.getElementById('taskInput');
    let text = input.value;
    
    if (text == '') {
        alert('Por favor escribe una tarea');
        return;
    }
    

    let newTask = {
        id: taskId++,
        text: text,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    tasks.push(newTask);
    localStorage.setItem('tasks', JSON.stringify(tasks));
    
    input.value = '';
    
    renderTasks();
    updateStats();
}


function renderTasks() {
    let taskList = document.getElementById('taskList');
    taskList.innerHTML = ''; 

    let filteredTasks = tasks;
    if (currentFilter == 'active') {
        filteredTasks = tasks.filter(function(task) {
            return !task.completed;
        });
    } else if (currentFilter == 'completed') {
        filteredTasks = tasks.filter(function(task) {
            return task.completed;
        });
    }
    

    for (let i = 0; i < filteredTasks.length; i++) {
        let task = filteredTasks[i];
        let taskDiv = document.createElement('div');
        taskDiv.className = 'task-item';
        
        if (task.completed) {
            taskDiv.className = 'task-item completed';
        }
        
        taskDiv.innerHTML = 
            `<span>${task.text}</span>
            <div class="task-buttons">
              <button class="complete-btn" data-id="${task.id}">
                ${task.completed ? "Reactivar" : "Completar"}
              </button>
              <button class="delete-btn" data-id="${task.id}">Eliminar</button>
            </div>`;

        let completeBtn = taskDiv.querySelector('.complete-btn');
        let deleteBtn = taskDiv.querySelector('.delete-btn');
        
        completeBtn.onclick = function() {
            toggleTask(parseInt(this.getAttribute('data-id')));
        };
        
        deleteBtn.onclick = function() {
            deleteTask(parseInt(this.getAttribute('data-id')));
        };
        
        taskList.appendChild(taskDiv);
    }
    
    if (filteredTasks.length === 0) {
        taskList.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">No hay tareas para mostrar</p>';
    }
}

function toggleTask(id) {
    for (let i = 0; i < tasks.length; i++) {
        if (tasks[i].id == id) {
            tasks[i].completed = !tasks[i].completed;
            break;
        }
    }
    
    localStorage.setItem('tasks', JSON.stringify(tasks));
    
    renderTasks();
    updateStats();
}

function deleteTask(id) {
    let newTasks = [];
    for (let i = 0; i < tasks.length; i++) {
        if (tasks[i].id != id) {
            newTasks.push(tasks[i]);
        }
    }
    tasks = newTasks;
    localStorage.setItem('tasks', JSON.stringify(tasks));
    
    renderTasks();
    updateStats();
    highlightRemainingTasks();
}

function highlightRemainingTasks() {
    let remainingTasks = document.querySelectorAll('#taskList .task-item');

    for (let i = 0; i < remainingTasks.length; i++) {
        let taskElement = remainingTasks[i];

        taskElement.classList.remove('remaining-highlight');

        // Restart animation reliably when deleting multiple tasks quickly.
        void taskElement.offsetWidth;

        taskElement.classList.add('remaining-highlight');

        setTimeout(function() {
            taskElement.classList.remove('remaining-highlight');
        }, 700);
    }
}

function filterTasks(filter) {
    currentFilter = filter;
    
    let buttons = document.querySelectorAll('.filter-btn');
    for (let i = 0; i < buttons.length; i++) {
        buttons[i].classList.remove('active');
    }
    
    if (filter == 'all') {
        buttons[0].classList.add('active');
    } else if (filter == 'active') {
        buttons[1].classList.add('active');
    } else {
        buttons[2].classList.add('active');
    }
    
    renderTasks();
}

function updateStats() {
    let total = tasks.length;
    let completed = 0;
    let active = 0;
    
    for (let i = 0; i < tasks.length; i++) {
        if (tasks[i].completed) {
            completed++;
        } else {
            active++;
        }
    }
    
    let statsDiv = document.getElementById('stats');
    statsDiv.innerHTML = 'Total: ' + total + ' | Completadas: ' + completed + ' | Activas: ' + active;
}