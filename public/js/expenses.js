import { safeFetch } from './helper/safeFetch.js'

const expenseApi = "expenses.php"
const userApi = "personal-data.php"
let allExpenses = []
let currentUser = null

document.addEventListener("DOMContentLoaded", async () => {
  await loadUser()
  await loadExpenses()
  setupFilters()
})

async function loadUser() {
  const res = await safeFetch(userApi, "get-user")
  currentUser = res?.success ? res.data : { role: "employee" }
  currentUser.role = (currentUser.role || "employee").toLowerCase()
  const section = document.getElementById("role-based-section")
  if (!section) return
  if (!currentUser) {
    section.innerHTML = `<p class="text-center text-gray-400">Please log in to manage expenses.</p>`
    return
  }
  if (!["employee", "sales"].includes(currentUser.role)) {
    section.innerHTML = `<p class="text-center text-gray-400">You cannot add expenses.</p>`
    return
  }
  section.innerHTML = `
    <h2 class="text-lg font-semibold mb-4 text-[var(--onyx-text-primary)]">Add Expense</h2>
    <form id="expense-form" class="space-y-5">
      <div>
        <label class="block text-sm font-medium text-[var(--onyx-text-secondary)]">Amount</label>
        <input id="expense-amount" type="number" step="0.01" required class="w-full px-4 py-3 bg-[var(--onyx-bg-soft)] border border-[var(--onyx-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--onyx-accent-1)] transition"/>
      </div>
      <div>
        <label class="block text-sm font-medium text-[var(--onyx-text-secondary)]">Reason</label>
        <textarea id="expense-reason" required class="w-full px-4 py-3 bg-[var(--onyx-bg-soft)] border border-[var(--onyx-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--onyx-accent-1)] transition"></textarea>
      </div>
      <button type="submit" class="w-full bg-blue-900 text-white font-medium py-3 rounded-xl hover:bg-[var(--onyx-accent-2)] transition">Submit Expense</button>
    </form>
  `
  document.getElementById("expense-form").addEventListener("submit", addExpense)
}

async function loadExpenses() {
  const res = await safeFetch(expenseApi, "list")
  if (!res?.success) return
  allExpenses = res.expenses || []
  renderSummary()
  renderExpenses(allExpenses)
}

function renderSummary() {
  const p = allExpenses.filter(e => e.status === "pending")
  const a = allExpenses.filter(e => e.status === "approved")
  const r = allExpenses.filter(e => e.status === "rejected")
  const sum = s => s.reduce((t, e) => t + parseFloat(e.amount), 0)
  document.getElementById("total-all").textContent = `$${sum(allExpenses).toFixed(2)}`
  document.getElementById("total-review").textContent = `$${sum(p).toFixed(2)}`
  document.getElementById("total-approved").textContent = `$${sum(a).toFixed(2)}`
  document.getElementById("count-review").textContent = p.length
  document.getElementById("count-approved").textContent = a.length
  document.getElementById("count-rejected").textContent = r.length
}

function renderExpenses(list) {
  const wrap = document.getElementById("expense-list")
  wrap.innerHTML = ""
  if (!list.length) {
    wrap.innerHTML = `<p class="text-center text-gray-400 py-4">No expenses found.</p>`
    return
  }
  list.forEach(e => {
    const li = document.createElement("li")
    li.className = `bg-white border-l-4 rounded-2xl shadow-sm p-5 hover:shadow-lg transition ${
      e.status === "approved" ? "border-green-500" : e.status === "pending" ? "border-yellow-500" : "border-red-500"
    }`
    li.innerHTML = `
      <div class="flex justify-between items-start">
        <div>
          <p class="text-xs text-gray-400 mb-1">${new Date(e.created_at).toLocaleDateString()}</p>
          <p class="font-semibold text-[var(--onyx-text-primary)]">$${parseFloat(e.amount).toFixed(2)}</p>
          <p class="text-[var(--onyx-text-secondary)]">${e.reason}</p>
        </div>
        <div class="flex flex-col items-end gap-2">
          <span class="px-3 py-1 text-xs rounded-lg ${
            e.status === "approved" ? "bg-green-100 text-green-600" :
            e.status === "pending" ? "bg-yellow-100 text-yellow-600" : "bg-red-100 text-red-600"
          }">${e.status}</span>
          ${
            currentUser && ["employee", "sales"].includes(currentUser.role) && e.status === "pending"
              ? `<button data-id="${e.id}" class="cancel-btn text-xs py-1 px-2 rounded-lg bg-red-200 text-red-600 hover:underline">Cancel</button>`
              : ""
          }
        </div>
      </div>
    `
    wrap.appendChild(li)
  })
  document.querySelectorAll(".cancel-btn").forEach(b => {
    b.onclick = async () => {
      if (!confirm("Cancel this expense?")) return
      const res = await safeFetch(expenseApi, "delete", { id: b.dataset.id })
      if (res.success) await loadExpenses()
      else alert(res.message || "Failed to cancel expense")
    }
  })
}

async function addExpense(e) {
  e.preventDefault()
  const amount = parseFloat(document.getElementById("expense-amount").value)
  const reason = document.getElementById("expense-reason").value.trim()
  if (!amount || !reason) return alert("Please enter amount and reason.")
  const res = await safeFetch(expenseApi, "create", { amount, reason })
  if (res.success) {
    e.target.reset()
    await loadExpenses()
  } else alert(res.message || "Failed to add expense")
}

function setupFilters() {
  document.querySelectorAll("[data-status]").forEach(b => {
    b.addEventListener("click", () => {
      document.querySelectorAll("[data-status]").forEach(x => x.classList.remove("ring-2", "ring-[var(--onyx-accent-1)]"))
      b.classList.add("ring-2", "ring-[var(--onyx-accent-1)]")
      const s = b.dataset.status
      renderExpenses(s === "all" ? allExpenses : allExpenses.filter(e => e.status === s))
    })
  })
}
