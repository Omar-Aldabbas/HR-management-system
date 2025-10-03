import { safeFetch } from "./helper/safeFetch.js";

const container = document.getElementById("hr-tools-container");
const departmentFilter = document.getElementById("department-filter");
const searchInput = document.getElementById("search-name");
const editModal = document.getElementById("edit-user-modal");
const editForm = document.getElementById("edit-user-form");
const editId = document.getElementById("edit-user-id");
const editName = document.getElementById("edit-user-name");
const editPosition = document.getElementById("edit-user-position");
const editDepartment = document.getElementById("edit-user-department");
const closeModalBtn = document.getElementById("close-edit-modal");

let usersData = [];

async function loadUsers() {
  container.innerHTML = `<p class="text-gray-500 col-span-full">Loading users...</p>`;
  const res = await safeFetch("hr_manager_tool.php", "POST", { action: "list-users" });
  if (!res.success || !res.users) {
    container.innerHTML = `<p class="text-red-500 col-span-full">Failed to load users</p>`;
    return;
  }
  usersData = res.users;
  renderUsers();
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

  const editBtn = document.createElement("button");
  editBtn.className = "ml-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-sm font-medium hover:bg-yellow-200";
  editBtn.textContent = "Edit";
  editBtn.addEventListener("click", () => openEditModal(user));

  head.appendChild(textCol);
  head.appendChild(badgeWrap);
  head.appendChild(editBtn);

  const status = document.createElement("p");
  status.className = `mt-1 text-sm font-medium text-green-700`;
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
    return (!depFilter || (user.department || "").toLowerCase().includes(depFilter)) &&
           (!search || (user.name || "").toLowerCase().includes(search));
  });

  if (filtered.length === 0) {
    container.innerHTML = `<p class="text-gray-500 col-span-full">No users found</p>`;
    return;
  }

  filtered.forEach(user => {
    container.appendChild(createCard(user));
  });
}

function openEditModal(user) {
  editId.value = user.id;
  editName.value = user.name;
  editPosition.value = user.position;
  editDepartment.value = user.department || "";
  editModal.classList.remove("hidden");
}

function closeEditModal() {
  editModal.classList.add("hidden");
}

editForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = {
    action: "update-user",
    id: editId.value,
    position: editPosition.value.trim(),
    department: editDepartment.value.trim()
  };
  const res = await safeFetch("hr_manager_tool.php", "POST", payload);
  if (res.success) {
    await loadUsers();
    closeEditModal();
  } else {
    alert(res.message || "Failed to update user");
  }
});

closeModalBtn.addEventListener("click", closeEditModal);
departmentFilter.addEventListener("change", renderUsers);
searchInput.addEventListener("input", renderUsers);

document.addEventListener("DOMContentLoaded", loadUsers);
