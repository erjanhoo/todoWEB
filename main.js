
const API_URL = 'https://dummyjson.com/todos';

const todoList = document.getElementById('todoList');
const addBtn = document.getElementById('addBtn');
const todoModal = document.getElementById('todoModal');
const todoInput = document.getElementById('todoInput');
const saveBtn = document.getElementById('saveBtn');
const cancelBtn = document.getElementById('cancelBtn');
const searchInput = document.getElementById('searchInput');
const filterBtns = document.querySelectorAll('.filter-btn');
const themeToggle = document.getElementById('themeToggle');
const modalTitle = document.getElementById('modalTitle');

let todos = [];
let currentFilter = 'all';
let editingTodoId = null;


document.addEventListener('DOMContentLoaded', () => {
    loadTodos();
    initializeEventListeners();
    loadTheme();
});


function initializeEventListeners() {
    addBtn.addEventListener('click', openAddModal);
    saveBtn.addEventListener('click', saveTodo);
    cancelBtn.addEventListener('click', closeModal);
    searchInput.addEventListener('input', handleSearch);
    themeToggle.addEventListener('click', toggleTheme);

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            loadTodos();
        });
    });

    todoModal.addEventListener('click', (e) => {
        if (e.target === todoModal) {
            closeModal();
        }
    });

    todoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveTodo();
        }
    });
}

function saveTodosToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function loadTodosFromStorage() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        todos = JSON.parse(stored);
        if (todos.length > 0) {
            nextId = Math.max(...todos.map(t => t.id)) + 1;
        }
        return true;
    }
    return false;
}

async function loadTodos() {
    try {
        if (loadTodosFromStorage()) {
            renderTodos();
            return;
        }
        
        const response = await fetch(API_URL);
        const data = await response.json();
        todos = data.todos || [];
        if (todos.length > 0) {
            nextId = Math.max(...todos.map(t => t.id)) + 1;
        }
        saveTodosToStorage();
        renderTodos();
    } catch (error) {
        console.error('Error loading todos:', error);
        showError('Failed to load todos');
    }
}

function createTodo(title) {
    const newTodo = {
        id: nextId++,
        todo: title,
        completed: false,
        userId: 1
    };
    
    todos.push(newTodo);
    saveTodosToStorage();
    renderTodos();
    return newTodo;
}

function updateTodo(id, updates) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        Object.assign(todo, updates);
        saveTodosToStorage();
        renderTodos();
    }
}

function deleteTodo(id) {
    todos = todos.filter(t => t.id !== id);
    saveTodosToStorage();
    renderTodos();
}

// UI Functions
function renderTodos() {
    console.log('Rendering todos. Total:', todos.length);
    const searchTerm = searchInput.value.toLowerCase();
    let filteredTodos = todos.filter(todo =>
        todo.todo.toLowerCase().includes(searchTerm)
    );

    // Apply completion filter
    if (currentFilter === 'active') {
        filteredTodos = filteredTodos.filter(todo => !todo.completed);
    } else if (currentFilter === 'completed') {
        filteredTodos = filteredTodos.filter(todo => todo.completed);
    }

    console.log('Filtered todos:', filteredTodos.length, 'Filter:', currentFilter);

    if (filteredTodos.length === 0) {
        todoList.innerHTML = `
            <div class="empty-state">No todos found</div>
        `;
        return;
    }

    todoList.innerHTML = filteredTodos.map(todo => `
        <div class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
            <div class="checkbox-wrapper">
                <input 
                    type="checkbox" 
                    ${todo.completed ? 'checked' : ''} 
                    onchange="toggleTodoComplete(${todo.id}, ${!todo.completed})"
                >
            </div>
            <div class="todo-content">
                <div class="todo-title">${escapeHtml(todo.todo)}</div>
            </div>
            <div class="todo-actions">
                <button class="action-btn edit" onclick="openEditModal(${todo.id})">Edit</button>
                <button class="action-btn delete" onclick="handleDeleteTodo(${todo.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

function openEditModal(id) {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    editingTodoId = id;
    modalTitle.textContent = 'Edit Todo';
    todoInput.value = todo.todo;
    todoModal.classList.add('active');
    todoInput.focus();
}

function saveTodo() {
    const title = todoInput.value.trim();

    if (!title) {
        showError('Please enter a todo title');
        return;
    }

    if (editingTodoId) {
        updateTodo(editingTodoId, { todo: title });
    } else {
        createTodo(title);
    }
    closeModal();
}

function openAddModal() {
    editingTodoId = null;
    modalTitle.textContent = 'Add New Todo';
    todoInput.value = '';
    todoModal.classList.add('active');
    todoInput.focus();
}

function closeModal() {
    todoModal.classList.remove('active');
    todoInput.value = '';
    editingTodoId = null;
}

function toggleTodoComplete(id, completed) {
    console.log('Toggle called:', id, 'New completed state:', completed);
    updateTodo(id, { completed });
}

function handleDeleteTodo(id) {
    if (confirm('Are you sure you want to delete this todo?')) {
        deleteTodo(id);
    }
}

function handleSearch() {
    renderTodos();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showError(message) {
    // Create and show error notification
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-notification';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);

    // Auto-remove after 3 seconds
    setTimeout(() => {
        errorDiv.remove();
    }, 3000);
}

function toggleTheme() {
    const body = document.body;
    body.classList.toggle('dark-mode');

    const isDark = body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    }
}

