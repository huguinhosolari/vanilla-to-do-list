import './style.css'

const STORAGE_KEY = 'tasks';
const FILTERS = {
    all: 'all',
    active: 'active',
    completed: 'completed'
};

class TaskRepository {
    load() {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return [];
        }

        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    save(tasks) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    }
}

class TaskService {
    constructor(repository) {
        this.repository = repository;
        this.tasks = [];
        this.nextTaskId = 1;
    }

    initialize() {
        this.tasks = this.repository.load();
        this.nextTaskId = this.calculateNextTaskId(this.tasks);
    }

    addTask(rawText) {
        const text = rawText.trim();
        if (!text) {
            return false;
        }

        const newTask = {
            id: this.nextTaskId,
            text,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.nextTaskId += 1;
        this.tasks.push(newTask);
        this.repository.save(this.tasks);
        return true;
    }

    toggleTask(taskId) {
        const task = this.tasks.find((item) => item.id === taskId);
        if (!task) {
            return;
        }

        task.completed = !task.completed;
        this.repository.save(this.tasks);
    }

    deleteTask(taskId) {
        this.tasks = this.tasks.filter((item) => item.id !== taskId);
        this.repository.save(this.tasks);
    }

    getFilteredTasks(filter) {
        if (filter === FILTERS.active) {
            return this.tasks.filter((task) => !task.completed);
        }

        if (filter === FILTERS.completed) {
            return this.tasks.filter((task) => task.completed);
        }

        return this.tasks;
    }

    getStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter((task) => task.completed).length;
        const active = total - completed;

        return { total, completed, active };
    }

    calculateNextTaskId(tasks) {
        if (tasks.length === 0) {
            return 1;
        }

        return Math.max(...tasks.map((task) => Number(task.id) || 0)) + 1;
    }
}

class TaskView {
    constructor() {
        this.taskInput = document.getElementById('taskInput');
        this.addButton = document.getElementById('addBtn');
        this.taskList = document.getElementById('taskList');
        this.stats = document.getElementById('stats');
        this.filterButtons = Array.from(document.querySelectorAll('.filter-btn'));
    }

    bindAddTask(handler) {
        this.addButton.onclick = handler;
        this.taskInput.onkeypress = (event) => {
            if (event.key === 'Enter') {
                handler();
            }
        };
    }

    bindFilterChange(handler) {
        this.filterButtons.forEach((button) => {
            button.onclick = () => {
                handler(button.getAttribute('data-filter'));
            };
        });
    }

    getTaskInputValue() {
        return this.taskInput.value;
    }

    clearTaskInput() {
        this.taskInput.value = '';
    }

    renderTasks(tasks, onToggleTask, onDeleteTask) {
        this.taskList.innerHTML = '';

        if (tasks.length === 0) {
            this.renderEmptyState();
            return;
        }

        tasks.forEach((task) => {
            const taskItem = document.createElement('div');
            taskItem.className = task.completed ? 'task-item completed' : 'task-item';

            const textElement = document.createElement('span');
            textElement.textContent = task.text;

            const buttonsContainer = document.createElement('div');
            buttonsContainer.className = 'task-buttons';

            const completeButton = document.createElement('button');
            completeButton.className = 'complete-btn';
            completeButton.textContent = task.completed ? 'Reactivar' : 'Completar';
            completeButton.onclick = () => onToggleTask(task.id);

            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-btn';
            deleteButton.textContent = 'Eliminar';
            deleteButton.onclick = () => onDeleteTask(task.id);

            buttonsContainer.append(completeButton, deleteButton);
            taskItem.append(textElement, buttonsContainer);
            this.taskList.appendChild(taskItem);
        });
    }

    renderStats(stats) {
        this.stats.textContent = `Total: ${stats.total} | Completadas: ${stats.completed} | Activas: ${stats.active}`;
    }

    setActiveFilter(filter) {
        this.filterButtons.forEach((button) => {
            const buttonFilter = button.getAttribute('data-filter');
            button.classList.toggle('active', buttonFilter === filter);
        });
    }

    showEmptyTaskAlert() {
        alert('Por favor escribe una tarea');
    }

    renderEmptyState() {
        const message = document.createElement('p');
        message.style.textAlign = 'center';
        message.style.color = '#999';
        message.style.padding = '20px';
        message.textContent = 'No hay tareas para mostrar';
        this.taskList.appendChild(message);
    }
}

class TodoApp {
    constructor(service, view) {
        this.service = service;
        this.view = view;
        this.currentFilter = FILTERS.all;
    }

    init() {
        this.service.initialize();
        this.bindEvents();
        this.refreshUI();
    }

    bindEvents() {
        this.view.bindAddTask(() => this.handleAddTask());
        this.view.bindFilterChange((filter) => this.handleFilterChange(filter));
    }

    handleAddTask() {
        const wasCreated = this.service.addTask(this.view.getTaskInputValue());
        if (!wasCreated) {
            this.view.showEmptyTaskAlert();
            return;
        }

        this.view.clearTaskInput();
        this.refreshUI();
    }

    handleToggleTask(taskId) {
        this.service.toggleTask(taskId);
        this.refreshUI();
    }

    handleDeleteTask(taskId) {
        this.service.deleteTask(taskId);
        this.refreshUI();
    }

    handleFilterChange(filter) {
        this.currentFilter = filter;
        this.view.setActiveFilter(this.currentFilter);
        this.refreshUI(false);
    }

    refreshUI(updateFilterState = true) {
        const filteredTasks = this.service.getFilteredTasks(this.currentFilter);
        this.view.renderTasks(
            filteredTasks,
            (taskId) => this.handleToggleTask(taskId),
            (taskId) => this.handleDeleteTask(taskId)
        );
        this.view.renderStats(this.service.getStats());

        if (updateFilterState) {
            this.view.setActiveFilter(this.currentFilter);
        }
    }
}

window.onload = () => {
    const repository = new TaskRepository();
    const service = new TaskService(repository);
    const view = new TaskView();
    const app = new TodoApp(service, view);
    app.init();
};