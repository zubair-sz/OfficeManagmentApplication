const API_URL = 'http://localhost:8080/api/employees';
const TASK_API_URL = 'http://localhost:8080/api/tasks';

function toggleDarkMode() {
    const htmlElement = document.documentElement;
    const toggleBtn = document.getElementById('darkModeToggle');
    if (htmlElement.getAttribute('data-bs-theme') === 'dark') {
        htmlElement.setAttribute('data-bs-theme', 'light');
        toggleBtn.innerHTML = '🌙 Dark Mode';
        localStorage.setItem('theme', 'light');
    } else {
        htmlElement.setAttribute('data-bs-theme', 'dark');
        toggleBtn.innerHTML = '☀️ Light Mode';
        localStorage.setItem('theme', 'dark');
    }
}

window.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-bs-theme', savedTheme);
    const toggleBtn = document.getElementById('darkModeToggle');
    if (toggleBtn) {
        toggleBtn.innerHTML = savedTheme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
        toggleBtn.addEventListener('click', toggleDarkMode);
    }

    document.getElementById('taskForm').addEventListener('submit', handleTaskSubmit);

    fetchEmployeesForDropdown();
    fetchTasks();
});

async function fetchEmployeesForDropdown() {
    try {
        const response = await fetch(API_URL);
        const employees = await response.json();
        const select = document.getElementById('taskEmployeeSelect');
        select.innerHTML = '<option value="">Choose employee...</option>';
        employees.forEach(emp => {
            select.innerHTML += `<option value="${emp.id}">${emp.name} (${emp.department})</option>`;
        });
    } catch (error) {
        console.error('Error fetching employees for dropdown:', error);
    }
}

async function fetchTasks() {
    try {
        const response = await fetch(TASK_API_URL);
        const tasks = await response.json();
        const tbody = document.getElementById('taskTableBody');
        tbody.innerHTML = '';

        if (tasks.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">No tasks assigned yet</td></tr>`;
            return;
        }

        tasks.forEach(task => {
            let badgeClass = 'bg-warning text-dark';
            if (task.status === 'Completed') badgeClass = 'bg-success';
            else if (task.status === 'In Progress') badgeClass = 'bg-info text-dark';

            tbody.innerHTML += `
                <tr>
                    <td class="ps-4 fw-semibold">${task.title}</td>
                    <td>${task.employeeName}</td>
                    <td class="text-muted">${task.description}</td>
                    <td><span class="badge ${badgeClass}">${task.status}</span></td>
                    <td class="text-end pe-4">
                        <button class="btn btn-outline-danger btn-sm px-3" onclick="deleteTask(${task.id})">Delete</button>
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        console.error('Error fetching tasks:', error);
    }
}

async function handleTaskSubmit(e) {
    e.preventDefault();
    const select = document.getElementById('taskEmployeeSelect');
    const employeeId = select.value;
    const employeeName = select.options[select.selectedIndex].text.split(' (')[0];

    const taskData = {
        title: document.getElementById('taskTitle').value,
        description: document.getElementById('taskDesc').value,
        employeeId: Number(employeeId),
        employeeName: employeeName
    };

    try {
        const response = await fetch(TASK_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(taskData)
        });
        if (!response.ok) throw new Error('Failed to assign task');

        document.getElementById('taskForm').reset();
        fetchTasks();
        showToast('Task assigned successfully!', 'bg-success');
    } catch (error) {
        console.error('Error assigning task:', error);
        showToast('Could not assign task.', 'bg-danger');
    }
}

window.deleteTask = async function(id) {
    if (confirm('Are you sure you want to delete this task?')) {
        await fetch(`${TASK_API_URL}/${id}`, { method: 'DELETE' });
        fetchTasks();
        showToast('Task deleted successfully!', 'bg-dark');
    }
}

function showToast(message, bgClass = 'bg-success') {
    const toastEl = document.getElementById('liveToast');
    const toastMessage = document.getElementById('toastMessage');
    toastEl.className = `toast align-items-center text-white border-0 shadow-lg ${bgClass}`;
    toastMessage.innerText = message;
    new bootstrap.Toast(toastEl).show();
}