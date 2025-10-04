import { safeFetch } from "./helper/safeFetch.js";

const container = document.getElementById("department-container");

async function loadDepartment() {
  const userRes = await safeFetch("department.php", "get");
  if (!userRes.success || !userRes.data) {
    container.innerHTML = `<p class="text-red-600 text-center font-medium">Failed to load user info</p>`;
    return;
  }

  const listRes = await safeFetch("department.php", "list");
  if (!listRes.success || !listRes.users) {
    container.innerHTML = `<p class="text-red-600 text-center font-medium">Failed to load department members</p>`;
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
  card.className =
    "bg-white/90 backdrop-blur-sm border border-gray-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-5";

  const img = document.createElement("img");
  img.src = avatarUrl(user);
  img.alt = user.name || "Avatar";
  img.className =
    "w-20 h-20 rounded-full object-cover border-2 border-blue-100 shadow-sm flex-shrink-0";

  const info = document.createElement("div");
  info.className = "flex flex-col flex-1 min-w-0";

  const topRow = document.createElement("div");
  topRow.className = "flex justify-between items-start flex-wrap gap-2";

  const nameWrap = document.createElement("div");

  const nameEl = document.createElement("h3");
  nameEl.className =
    "text-lg font-semibold text-blue-900 leading-tight break-words";
  nameEl.textContent = user.name || "No name";

  const posEl = document.createElement("p");
  posEl.className = "text-sm text-gray-600 mt-1";
  posEl.textContent = user.position || "-";

  nameWrap.appendChild(nameEl);
  nameWrap.appendChild(posEl);

  const badges = document.createElement("div");
  badges.className = "flex gap-2 flex-wrap items-center";

  if (["manager", "team_lead"].includes((user.role || "").toLowerCase())) {
    const badge = document.createElement("span");
    badge.className =
      "px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full";
    badge.textContent = "Manager";
    badges.appendChild(badge);
  }

  topRow.appendChild(nameWrap);
  topRow.appendChild(badges);

  const status = document.createElement("span");
  status.className = `mt-2 text-sm font-medium ${
    user.on_leave_today == 1
      ? "text-red-600 bg-red-50 border border-red-100"
      : "text-green-700 bg-green-50 border border-green-100"
  } px-3 py-1 rounded-full w-fit`;
  status.textContent =
    user.on_leave_today == 1 ? "On Leave Today" : "Available";

  info.appendChild(topRow);
  info.appendChild(status);

  card.appendChild(img);
  card.appendChild(info);

  return card;
}

function clearContainer() {
  container.innerHTML = "";
}

function ensureGridClasses() {
  container.className =
    "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-6";
}

async function renderUsers(users) {
  clearContainer();
  ensureGridClasses();

  for (const user of users) {
    container.appendChild(createCard(user));
  }
}

document.addEventListener("DOMContentLoaded", loadDepartment);
