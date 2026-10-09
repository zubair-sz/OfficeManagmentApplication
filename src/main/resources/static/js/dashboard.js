const API_URL = 'http://localhost:8080/api/employees';
const TASK_API_URL = 'http://localhost:8080/api/tasks';

let allEmployeesCache = [];
let currentPage = 1;
let rowsPerPage = 10;
let filteredEmployeesCache = [];

// Dark Mode Toggle
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

    document.getElementById('exportBtn').addEventListener('click', exportToCSV);
    document.getElementById('rowsPerPageSelect').addEventListener('change', changeRowsPerPage);
    document.getElementById('departmentFilter').addEventListener('change', filterTable);
    document.getElementById('searchInput').addEventListener('input', filterTable);
    document.getElementById('cancelButton').addEventListener('click', resetForm);
    document.getElementById('employeeForm').addEventListener('submit', handleEmployeeSubmit);
    document.getElementById('taskForm').addEventListener('submit', handleTaskSubmit);

    fetchEmployees();
    fetchTasks();
});

async function fetchEmployees() {
    try {
        const response = await fetch(API_URL);
        allEmployeesCache = await response.json();
        updateDashboardStats(allEmployeesCache);
        populateDepartmentDropdown(allEmployeesCache);
        populateTaskEmployeeDropdown(allEmployeesCache);
        filterTable();
    } catch (error) {
        console.error('Error fetching employees:', error);
        showToast('Failed to load employees from server.', 'bg-danger');
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

function updateDashboardStats(employees) {
    document.getElementById('totalEmployeesCount').innerText = employees.length;
    const uniqueDepts = new Set(employees.map(emp => emp.department ? emp.department.trim().toLowerCase() : ''));
    document.getElementById('totalDepartmentsCount').innerText = uniqueDepts.size;
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

function populateTaskEmployeeDropdown(employees) {
    const select = document.getElementById('taskEmployeeSelect');
    select.innerHTML = '<option value="">Choose employee...</option>';
    employees.forEach(emp => {
        select.innerHTML += `<option value="${emp.id}">${emp.name} (${emp.department})</option>`;
    });
}

function changeRowsPerPage() {
    rowsPerPage = parseInt(document.getElementById('rowsPerPageSelect').value);
    currentPage = 1;
    renderPaginationTable();
}

function filterTable() {
    const searchQuery = document.getElementById('searchInput').value.toLowerCase().trim();
    const selectedDept = document.getElementById('departmentFilter').value;

    filteredEmployeesCache = allEmployeesCache.filter(emp => {
        const matchesSearch = !searchQuery ||
            (emp.name && emp.name.toLowerCase().includes(searchQuery)) ||
            (emp.email && emp.email.toLowerCase().includes(searchQuery));
        const matchesDept = !selectedDept ||
            (emp.department && emp.department.trim().toLowerCase() === selectedDept);
        return matchesSearch && matchesDept;
    });

    currentPage = 1;
    renderPaginationTable();
}

function renderPaginationTable() {
    const tbody = document.getElementById('employeeTableBody');
    tbody.innerHTML = '';

    const totalRecords = filteredEmployeesCache.length;
    if (totalRecords === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">No employees found</td></tr>`;
        document.getElementById('paginationInfo').innerText = 'Showing 0 of 0 entries';
        document.getElementById('paginationControls').innerHTML = '';
        return;
    }

    const totalPages = Math.ceil(totalRecords / rowsPerPage);
    if (currentPage > totalPages) currentPage = totalPages;

    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = Math.min(startIndex + rowsPerPage, totalRecords);
    const paginatedData = filteredEmployeesCache.slice(startIndex, endIndex);

    paginatedData.forEach(emp => {
        tbody.innerHTML += `
            <tr>
                <td class="ps-4 fw-semibold">#${emp.id}</td>
                <td>${emp.name}</td>
                <td class="text-muted">${emp.email}</td>
                <td><span class="badge bg-secondary bg-opacity-10 text-secondary border px-2 py-1">${emp.department}</span></td>
                <td class="text-end pe-4">
                    <button class="btn btn-outline-warning btn-sm me-1 px-3" onclick="prepareEdit(${emp.id}, '${emp.name}', '${emp.email}', '${emp.department}')">Edit</button>
                    <button class="btn btn-outline-danger btn-sm px-3" onclick="deleteEmployee(${emp.id})">Delete</button>
                </td>
            </tr>
        `;
    });

    document.getElementById('paginationInfo').innerText = `Showing ${startIndex + 1} to ${endIndex} of ${totalRecords} entries`;
    renderPaginationControls(totalPages);
}

function renderPaginationControls(totalPages) {
    const controls = document.getElementById('paginationControls');
    controls.innerHTML = '';
    if (totalPages <= 1) return;

    controls.innerHTML += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <button class="page-link" onclick="changePage(${currentPage - 1})">Previous</button>
        </li>
    `;

    for (let i = 1; i <= totalPages; i++) {
        controls.innerHTML += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <button class="page-link" onclick="changePage(${i})">${i}</button>
            </li>
        `;
    }

    controls.innerHTML += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <button class="page-link" onclick="changePage(${currentPage + 1})">Next</button>
        </li>
    `;
}

window.changePage = function(page) {
    currentPage = page;
    renderPaginationTable();
}

function exportToCSV() {
    if (allEmployeesCache.length === 0) {
        showToast('No data available to export.', 'bg-warning text-dark');
        return;
    }
    let csvContent = "data:text/csv;charset=utf-8,ID,Name,Email,Department\r\n";
    allEmployeesCache.forEach(emp => {
        csvContent += `"${emp.id}","${emp.name}","${emp.email}","${emp.department}"\r\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "employee_directory.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Employee directory exported successfully!', 'bg-success');
}

function showToast(message, bgClass = 'bg-success') {
    const toastEl = document.getElementById('liveToast');
    const toastMessage = document.getElementById('toastMessage');
    toastEl.className = `toast align-items-center text-white border-0 shadow-lg ${bgClass}`;
    toastMessage.innerText = message;
    new bootstrap.Toast(toastEl).show();
}

window.prepareEdit = function(id, name, email, department) {
    document.getElementById('employeeId').value = id;
    document.getElementById('name').value = name;
    document.getElementById('email').value = email;
    document.getElementById('department').value = department;
    document.getElementById('formHeader').innerText = '✏️ Edit Employee (ID: ' + id + ')';
    document.getElementById('saveButton').innerText = 'Update Changes';
    document.getElementById('cancelButton').classList.remove('d-none');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetForm() {
    document.getElementById('employeeForm').reset();
    document.getElementById('employeeId').value = '';
    document.getElementById('formHeader').innerText = '✨ Add New Employee';
    document.getElementById('saveButton').innerText = 'Save Employee';
    document.getElementById('cancelButton').classList.add('d-none');
}

async function handleEmployeeSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('employeeId').value;
    const isEditing = !!id;
    const employeeData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        department: document.getElementById('department').value
    };
    if (isEditing) employeeData.id = Number(id);

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(employeeData)
        });
        if (!response.ok) throw new Error('Failed to save employee');
        resetForm();
        fetchEmployees();
        showToast(isEditing ? 'Employee updated successfully!' : 'Employee added successfully!');
    } catch (error) {
        console.error('Error saving employee:', error);
        showToast('Could not save employee. Check console logs.', 'bg-danger');
    }
}

window.deleteEmployee = async function(id) {
    if (confirm('Are you sure you want to delete this employee?')) {
        try {
            await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
            fetchEmployees();
            showToast('Employee deleted successfully!', 'bg-dark');
        } catch (error) {
            console.error('Error deleting employee:', error);
            showToast('Failed to delete employee.', 'bg-danger');
        }
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