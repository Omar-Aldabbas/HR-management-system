import { safeFetch } from './helper/safeFetch.js';

let currentUser = null;
let users = [];
let alerts = [];
let selectedUsers = [];

const messageInput = document.getElementById("alert-message");
const usersSelect = document.getElementById("users-select");
const sendBtn = document.getElementById("send-alert-btn");
const alertsContainer = document.getElementById("alerts-container");

async function loadCurrentUser() {
  console.log("Loading user data...");
  const res = await safeFetch("personal-data.php", "get");
  console.log("User data response:", res);

  if (res.success) {
    currentUser = res.data;

    if (currentUser.role === "manager" || currentUser.role === "hr") {
      sendBtn.style.display = "block";
      await loadUsers();
    } else {
      sendBtn.style.display = "none";
    }

    await loadAlerts();
  } else {
    alert("Failed to load user data");
    console.error(res);
  }
}

async function loadUsers() {
  console.log("Loading users...");
  const res = await safeFetch("alerts.php", "list_users", { currentUser });
  console.log("Users response:", res);

  if (res.success) {
    users = res.users;
    renderUserSelect();
  } else {
    alert("Failed to load users");
    console.error(res);
  }
}

function renderUserSelect() {
  console.log("Rendering user list...");
  usersSelect.innerHTML = "";
  users.forEach(user => {
    const option = document.createElement("option");
    option.value = user.id;
    option.textContent = `${user.name} (${user.role})`;
    usersSelect.appendChild(option);
  });
}

async function loadAlerts() {
  console.log("Loading alerts...");
  const res = await safeFetch("alerts.php", "list", { currentUser });
  console.log("Alerts response:", res);

  if (res.success) {
    alerts = res.alerts;
    renderAlerts();
  } else {
    alert("Failed to load alerts");
    console.error(res);
  }
}

function renderAlerts() {
  alertsContainer.innerHTML = "";
  if (!alerts.length) {
    alertsContainer.textContent = "No alerts found";
    return;
  }

  alerts.forEach(a => {
    const div = document.createElement("div");
    div.classList.add("alert-item");
    div.textContent = `[${a.alert_date}] ${a.sender_name} -> ${a.message}`;
    alertsContainer.appendChild(div);
  });
}

sendBtn.addEventListener("click", async () => {
  const message = messageInput.value.trim();
  if (!message) return alert("Message cannot be empty");

  selectedUsers = Array.from(usersSelect.selectedOptions).map(opt => opt.value);
  const department = currentUser.role === "manager" ? currentUser.department : "";

  const payload = { message, users: selectedUsers, department, currentUser };

  console.log("Sending alert:", payload);
  const res = await safeFetch("alerts.php", "send", payload);
  console.log("Send alert response:", res);

  if (res.success) {
    alert("Alert sent successfully");
    messageInput.value = "";
    await loadAlerts();
  } else {
    alert(res.message || "Failed to send alert");
    console.error(res);
  }
});

document.addEventListener("DOMContentLoaded", loadCurrentUser);
