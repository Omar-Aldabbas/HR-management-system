const apiBase = "http://localhost/HR-project/api";
const leaveApi = `${apiBase}/leaves.php`;

let user = {};
let allLeaves = [];
let currentFilter = "all";

async function safeFetch(url, data = {}) {
  try {
    const res = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch {
    return { success: false, message: "Network error" };
  }
}

async function getUser() {
  try {
    const res = await fetch(`${apiBase}/personal-data.php`, { credentials: "include" });
    const data = await res.json();
    if (data.success && data.data) user = data.data;
    else window.location.href = "auth.html";
  } catch {
    window.location.href = "auth.html";
  }
}

async function fetchLeaves() {
  const res = await safeFetch(leaveApi, { action: "list" });
  allLeaves = res.success ? res.leaves : [];
}

async function applyLeave(type, start, end) {
  const res = await safeFetch(leaveApi, { action: "apply", type, start_date: start, end_date: end });
  if (!res.success) alert(res.message);
  return res;
}

async function updateLeave(id, status, message) {
  const res = await safeFetch(leaveApi, { action: "update", id, status, message });
  if (!res.success) alert(res.message);
  return res;
}

async function deleteLeave(id) {
  const res = await safeFetch(leaveApi, { action: "delete", id });
  if (!res.success) alert(res.message);
  return res;
}

function filterLeavesByStatus(leaves) {
  if (currentFilter === "all") return leaves;
  return leaves.filter(l => l.status === currentFilter);
}


function makeExpandableList(listElement, leaves, renderItemCallback) {
  listElement.innerHTML = "";
  const visibleCount = 3;
  let expanded = false;

  function render() {
    listElement.innerHTML = "";
    const toShow = expanded ? leaves : leaves.slice(0, visibleCount);
    toShow.forEach(l => {
      const li = renderItemCallback(l);
      listElement.appendChild(li);
    });
    if (leaves.length > visibleCount) {
      const toggleLi = document.createElement("li");
      toggleLi.className = "p-2 cursor-pointer text-blue-600 hover:underline";
      toggleLi.textContent = expanded ? "Show Less" : `Show More (${leaves.length - visibleCount} more)`;
      toggleLi.addEventListener("click", () => {
        expanded = !expanded;
        render();
      });
      listElement.appendChild(toggleLi);
    }
  }

  render();
}


function renderForm() {
  if (["employee", "manager", "hr"].includes(user.role)) {
    document.getElementById("leave-form-section").classList.remove("hidden");
  }
}

function renderMyLeaves() {
  const section = document.getElementById("my-leaves-section");
  const list = document.getElementById("my-leaves-list");

  let leaves = allLeaves.filter(l => l.user_id === user.id);
  leaves = filterLeavesByStatus(leaves);

  if (!leaves.length) {
    section.classList.add("hidden");
    list.innerHTML = "";
    return;
  }

  section.classList.remove("hidden");

  makeExpandableList(list, leaves, l => {
    const li = document.createElement("li");
    li.className = "p-2 border border-gray-400 rounded flex flex-col gap-1";
    li.innerHTML = `
      <div><strong>${l.type}</strong> (${l.start_date} to ${l.end_date})</div>
      <div>Status: ${l.status}</div>
      ${l.status !== "pending" ? `<div>By: ${l.approver_name || "-"} | ${l.action_date || "-"} | ${l.action_message || "-"}</div>` : ""}
      ${l.status === "pending" ? `<button class="delete-btn px-2 py-1 bg-gray-800 hover:bg-gray-700 text-white rounded mt-1" data-id="${l.id}">Cancel</button>` : ""}
    `;
    li.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        await deleteLeave(btn.dataset.id);
        await loadLeaves();
      });
    });
    return li;
  });
}

