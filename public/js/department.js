import { safeFetch } from "./helper/safeFetch.js";

const container = document.getElementById("department-container");

async function loadDepartment() {
  const userRes = await safeFetch("department.php", "get");
  if (!userRes.success || !userRes.data) {
    container.innerHTML = `<p class="text-red-500">Failed to load user info</p>`;
    return;
  }

  const listRes = await safeFetch("department.php", "list");
  if (!listRes.success || !listRes.users) {
    container.innerHTML = `<p class="text-red-500">Failed to load department members</p>`;
    return;
  }

  renderUsers(listRes.users);
}

function avatarUrl(user) {
  if (user?.avatar && user.avatar.trim() !== "") {
    return `http://localhost/HR-project/${user.avatar.replace(/^\/+/, "")}`;
  }
  return "http://localhost/HR-project/uploads/avatars/default.png";
}

function createCard(user) {
  const card = document.createElement("article");
  card.className = "bg-white rounded-lg shadow p-4 flex flex-row items-center gap-4 w-full";

  const img = document.createElement("img");
  img.src = avatarUrl(user);
  img.alt = user.name || "Avatar";
  img.className = "w-20 h-20 rounded-full object-cover border-2 border-gray-200 flex-shrink-0";

  const infoWrap = document.createElement("div");
  infoWrap.className = "flex-1 min-w-0 flex flex-col justify-center gap-1";

  const head = document.createElement("div");
  head.className = "flex justify-between items-center w-full";

  const textCol = document.createElement("div");
  textCol.className = "overflow-visible";

  const nameEl = document.createElement("h3");
  nameEl.className = "text-lg font-semibold text-gray-900 leading-tight break-words";
  nameEl.textContent = user.name || "No name";

  const posEl = document.createElement("p");
  posEl.className = "text-sm text-gray-600 mt-1 break-words";
  posEl.textContent = user.position || "-";

  textCol.appendChild(nameEl);
  textCol.appendChild(posEl);

  const badgeWrap = document.createElement("div");
  badgeWrap.className = "flex gap-2 flex-wrap items-center";

  if (["manager", "team_lead"].includes((user.role || "").toLowerCase())) {
    const roleBadge = document.createElement("div");
    roleBadge.className = "px-3 py-1 text-xs font-bold bg-blue-100 text-blue-700 rounded whitespace-nowrap";
    roleBadge.textContent = "Manager";
    badgeWrap.appendChild(roleBadge);
  }

  head.appendChild(textCol);
  head.appendChild(badgeWrap);

  const status = document.createElement("p");
  status.className = `mt-1 text-sm font-medium ${
    user.on_leave_today == 1 ? "text-red-700" : "text-green-700"
  }`;
  status.textContent = user.on_leave_today == 1 ? "On Leave Today" : "Available";

  infoWrap.appendChild(head);
  infoWrap.appendChild(status);

  card.appendChild(img);
  card.appendChild(infoWrap);

  return card;
}

function clearContainer() {
  while (container.firstChild) container.removeChild(container.firstChild);
}

function ensureGridClasses() {
  container.className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6";
}

async function renderUsers(users) {
  clearContainer();
  ensureGridClasses();

  for (const user of users) {
    const card = createCard(user);
    container.appendChild(card);
  }
}

document.addEventListener("DOMContentLoaded", loadDepartment);
