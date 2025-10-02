import { safeFetch } from './helper/safeFetch.js';

const expenseApi = "expenses.php";
const userApi = "personal-data.php";

let allExpenses = [];
let currentUser = null;

document.addEventListener("DOMContentLoaded", initialize);

async function initialize() {
  await fetchUser();
  await fetchExpenses();
  setupFilters();
}

async function fetchUser() {
  const res = await safeFetch(userApi, "get-user");
  if (!res?.success) {
    currentUser = { role: "employee" };
  } else {
    currentUser = res.data;
    currentUser.role = (currentUser.role || "employee").toLowerCase();
  }
  renderRoleSection();
}

function renderRoleSection() {
  const section = document.getElementById("role-based-section");
  if (!section) return;

  if (!currentUser) {
    section.innerHTML = "<p class='text-center text-gray-500'>Please login to manage expenses.</p>";
    return;
  }

  if (!["employee", "sales"].includes(currentUser.role)) {
    section.innerHTML = "<p class='text-center text-gray-500'>You cannot add expenses.</p>";
    return;
  }

  section.innerHTML = `
    <h2 class="text-lg font-semibold mb-4">Add Expense</h2>
    <form id="expense-form" class="space-y-4">
      <div>
        <label class="block text-sm font-medium">Amount</label>
        <input type="number" step="0.01" id="expense-amount" required
          class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-gray-50"/>
      </div>
      <div>
        <label class="block text-sm font-medium">Reason</label>
        <textarea id="expense-reason" required
          class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-gray-50"></textarea>
      </div>
      <button type="submit"
        class="w-full px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black">
        Submit Expense
      </button>
    </form>
  `;
  document.getElementById("expense-form")?.addEventListener("submit", addExpense);
}

async function fetchExpenses() {
  const res = await safeFetch(expenseApi, "list");
  if (!res?.success) return;
  allExpenses = res.expenses || [];
  renderSummary();
  renderExpenses(allExpenses);
}

function renderSummary() {
  const totalPending = allExpenses.filter((e) => e.status === "pending").length;
  const totalApproved = allExpenses.filter((e) => e.status === "approved").length;
  const totalRejected = allExpenses.filter((e) => e.status === "rejected").length;
  const sumAll = allExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const sumPending = allExpenses.filter((e) => e.status === "pending").reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const sumApproved = allExpenses.filter((e) => e.status === "approved").reduce((sum, e) => sum + parseFloat(e.amount), 0);

  document.getElementById("total-all").textContent = `$${sumAll.toFixed(2)}`;
  document.getElementById("total-review").textContent = `$${sumPending.toFixed(2)}`;
  document.getElementById("total-approved").textContent = `$${sumApproved.toFixed(2)}`;
  document.getElementById("count-review").textContent = totalPending;
  document.getElementById("count-approved").textContent = totalApproved;
  document.getElementById("count-rejected").textContent = totalRejected;
}

function renderExpenses(list) {
  const container = document.getElementById("expense-list");
  if (!container) return;
  container.innerHTML = "";
  if (list.length === 0) {
    container.innerHTML = "<p class='text-center text-gray-500'>No expenses found.</p>";
    return;
  }

  list.forEach((exp) => {
    const li = document.createElement("li");
    li.className = `bg-white rounded-lg shadow p-4 border-l-4 ${
      exp.status === "approved" ? "border-green-500" :
      exp.status === "pending" ? "border-yellow-500" : "border-red-500"
    } hover:shadow-xl transition`;

    const date = new Date(exp.created_at).toLocaleDateString();
    li.innerHTML = `
      <p class="text-sm text-gray-500 mb-1">${date}</p>
      <div class="flex justify-between items-center">
        <div>
          <p class="font-semibold text-gray-900">$${parseFloat(exp.amount).toFixed(2)}</p>
          <p class="text-gray-700">${exp.reason}</p>
        </div>
        <div class="flex items-center gap-2">
          <span class="px-2 py-1 text-xs rounded ${
            exp.status === "approved" ? "bg-green-100 text-green-600" :
            exp.status === "pending" ? "bg-yellow-100 text-yellow-600" : "bg-red-100 text-red-600"
          }">${exp.status}</span>
          ${
            currentUser && ["employee", "sales"].includes(currentUser.role) && exp.status === "pending"
              ? `<button data-id="${exp.id}" class="cancel-btn text-xs text-red-600 hover:underline">Cancel</button>`
              : ""
          }
        </div>
      </div>
    `;
    container.appendChild(li);
  });

  document.querySelectorAll(".cancel-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      if (!confirm("Cancel this expense?")) return;
      const res = await safeFetch(expenseApi, "delete", { id });
      if (res.success) await fetchExpenses();
      else alert(res.message || "Failed to cancel expense");
    });
  });
}

async function addExpense(e) {
  e.preventDefault();
  const amount = parseFloat(document.getElementById("expense-amount").value);
  const reason = document.getElementById("expense-reason").value.trim();
  if (!amount || !reason) {
    alert("Please enter amount and reason.");
    return;
  }
  const res = await safeFetch(expenseApi, "create", { amount, reason });
  if (res.success) {
    document.getElementById("expense-form").reset();
    await fetchExpenses();
  } else {
    alert(res.message || "Failed to add expense");
  }
}

function setupFilters() {
  const buttons = document.querySelectorAll(".filter-btn");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("border-2", "border-black"));
      btn.classList.add("border-2", "border-black");
      const status = btn.dataset.status;
      if (status === "all") renderExpenses(allExpenses);
      else renderExpenses(allExpenses.filter((e) => e.status === status));
    });
  });
}