function renderDepartmentOrAllLeaves() {
  const deptSection = document.getElementById("employee-leaves-section");
  const allSection = document.getElementById("all-leaves-section");

  deptSection.classList.add("hidden");
  allSection.classList.add("hidden");

  const leavesFiltered = filterLeavesByStatus(allLeaves.filter(l => l.user_id !== user.id));

  if (user.role === "manager") {
    const deptLeaves = leavesFiltered.filter(l => l.department === user.department);
    if (deptLeaves.length) {
      deptSection.classList.remove("hidden");
      makeExpandableList(document.getElementById("employee-leaves-list"), deptLeaves, l => {
        const li = document.createElement("li");
        li.className = "p-2 border border-gray-400 rounded flex flex-col gap-1";
        li.innerHTML = `
          <div><strong>${l.user_name}</strong> - ${l.type} (${l.start_date} to ${l.end_date})</div>
          <div>Status: ${l.status}</div>
          ${l.status === "pending" ? `
            <input type="text" placeholder="Message" class="action-msg border p-1 rounded w-full mb-1 bg-gray-100 text-gray-900">
            <div class="flex gap-2">
              <button data-id="${l.id}" data-status="approved" class="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-white rounded">Approve</button>
              <button data-id="${l.id}" data-status="rejected" class="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-white rounded">Reject</button>
            </div>` : ""}
        `;
        li.querySelectorAll("button").forEach(btn => {
          btn.addEventListener("click", async () => {
            const message = btn.closest("li").querySelector(".action-msg")?.value || "";
            await updateLeave(btn.dataset.id, btn.dataset.status, message);
            await loadLeaves();
          });
        });
        return li;
      });
    }
  }

  if (user.role === "hr") {
    if (leavesFiltered.length) {
      allSection.classList.remove("hidden");
      makeExpandableList(document.getElementById("all-leaves-list"), leavesFiltered, l => {
        const li = document.createElement("li");
        li.className = "p-2 border border-gray-400 rounded flex flex-col gap-1";
        li.innerHTML = `
          <div><strong>${l.user_name}</strong> (${l.department} / ${l.role}) - ${l.type} (${l.start_date} to ${l.end_date})</div>
          <div>Status: ${l.status}</div>
          ${l.status !== "pending" ? `<div>Approved/Rejected by: ${l.approver_name || "-"} | ${l.action_date || "-"} | ${l.action_message || "-"}</div>` : ""}
          ${l.status === "pending" ? `
            <input type="text" placeholder="Message" class="action-msg border p-1 rounded w-full mb-1 bg-gray-100 text-gray-900">
            <div class="flex gap-2">
              <button data-id="${l.id}" data-status="approved" class="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-white rounded">Approve</button>
              <button data-id="${l.id}" data-status="rejected" class="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-white rounded">Reject</button>
            </div>` : ""}
        `;
        li.querySelectorAll("button").forEach(btn => {
          btn.addEventListener("click", async () => {
            const message = btn.closest("li").querySelector(".action-msg")?.value || "";
            await updateLeave(btn.dataset.id, btn.dataset.status, message);
            await loadLeaves();
          });
        });
        return li;
      });
    }
  }
}


async function loadLeaves() {
  await fetchLeaves();
  renderForm();
  renderMyLeaves();
  renderDepartmentOrAllLeaves();
}

function setupFilterButtons() {
  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      currentFilter = btn.dataset.filter;
      loadLeaves();
    });
  });
}


document.addEventListener("DOMContentLoaded", async () => {
  await getUser();
  document.getElementById("filters-row").classList.remove("hidden");
  setupFilterButtons();
  await loadLeaves();

  document.getElementById("leave-form").addEventListener("submit", async e => {
    e.preventDefault();
    const type = document.getElementById("leave-type").value;
    const start = document.getElementById("start-date").value;
    const end = document.getElementById("end-date").value;
    if (!start || !end) return alert("Start and end dates are required");
    await applyLeave(type, start, end);
    document.getElementById("leave-form").reset();
    await loadLeaves();
  });
});
