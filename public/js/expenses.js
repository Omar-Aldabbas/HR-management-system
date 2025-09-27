const apiBase = "http://localhost/HR-project/api";
const expenseApi = `${apiBase}/expenses.php`;
const userApi = `${apiBase}/personal-data.php`;
let allExpenses = [];
let currentUser = null;

async function safeFetch(url, data = {}, method = "POST") {
  try {
    const res = await fetch(url, {
      method,
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: method === "POST" ? JSON.stringify(data) : undefined,
    });
    return await res.json();
  } catch {
    return {};
  }
}

async function initialize() {
  await fetchUser();
  await fetchExpenses();
  setupFilters();
}

async function fetchUser() {
  try {
    const res = await fetch(userApi, { credentials: "include" });
    const json = await res.json();
    if (json.success && json.data) {
      currentUser = json.data;
      currentUser.role = currentUser.role.toLowerCase();
      console.log(currentUser);
      renderRoleSection();
    }
  } catch (err) {
    console.error("No User Found");
  }
}

async function fetchExpenses() {
  const res = await safeFetch(expenseApi, { action: "list" });
  if (!res.success) return;
  allExpenses = res.expenses;
  renderSummary();
  renderExpenses(allExpenses);
  updateFilterCounts();
  if (currentUser && ["manager", "admin", "hr"].includes(currentUser.role))
    renderReviewList();
}

function renderRoleSection() {
  const section = document.getElementById("role-based-section");
  if (!section || !currentUser) return;
  section.innerHTML = "";
  if (["employee", "sales"].includes(currentUser.role)) {
    section.innerHTML = `
      <h2 class="text-lg font-semibold mb-4">Add Expense</h2>
      <form id="expense-form" class="space-y-4">
        <div>
          <label class="block text-sm font-medium">Amount</label>
          <input type="number" step="0.01" id="expense-amount" required
            class="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label class="block text-sm font-medium">Reason</label>
          <textarea id="expense-reason" required
            class="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
        </div>
        <button type="submit"
          class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
          Submit Expense
        </button>
      </form>
    `;
    document
      .getElementById("expense-form")
      .addEventListener("submit", addExpense);
  } else {
    section.innerHTML = `
      <h2 class="text-lg font-semibold mb-4">Expenses to Review</h2>
      <ul id="review-list" class="space-y-3"></ul>
    `;
    renderReviewList();
  }
}

async function renderReviewList() {
  if (!currentUser) return;
  const ul = document.getElementById("review-list");
  if (!ul) return;
  ul.innerHTML = "";
  allExpenses
    .filter((e) => e.status === "pending")
    .forEach((exp) => {
      const li = document.createElement("li");
      li.className = "border p-4 rounded shadow flex flex-col";
      const date = new Date(exp.created_at).toLocaleDateString();
      li.innerHTML = `
      <div class="flex justify-between">
        <div>
          <p class="font-semibold">${exp.user_name || exp.employee_name}</p>
          <p class="text-sm text-gray-600">${exp.department || ""} • ${
        exp.position || ""
      }</p>
        </div>
        <div class="text-right">
          <p class="font-bold">$${parseFloat(exp.amount).toFixed(2)}</p>
          <p class="text-sm text-gray-500">${date}</p>
        </div>
      </div>
      <p class="mt-2 text-gray-700">${exp.reason}</p>
      <div class="mt-3 flex gap-2">
        <button data-id="${exp.id}" data-action="approve"
          class="review-btn bg-green-500 text-white px-3 py-1 rounded">Approve</button>
        <button data-id="${exp.id}" data-action="reject"
          class="review-btn bg-red-500 text-white px-3 py-1 rounded">Reject</button>
      </div>
    `;
      ul.appendChild(li);
    });
  ul.querySelectorAll(".review-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      const status = action === "approve" ? "approved" : "rejected";
      await safeFetch(expenseApi, { action: "update", id, status });
      await fetchExpenses();
    });
  });
}

function renderSummary() {
  let total = 0,
    pending = 0,
    approved = 0;
  allExpenses.forEach((e) => {
    total += parseFloat(e.amount);
    if (e.status === "pending") pending += parseFloat(e.amount);
    if (e.status === "approved") approved += parseFloat(e.amount);
  });
  document.getElementById("total-all").textContent = `$${total.toFixed(2)}`;
  document.getElementById("total-review").textContent = `$${pending.toFixed(
    2
  )}`;
  document.getElementById("total-approved").textContent = `$${approved.toFixed(
    2
  )}`;
}

function renderExpenses(list) {
  const container = document.getElementById("expense-list");
  container.innerHTML = "";
  list.forEach((exp) => {
    const li = document.createElement("li");
    li.className =
      "bg-white rounded-lg shadow p-4 border-l-4 " +
      (exp.status === "approved"
        ? "border-green-500"
        : exp.status === "pending"
        ? "border-yellow-500"
        : "border-red-500");
    const date = new Date(exp.created_at).toLocaleDateString();
    li.innerHTML = `
      <p class="text-sm text-gray-500 mb-1">${date}</p>
      <div class="flex justify-between items-center">
        <div>
          <p class="font-semibold">$${parseFloat(exp.amount).toFixed(2)}</p>
          <p class="text-gray-700">${exp.reason}</p>
        </div>
        <span class="px-2 py-1 text-xs rounded ${
          exp.status === "approved"
            ? "bg-green-100 text-green-600"
            : exp.status === "pending"
            ? "bg-yellow-100 text-yellow-600"
            : "bg-red-100 text-red-600"
        }">${exp.status}</span>
      </div>
    `;
    container.appendChild(li);
  });
}

function updateFilterCounts() {
  const counts = { pending: 0, approved: 0, rejected: 0 };
  allExpenses.forEach((e) =>
    counts[e.status] !== undefined ? counts[e.status]++ : null
  );
  document.getElementById("count-review").textContent = counts.pending;
  document.getElementById("count-approved").textContent = counts.approved;
  document.getElementById("count-rejected").textContent = counts.rejected;
}

async function addExpense(e) {
  e.preventDefault();
  const amount = parseFloat(document.getElementById("expense-amount").value);
  const reason = document.getElementById("expense-reason").value.trim();
  if (!amount || !reason) return;
  const res = await safeFetch(expenseApi, { action: "create", amount, reason });
  if (res.success) {
    e.target.reset();
    await fetchExpenses();
  } else {
    alert(res.message);
  }
}

function setupFilters() {
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const status = btn.dataset.status;
      renderExpenses(allExpenses.filter((e) => e.status === status));
    });
  });
}

document.addEventListener("DOMContentLoaded", initialize);
