const API_URL = 'http://localhost:8080/api/employees';
const TASK_API_URL = 'http://localhost:8080/api/tasks';

let allEmployeesCache = [];

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

    document.getElementById('departmentFilter').addEventListener('change', filterTable);
    document.getElementById('searchInput').addEventListener('input', filterTable);
    document.getElementById('taskEmployeeFilter').addEventListener('change', fetchEmployeeTasks);

    fetchEmployees();
});

async function fetchEmployees() {
    try {
        const response = await fetch(API_URL);
        allEmployeesCache = await response.json();
        populateDepartmentDropdown(allEmployeesCache);
        populateTaskEmployeeFilter(allEmployeesCache);
        filterTable();
    } catch (error) {
        console.error('Error fetching employees:', error);
    }
}

function populateDepartmentDropdown(employees) {
    const dropdown = document.getElementById('departmentFilter');
    const currentSelection = dropdown.value;
    const deptMap = new Map();
    employees.forEach(emp => {
        if (emp.department) {
            const trimmed = emp.department.trim();
            deptMap.set(trimmed.toLowerCase(), trimmed);
        }
    });
    dropdown.innerHTML = '<option value="">All Departments</option>';
    deptMap.forEach((originalName) => {
        const option = document.createElement('option');
        option.value = originalName.toLowerCase();
        option.textContent = originalName;
        dropdown.appendChild(option);
    });
    dropdown.value = currentSelection;
}

function populateTaskEmployeeFilter(employees) {
    const select = document.getElementById('taskEmployeeFilter');
    select.innerHTML = '<option value="">Select your name to view tasks...</option>';
    employees.forEach(emp => {
        select.innerHTML += `<option value="${emp.id}">${emp.name}</option>`;
    });
}

async function fetchEmployeeTasks() {
    const employeeId = document.getElementById('taskEmployeeFilter').value;
    const tbody = document.getElementById('employeeTaskTableBody');

    if (!employeeId) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">Please select your name above to view tasks</td></tr>`;
        return;
    }

    try {
        const response = await fetch(`${TASK_API_URL}?employeeId=${employeeId}`);
        const tasks = await response.json();
        tbody.innerHTML = '';

        if (tasks.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">No tasks assigned to you</td></tr>`;
            return;
        }

        tasks.forEach(task => {
            tbody.innerHTML = '';
            let badgeClass = 'bg-warning text-dark';
            if (task.status === 'Completed') badgeClass = 'bg-success';
            else if (task.status === 'In Progress') badgeClass = 'bg-info text-dark';

            tbody.innerHTML += `
                <tr>
                    <td class="ps-4 fw-semibold">${task.title}</td>
                    <td class="text-muted">${task.description}</td>
                    <td><span class="badge ${badgeClass}" id="status-badge-${task.id}">${task.status}</span></td>
                    <td class="text-end pe-4">
                        <select class="form-select form-select-sm d-inline-block" style="width: 140px;" onchange="updateTaskStatus(${task.id}, this.value)">
                            <option value="Pending" ${task.status === 'Pending' ? 'selected' : ''}>Pending</option>
                            <option value="In Progress" ${task.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                            <option value="Completed" ${task.status === 'Completed' ? 'selected' : ''}>Completed</option>
                        </select>
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        console.error('Error fetching employee tasks:', error);
    }
}

window.updateTaskStatus = async function(taskId, newStatus) {
    try {
        const response = await fetch(`${TASK_API_URL}/${taskId}/status?status=${encodeURIComponent(newStatus)}`, {
            method: 'PUT'
        });
        if (!response.ok) throw new Error('Failed to update status');
        fetchEmployeeTasks();
    } catch (error) {
        console.error('Error updating task status:', error);
        alert('Could not update task status.');
    }
}

function filterTable() {
    const searchQuery = document.getElementById('searchInput').value.toLowerCase().trim();
    const selectedDept = document.getElementById('departmentFilter').value;

    const filtered = allEmployeesCache.filter(emp => {
        const matchesSearch = !searchQuery ||
            (emp.name && emp.name.toLowerCase().includes(searchQuery)) ||
            (emp.email && emp.email.toLowerCase().includes(searchQuery)) ||
            (emp.department && emp.department.toLowerCase().includes(searchQuery));

        const matchesDept = !selectedDept ||
            (emp.department && emp.department.trim().toLowerCase() === selectedDept);

        return matchesSearch && matchesDept;
    });

    renderTable(filtered);
}

function renderTable(employees) {
    const tbody = document.getElementById('employeeTableBody');
    tbody.innerHTML = '';

    if (employees.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" class="text-center text-muted py-4">No personnel found</td></tr>`;
        return;
    }

    employees.forEach(emp => {
        tbody.innerHTML += `
            <tr>
                <td class="ps-4 fw-semibold">${emp.name}</td>
                <td class="text-muted">${emp.email}</td>
                <td class="pe-4"><span class="badge bg-primary bg-opacity-10 text-primary border px-2 py-1">${emp.department}</span></td>
            </tr>
        `;
    });
}