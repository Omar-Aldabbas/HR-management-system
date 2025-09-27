const apiBase = "http://localhost/HR-project/api";

async function safeFetch(url, data) {
  try {
    const res = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch {
    return {};
  }
}

let user = {};

async function getUser() {
  const res = await fetch(`${apiBase}/personal-data.php`, { credentials: "include" });
  const data = await res.json();
  if (data.success) user = data.data;
}

async function applyLeave(type, start, end) {
  return await safeFetch(`${apiBase}/leaves.php`, {
    action: "apply",
    type,
    start_date: start,
    end_date: end
  });
}

async function fetchLeaves() {
  const data = await safeFetch(`${apiBase}/leaves.php`, { action: "list" });
  return data.leaves || [];
}

async function updateLeave(id, status, message) {
  return await safeFetch(`${apiBase}/leaves.php`, {
    action: "update",
    id,
    status,
    message
  });
}

function renderForm() {
  document.getElementById("leave-form-section").classList.remove("hidden");
}

function renderAllLeaves(leaves) {
  if (["hr","admin"].includes(user.role)) {
    const el = document.getElementById("all-leaves-section");
    el.classList.remove("hidden");
    const list = document.getElementById("all-leaves-list");
    list.innerHTML = "";

    leaves.forEach(l => {
      const li = document.createElement("li");
      li.className = "p-2 border rounded flex flex-col gap-1";
      li.innerHTML = `
        <div><strong>${l.user_name}</strong> (${l.department}) - ${l.type} (${l.start_date} to ${l.end_date}) | Taken this year: ${l.total_days_this_year || 0} days</div>
        <div>Status: ${l.status}</div>
        ${l.status !== 'pending' ? `<div>By: ${l.approver_name} (${l.approver_position}) | ${l.action_date} | Message: ${l.action_message || '-'}</div>` : ''}
      `;
      list.appendChild(li);
    });

    const cpEl = document.getElementById("control-panel-section");
    cpEl.classList.remove("hidden");
    const cpList = document.getElementById("control-panel-list");
    cpList.innerHTML = "";

    leaves.filter(l => l.status === "pending").forEach(l => {
      const li = document.createElement("li");
      li.className = "p-2 border rounded flex flex-col gap-1";
      li.innerHTML = `
        <div><strong>${l.user_name}</strong> (${l.department}) - ${l.type} (${l.start_date} to ${l.end_date})</div>
        <div>
          <input type="text" placeholder="Write a message..." class="action-msg border p-1 rounded w-full mb-1" />
          <div class="flex gap-2">
            <button data-id="${l.id}" data-status="approved" class="px-2 py-1 bg-green-500 text-white rounded">Approve</button>
            <button data-id="${l.id}" data-status="rejected" class="px-2 py-1 bg-red-500 text-white rounded">Reject</button>
          </div>
        </div>
      `;
      cpList.appendChild(li);
    });

    cpList.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", async () => {
        const message = btn.closest("li").querySelector(".action-msg").value.trim();
        await updateLeave(btn.dataset.id, btn.dataset.status, message);
        loadLeaves();
      });
    });
  }
}

function renderDepartmentLeaves(leaves) {
  if (user.role === "manager") {
    const deptLeaves = leaves.filter(l => l.department === user.department);
    const el = document.getElementById("employee-leaves-section");
    el.classList.remove("hidden");
    const list = document.getElementById("employee-leaves-list");
    list.innerHTML = "";

    deptLeaves.forEach(l => {
      const li = document.createElement("li");
      li.className = "p-2 border rounded flex flex-col gap-1";
      li.innerHTML = `
        <div><strong>${l.user_name}</strong> - ${l.type} (${l.start_date} to ${l.end_date}) | Taken this year: ${l.total_days_this_year || 0} days</div>
        <div>Status: ${l.status}</div>
        ${l.status !== 'pending' ? `<div>By: ${l.approver_name} (${l.approver_position}) | ${l.action_date} | Message: ${l.action_message || '-'}</div>` : ''}
      `;
      list.appendChild(li);
    });

    const cpEl = document.getElementById("control-panel-section");
    cpEl.classList.remove("hidden");
    const cpList = document.getElementById("control-panel-list");
    cpList.innerHTML = "";

    deptLeaves.filter(l => l.status === "pending").forEach(l => {
      const li = document.createElement("li");
      li.className = "p-2 border rounded flex flex-col gap-1";
      li.innerHTML = `
        <div><strong>${l.user_name}</strong> - ${l.type} (${l.start_date} to ${l.end_date})</div>
        <input type="text" placeholder="Write a message..." class="action-msg border p-1 rounded w-full mb-1" />
        <div class="flex gap-2">
          <button data-id="${l.id}" data-status="approved" class="px-2 py-1 bg-green-500 text-white rounded">Approve</button>
          <button data-id="${l.id}" data-status="rejected" class="px-2 py-1 bg-red-500 text-white rounded">Reject</button>
        </div>
      `;
      cpList.appendChild(li);
    });

    cpList.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", async () => {
        const message = btn.closest("li").querySelector(".action-msg").value.trim();
        await updateLeave(btn.dataset.id, btn.dataset.status, message);
        loadLeaves();
      });
    });
  }
}

function renderMyLeaves(leaves) {
  const el = document.getElementById("my-leaves-section");
  el.classList.remove("hidden");
  const list = document.getElementById("my-leaves-list");
  list.innerHTML = "";

  leaves.filter(l => l.user_id === user.id).forEach(l => {
    const li = document.createElement("li");
    li.className = "p-2 border rounded flex flex-col gap-1";
    li.innerHTML = `
      <div>${l.type} (${l.start_date} to ${l.end_date})</div>
      <div>Status: ${l.status}</div>
      ${l.status !== 'pending' ? `<div>By: ${l.approver_name} (${l.approver_position}) | ${l.action_date} | Message: ${l.action_message || '-'}</div>` : ''}
    `;
    list.appendChild(li);
  });
}

async function loadLeaves() {
  const leaves = await fetchLeaves();
  renderAllLeaves(leaves);
  renderDepartmentLeaves(leaves);
  renderMyLeaves(leaves);
}

document.addEventListener("DOMContentLoaded", async () => {
  await getUser();
  renderForm();
  loadLeaves();
  document.getElementById("leave-form").addEventListener("submit", async e => {
    e.preventDefault();
    const type = document.getElementById("leave-type").value;
    const start = document.getElementById("start-date").value;
    const end = document.getElementById("end-date").value;
    if (!start || !end) return;
    await applyLeave(type, start, end);
    document.getElementById("leave-form").reset();
    loadLeaves();
  });
});
