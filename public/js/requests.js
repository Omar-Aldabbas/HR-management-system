import { safeFetch } from "./helper/safeFetch.js";

const container = document.getElementById("request-container");
const btnLeaves = document.getElementById("show-leaves");
const btnExpenses = document.getElementById("show-expenses");
const deptFilter = document.getElementById("department-filter");
const statusFilter = document.getElementById("status-filter");
const nameSearch = document.getElementById("search-name");

let currentType = "leaves";
let requests = [];
let user = null;

const loadUser = async () => {
  const res = await safeFetch("expenses.php", "get-user");
  if (!res.success) {
    if (!res.redirected) window.location.href = "auth.html";
    return null;
  }
  return res.data;
};

const loadRequests = async () => {
  container.innerHTML = `<p class="text-gray-500 col-span-full text-center">Loading...</p>`;
  let res;
  if (currentType === "leaves") res = await safeFetch("leaves.php", "list");
  else res = await safeFetch("expenses.php", "list");
  if (!res.success) {
    container.innerHTML = `<p class="text-red-500 col-span-full text-center">${res.message || "Error loading"}</p>`;
    return;
  }
  requests = currentType === "leaves" ? res.leaves || [] : res.expenses || [];
  render();
};

const render = () => {
  const dept = deptFilter.value.toLowerCase();
  const status = statusFilter.value.toLowerCase();
  const search = nameSearch.value.toLowerCase();

  const filtered = requests.filter((r) => {
    const d = (r.department || "").toLowerCase();
    const s = (r.status || "").toLowerCase();
    const n = (r.user_name || "").toLowerCase();
    return (!dept || d === dept) && (!status || s === status) && (!search || n.includes(search));
  });

  if (!filtered.length) {
    container.innerHTML = `<p class="text-gray-500 col-span-full text-center">No ${currentType} found.</p>`;
    return;
  }

  container.innerHTML = filtered
    .map((r) => {
      const isPending = r.status === "pending";
      const canAct = ["hr", "hr_manager"].includes(user.role) && isPending;
      return `
      <div class="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-3">
            <h2 class="font-semibold text-lg text-gray-800">${r.user_name || "Unknown"}</h2>
            <span class="px-3 py-1 text-sm font-medium rounded-full ${r.status === "approved" ? "bg-green-100 text-green-700" : r.status === "rejected" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}">${r.status}</span>
          </div>
          <p class="text-sm text-gray-600 mb-1"><i class="fa-solid fa-building mr-1"></i>${r.department || "N/A"}</p>
          ${
            currentType === "leaves"
              ? `<p class="text-sm text-gray-600"><i class="fa-solid fa-calendar-days mr-1"></i>${r.start_date} → ${r.end_date}</p>`
              : `<p class="text-sm text-gray-600"><i class="fa-solid fa-dollar-sign mr-1"></i>${r.amount} — ${r.reason}</p>`
          }
        </div>
        ${
          canAct
            ? `<div class="mt-4 flex gap-2">
                <button data-id="${r.id}" data-status="approved" class="approve-btn flex-1 bg-green-600 text-white py-2 rounded-xl hover:bg-green-700 transition">Approve</button>
                <button data-id="${r.id}" data-status="rejected" class="reject-btn flex-1 bg-red-600 text-white py-2 rounded-xl hover:bg-red-700 transition">Reject</button>
              </div>`
            : ""
        }
      </div>`;
    })
    .join("");

  document.querySelectorAll(".approve-btn").forEach((b) =>
    b.addEventListener("click", (e) => updateStatus(e.target.dataset.id, "approved"))
  );
  document.querySelectorAll(".reject-btn").forEach((b) =>
    b.addEventListener("click", (e) => updateStatus(e.target.dataset.id, "rejected"))
  );
};

const updateStatus = async (id, status) => {
  if (!id || !status) return;
  const file = currentType === "leaves" ? "leaves.php" : "expenses.php";
  const res = await safeFetch(file, "update", { id: parseInt(id), status });
  if (res.success) loadRequests();
};

[btnLeaves, btnExpenses].forEach((btn) =>
  btn.addEventListener("click", (e) => {
    currentType = e.target.id === "show-leaves" ? "leaves" : "expenses";
    btnLeaves.classList.toggle("bg-blue-900", currentType === "leaves");
    btnLeaves.classList.toggle("bg-blue-700", currentType !== "leaves");
    btnExpenses.classList.toggle("bg-green-700", currentType === "expenses");
    btnExpenses.classList.toggle("bg-green-600", currentType !== "expenses");
    loadRequests();
  })
);

[deptFilter, statusFilter, nameSearch].forEach((el) =>
  el.addEventListener("input", () => render())
);

document.addEventListener("DOMContentLoaded", async () => {
  user = await loadUser();
  if (!user) return;
  loadRequests();
});
