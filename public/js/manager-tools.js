import { safeFetch } from "./helper/safeFetch.js";

const container = document.getElementById("hr-tools-container");
const departmentFilter = document.getElementById("department-filter");
const searchInput = document.getElementById("search-name");

const taskForm = document.getElementById("task-form");
const targetForm = document.getElementById("target-form");
const meetingForm = document.getElementById("meeting-form");

const taskEmployee = document.getElementById("task-employee");
const taskTitle = document.getElementById("task-title");
const taskDesc = document.getElementById("task-desc");
const taskDeadline = document.getElementById("task-deadline");
const taskPriority = document.getElementById("task-priority");

const targetEmployee = document.getElementById("target-employee");
const targetTitle = document.getElementById("target-title");
const targetDesc = document.getElementById("target-desc");
const targetAmount = document.getElementById("target-amount");
const targetDeadline = document.getElementById("target-deadline");

const meetingTitle = document.getElementById("meeting-title");
const meetingDesc = document.getElementById("meeting-desc");
const meetingStart = document.getElementById("meeting-start");
const meetingEnd = document.getElementById("meeting-end");
const meetingParticipants = document.getElementById("meeting-participants");

const btnTask = document.getElementById("btn-add-task");
const btnTarget = document.getElementById("btn-add-target");
const btnMeeting = document.getElementById("btn-add-meeting");

let usersData = [];

async function loadUsers() {
  container.innerHTML = `<p class="center text-secondary p-4">Loading users...</p>`;
  const res = await safeFetch("hr_manager_tool.php", "POST", { action: "list-users" });
  if (!res.success || !res.users) {
    container.innerHTML = `<p class="center text-secondary p-4">Failed to load users</p>`;
    return;
  }
  usersData = res.users;
  populateEmployeeDropdowns();
  renderUsers();
}

function populateEmployeeDropdowns() {
  [taskEmployee, targetEmployee, meetingParticipants].forEach(el => {
    el.innerHTML = "";
    usersData.forEach(user => {
      const option = document.createElement("option");
      option.value = user.id;
      option.textContent = user.name;
      el.appendChild(option);
    });
  });
}

function avatarUrl(user) {
  if (user?.avatar && user.avatar.trim() !== "") {
    return `http://localhost/HR-project/${user.avatar.replace(/^\/+/, "")}`;
  }
  return "http://localhost/HR-project/uploads/avatars/default.png";
}

function createCard(user) {
  const card = document.createElement("article");
  card.className = "card-onyx flex items-center gap-4 w-full transition-all duration-200";

  const img = document.createElement("img");
  img.src = avatarUrl(user);
  img.alt = user.name || "Avatar";
  img.className = "w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border";
  img.style.borderColor = "var(--onyx-border)";

  const infoWrap = document.createElement("div");
  infoWrap.className = "flex-1 min-w-0 flex flex-col justify-center gap-1";

  const head = document.createElement("div");
  head.className = "flex justify-between items-start w-full flex-wrap gap-1";

  const textCol = document.createElement("div");
  textCol.className = "overflow-hidden";

  const nameEl = document.createElement("h3");
  nameEl.className = "text-lg font-semibold";
  nameEl.style.color = "var(--onyx-text-primary)";
  nameEl.textContent = user.name || "No name";

  const posEl = document.createElement("p");
  posEl.className = "small text-secondary mt-1";
  posEl.textContent = user.position || "-";

  textCol.appendChild(nameEl);
  textCol.appendChild(posEl);

  const badgeWrap = document.createElement("div");
  badgeWrap.className = "flex gap-2 flex-wrap items-center";

  if (["manager", "team_lead"].includes((user.role || "").toLowerCase())) {
    const roleBadge = document.createElement("div");
    roleBadge.className = "small px-3 py-1 rounded-sm";
    roleBadge.style.background = "var(--onyx-hover-glow)";
    roleBadge.style.color = "var(--onyx-accent-1)";
    roleBadge.style.fontWeight = "600";
    roleBadge.textContent = "Manager";
    badgeWrap.appendChild(roleBadge);
  }

  head.appendChild(textCol);
  head.appendChild(badgeWrap);

  const status = document.createElement("p");
  status.className = "small mt-2 px-2 py-1 rounded-sm";
  status.style.background = "var(--onyx-hover-glow)";
  status.style.color = "var(--onyx-accent-1)";
  status.style.fontWeight = "600";
  status.textContent = "Available";

  infoWrap.appendChild(head);
  infoWrap.appendChild(status);

  card.appendChild(img);
  card.appendChild(infoWrap);

  return card;
}

function renderUsers() {
  container.innerHTML = "";
  const filtered = usersData.filter(user => {
    const depFilter = departmentFilter.value.trim().toLowerCase();
    const search = searchInput.value.trim().toLowerCase();
    return (
      (!depFilter || (user.department || "").toLowerCase().includes(depFilter)) &&
      (!search || (user.name || "").toLowerCase().includes(search))
    );
  });

  if (filtered.length === 0) {
    container.innerHTML = `<p class="center text-secondary p-4">No users found</p>`;
    return;
  }

  filtered.forEach(user => container.appendChild(createCard(user)));
}

departmentFilter.addEventListener("change", renderUsers);
searchInput.addEventListener("input", renderUsers);

function hideAllForms() {
  taskForm.classList.add("hidden");
  targetForm.classList.add("hidden");
  meetingForm.classList.add("hidden");
}

btnTask.className = "btn-onyx-primary";
btnTarget.className = "btn-onyx-primary";
btnMeeting.className = "btn-onyx-primary";

btnTask.addEventListener("click", () => {
  hideAllForms();
  taskForm.classList.remove("hidden");
});

btnTarget.addEventListener("click", () => {
  hideAllForms();
  targetForm.classList.remove("hidden");
});

btnMeeting.addEventListener("click", () => {
  hideAllForms();
  meetingForm.classList.remove("hidden");
});

taskForm.addEventListener("submit", async e => {
  e.preventDefault();
  const payload = {
    action: "assign-task",
    employee_id: taskEmployee.value,
    title: taskTitle.value.trim(),
    description: taskDesc.value.trim()
  };
  const res = await safeFetch("hr_manager_tool.php", "POST", payload);
  alert(res.success ? res.message : `Error: ${res.message}`);
  taskForm.reset();
  hideAllForms();
});

targetForm.addEventListener("submit", async e => {
  e.preventDefault();
  const payload = {
    action: "assign-target",
    employee_id: targetEmployee.value,
    title: targetTitle.value.trim(),
    description: targetDesc.value.trim(),
    target_amount: parseFloat(targetAmount.value),
    deadline: targetDeadline.value
  };
  const res = await safeFetch("hr_manager_tool.php", "POST", payload);
  alert(res.success ? res.message : `Error: ${res.message}`);
  targetForm.reset();
  hideAllForms();
});

meetingForm.addEventListener("submit", async e => {
  e.preventDefault();
  const selectedParticipants = Array.from(meetingParticipants.selectedOptions).map(o => parseInt(o.value));
  for (const participantId of selectedParticipants) {
    const payload = {
      action: "schedule-meeting",
      employee_id: participantId,
      title: meetingTitle.value.trim(),
      description: meetingDesc.value.trim()
    };
    const res = await safeFetch("hr_manager_tool.php", "POST", payload);
    if (!res.success) alert(`Error: ${res.message}`);
  }
  alert("Meeting scheduled successfully for selected participants");
  meetingForm.reset();
  hideAllForms();
});

document.addEventListener("DOMContentLoaded", () => {
  loadUsers();
  hideAllForms();
});
