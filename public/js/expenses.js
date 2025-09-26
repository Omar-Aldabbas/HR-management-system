const apiBase = "http://localhost/HR-project/api";
const expenseApi = `${apiBase}/expenses.php`;
let allExpenses = [];

async function safeFetch(url, data = {}, method = "POST") {
  try {
    const res = await fetch(url, {
      method,
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: method === "POST" ? JSON.stringify(data) : null,
    });
    return await res.json();
  } catch {
    return {};
  }
}

async function fetchExpenses() {
  const res = await safeFetch(expenseApi, { action: "list" });
  if (!res.success) return;
  allExpenses = res.expenses;
  renderSummary();
  renderExpenses(allExpenses);
  updateFilterCounts();
}

function renderSummary() {
  const now = new Date();
  const month = now.toLocaleString("default", { month: "long" });
  const year = now.getFullYear();
  let total = 0, pending = 0, approved = 0, rejected = 0;
  allExpenses.forEach(e => {
    total += parseFloat(e.amount);
    if (e.status === "pending") pending += parseFloat(e.amount);
    if (e.status === "approved") approved += parseFloat(e.amount);
    if (e.status === "rejected") rejected += parseFloat(e.amount);
  });
  document.getElementById("total-all").textContent = `$${total.toFixed(2)}`;
  document.getElementById("total-review").textContent = `$${pending.toFixed(2)}`;
  document.getElementById("total-approved").textContent = `$${approved.toFixed(2)}`;
}

function renderExpenses(list) {
  const container = document.getElementById("expense-list");
  container.innerHTML = "";
  list.forEach(exp => {
    const li = document.createElement("li");
    li.className = "bg-white rounded-lg shadow p-4 border-l-4 " +
      (exp.status === "approved" ? "border-green-500" :
       exp.status === "pending" ? "border-yellow-500" :
       "border-red-500");
    const date = new Date(exp.created_at).toLocaleDateString();
    li.innerHTML = `
      <p class="text-sm text-gray-500 mb-1">${date}</p>
      <div class="flex justify-between items-center">
        <div>
          <p class="font-semibold">$${parseFloat(exp.amount).toFixed(2)}</p>
          <p class="text-gray-700">${exp.reason}</p>
        </div>
        <span class="px-2 py-1 text-xs rounded ${
          exp.status === "approved" ? "bg-green-100 text-green-600" :
          exp.status === "pending" ? "bg-yellow-100 text-yellow-600" :
          "bg-red-100 text-red-600"
        }">${exp.status}</span>
      </div>
    `;
    container.appendChild(li);
  });
}

function updateFilterCounts() {
  const counts = { pending: 0, approved: 0, rejected: 0 };
  allExpenses.forEach(e => counts[e.status] !== undefined ? counts[e.status]++ : null);
  document.getElementById("count-review").textContent = counts.pending;
  document.getElementById("count-approved").textContent = counts.approved;
  document.getElementById("count-rejected").textContent = counts.rejected;
}

async function addExpense(e) {
  e.preventDefault();
  const amountEl = document.getElementById("expense-amount");
  const reasonEl = document.getElementById("expense-reason");
  const amount = parseFloat(amountEl.value);
  const reason = reasonEl.value.trim();
  if (!amount || !reason) return;
  const res = await safeFetch(expenseApi, { action: "create", amount, reason });
  if (res.success) {
    document.getElementById("expense-form").reset();
    fetchExpenses();
  } else {
    alert(res.message);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  fetchExpenses();
  const form = document.getElementById("expense-form");
  if (form) form.addEventListener("submit", addExpense);
  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const status = btn.dataset.status;
      renderExpenses(allExpenses.filter(e => e.status === status));
    });
  });
});
