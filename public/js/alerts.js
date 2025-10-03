import { safeFetch } from './helper/safeFetch.js';

let currentUser = null;
let users = [];
let alerts = [];

const alertsContainer = document.getElementById("alerts-container");
const openModalBtn = document.getElementById("open-send-alert");
const closeModalBtn = document.getElementById("close-send-alert");
const sendModal = document.getElementById("send-alert-modal");
const sendForm = document.getElementById("send-alert-form");
const usersSelectContainer = document.getElementById("users-select");
const messageInput = document.getElementById("alert-message");
const departmentCheckbox = document.getElementById("send-to-department");

const cuName = document.getElementById("cu-name");
const cuRole = document.getElementById("cu-role");
const cuPosition = document.getElementById("cu-position");
const cuDepartment = document.getElementById("cu-department");

const alertTemplate = document.getElementById("alert-card-template");

async function loadCurrentUser() {
    const res = await safeFetch("users.php", "get");
    if (!res.success) {
        window.location.href = "auth.html";
        return;
    }
    currentUser = res.data;
    cuName.textContent = currentUser.name;
    cuRole.textContent = currentUser.role;
    cuPosition.textContent = currentUser.position || "-";
    cuDepartment.textContent = currentUser.department || "-";
    if (["manager","hr","hr_manager"].includes(currentUser.role)) {
        openModalBtn.classList.remove("hidden");
    }
    await loadUsers();
    await loadAlerts();
}

async function loadUsers() {
    const res = await safeFetch("users.php", "list");
    if (!res.success) return;
    users = res.users || [];
    renderUserOptions();
}

function renderUserOptions() {
    usersSelectContainer.innerHTML = "";
    if (!users.length) {
        usersSelectContainer.textContent = "No users available";
        return;
    }
    users.forEach(u => {
        const label = document.createElement("label");
        label.classList.add("flex", "items-center", "gap-2");
        label.innerHTML = `<input type="checkbox" value="${u.id}" class="user-checkbox h-4 w-4 text-blue-600 border-gray-300 rounded"> ${u.name} (${u.role})`;
        usersSelectContainer.appendChild(label);
    });
    toggleUserSelection();
}

function toggleUserSelection() {
    const checkboxes = usersSelectContainer.querySelectorAll(".user-checkbox");
    if (!checkboxes || checkboxes.length === 0) return;
    const disable = departmentCheckbox.checked;
    checkboxes.forEach(cb => {
        cb.disabled = disable;
        cb.parentElement.style.opacity = disable ? "0.5" : "1";
    });
}

departmentCheckbox.addEventListener("change", toggleUserSelection);

async function loadAlerts() {
    const res = await safeFetch("alerts.php", "list", { currentUser });
    if (!res.success) {
        alertsContainer.innerHTML = "<p class='text-red-500'>Failed to load alerts</p>";
        return;
    }
    alerts = res.alerts || [];
    renderAlerts();
}

function renderAlerts() {
    alertsContainer.innerHTML = "";
    if (!alerts.length) {
        alertsContainer.innerHTML = "<p class='text-gray-500 text-center'>No alerts found</p>";
        return;
    }
    alerts.forEach(a => {
        const clone = alertTemplate.content.cloneNode(true);
        clone.querySelector(".sender-name").textContent = a.sender_name;
        clone.querySelector(".sender-role").textContent = a.sender_role;
        clone.querySelector(".department").textContent = a.department || "-";
        clone.querySelector(".alert-message").textContent = a.message;
        clone.querySelector(".alert-date").textContent = new Date(a.alert_date).toLocaleString();
        clone.querySelector(".sent-to").textContent = "Sent to: " + (Array.isArray(a.sent_to) ? a.sent_to.join(", ") : a.sent_to || "-");
        alertsContainer.appendChild(clone);
    });
}

openModalBtn.addEventListener("click", () => sendModal.classList.remove("hidden"));
closeModalBtn.addEventListener("click", () => sendModal.classList.add("hidden"));
sendModal.addEventListener("click", e => { if (e.target === sendModal) sendModal.classList.add("hidden"); });

sendForm.addEventListener("submit", async e => {
    e.preventDefault();
    const message = messageInput.value.trim();
    if (!message) return alert("Message cannot be empty");
    const selectedUsers = Array.from(usersSelectContainer.querySelectorAll(".user-checkbox:checked")).map(c => c.value);
    const sendToDept = departmentCheckbox.checked;
    if (!selectedUsers.length && !sendToDept) return alert("Select at least one user or send to department");
    const payload = {
        action: "send",
        message,
        users: sendToDept ? [] : selectedUsers,
        department: sendToDept ? currentUser.department : "",
        currentUser
    };
    const res = await safeFetch("alerts.php", "send", payload);
    if (res.success) {
        sendForm.reset();
        departmentCheckbox.checked = false;
        toggleUserSelection();
        await loadAlerts();
        sendModal.classList.add("hidden");
        alert(`Alert sent to ${res.sent_to.length} user(s)`);
    } else {
        alert(res.message || "Failed to send alert");
    }
});

document.addEventListener("DOMContentLoaded", loadCurrentUser);
