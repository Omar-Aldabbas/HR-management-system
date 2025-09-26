const apiBase = "http://localhost/HR-project/api";



const expenseApi = `${apiBase}/expenses.php`;
let allExpenses = [];

async function fetchExpenses() {
  const res = await safeFetch(`${expenseApi}`, { action: "list" }, "POST");
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
  const currentMonth = `${month} ${year}`;

  let total = 0,
    pending = 0,
    approved = 0,
    rejected = 0;

  allExpenses.forEach((exp) => {
    total += parseFloat(exp.amount);
    if (exp.status === "pending") pending += parseFloat(exp.amount);
    if (exp.status === "approved") approved += parseFloat(exp.amount);
    if (exp.status === "rejected") rejected += parseFloat(exp.amount);
  });

  document.getElementById("summary-period").textContent = currentMonth;
  document.getElementById("summary-total").textContent = `$${total.toFixed(2)}`;
  document.getElementById("summary-pending").textContent = `$${pending.toFixed(2)}`;
  document.getElementById("summary-approved").textContent = `$${approved.toFixed(2)}`;
  document.getElementById("summary-rejected").textContent = `$${rejected.toFixed(2)}`;
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
  allExpenses.forEach((e) => {
    if (counts[e.status] !== undefined) counts[e.status]++;
  });

  document.getElementById("filter-pending").textContent = `Review (${counts.pending})`;
  document.getElementById("filter-approved").textContent = `Approved (${counts.approved})`;
  document.getElementById("filter-rejected").textContent = `Rejected (${counts.rejected})`;
}

async function addExpense(e) {
  e.preventDefault();
  const amount = parseFloat(document.getElementById("expense-amount").value);
  const reason = document.getElementById("expense-reason").value;

  if (!amount || !reason) {
    alert("Amount and reason are required");
    return;
  }

  const res = await safeFetch(
    expenseApi,
    { action: "create", amount, reason },
    "POST"
  );

  if (res.success) {
    document.getElementById("expense-form").reset();
    fetchExpenses();
  } else {
    alert(res.message);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  fetchExpenses();

  document.getElementById("expense-form").addEventListener("submit", addExpense);

  document.getElementById("btn-pending").addEventListener("click", () => {
    renderExpenses(allExpenses.filter((e) => e.status === "pending"));
  });

  document.getElementById("btn-approved").addEventListener("click", () => {
    renderExpenses(allExpenses.filter((e) => e.status === "approved"));
  });

  document.getElementById("btn-rejected").addEventListener("click", () => {
    renderExpenses(allExpenses.filter((e) => e.status === "rejected"));
  });
});
