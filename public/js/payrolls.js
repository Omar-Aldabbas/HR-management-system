import { safeFetch } from "./helper/safeFetch.js";

let currentUser = null;
let payrolls = [];
let filteredPayrolls = [];

document.addEventListener("DOMContentLoaded", init);

async function init() {
  await loadCurrentUser();
  await loadPayrolls();
  setupEvents();
  prefillDate();
}

async function loadCurrentUser() {
  const res = await safeFetch("users.php", "get");
  if (res.success) currentUser = res.data;
  adjustUIByRole();
}

async function loadPayrolls(view = "my") {
  if (!currentUser) return;
  const res = await safeFetch("payrolls.php", "list");
  if (!res.success) {
    document.getElementById("payroll-container").innerHTML =
      "<p class='text-red-500 text-center py-6'>Failed to load payrolls</p>";
    return;
  }
  payrolls = res.payrolls;

  if (view === "my")
    filteredPayrolls = payrolls.filter((p) => p.user_id === currentUser.id);
  else
    filteredPayrolls = payrolls.sort(
      (a, b) => b.year - a.year || b.month - a.month
    );

  renderPayrolls();
}

function renderPayrolls() {
  const container = document.getElementById("payroll-container");
  if (!filteredPayrolls.length) {
    container.innerHTML =
      "<p class='text-gray-500 text-center py-6'>No payrolls found</p>";
    return;
  }
  container.innerHTML = filteredPayrolls
    .map(
      (p) => `
    <div class="bg-white shadow rounded-xl p-4 border w-full transition hover:shadow-lg">
      <div class="flex justify-between items-center cursor-pointer" onclick="toggleDetails(${
        p.id
      })">
        <div>
          <h3 class="text-lg font-semibold text-blue-900">${p.name} (${
        p.role
      })</h3>
          <p class="text-sm text-gray-500">${p.department} - ${p.month}/${
        p.year
      }</p>
        </div>
        <span class="text-sm text-gray-700 font-semibold">$${parseFloat(
          p.net_salary || 0
        ).toFixed(2)}</span>
      </div>
      <div id="details-${
        p.id
      }" class="mt-3 hidden text-gray-700 space-y-1 text-sm">
        <p><strong>Base Salary:</strong> $${parseFloat(
          p.base_salary || 0
        ).toFixed(2)}</p>
        <p><strong>Additions:</strong> $${parseFloat(p.additions || 0).toFixed(
          2
        )}</p>
        <p><strong>Deductions:</strong> $${parseFloat(
          p.deductions || 0
        ).toFixed(2)}</p>
        <p><strong>Taxes:</strong> $${parseFloat(p.taxes || 0).toFixed(2)}</p>
        <p><strong>Approved Expenses:</strong> $${parseFloat(
          p.approved_expenses || 0
        ).toFixed(2)}</p>
        <p><strong>Net Salary:</strong> $${parseFloat(
          p.net_salary || 0
        ).toFixed(2)}</p>
        <p><strong>Approved By:</strong> ${p.approved_by_name || "Pending"}</p>
        <p><strong>Last Payment Date:</strong> ${
          p.last_payment_date || "N/A"
        }</p>
      </div>
    </div>
  `
    )
    .join("");
}

window.toggleDetails = function (id) {
  const details = document.getElementById(`details-${id}`);
  if (details) details.classList.toggle("hidden");
};

function setupEvents() {
  if (!currentUser) return;

  const role = currentUser.role.toLowerCase();
  const hrRoles = ["hr", "hr_manager", "admin"];
  if (hrRoles.includes(role)) {
    document
      .getElementById("btn-my-payrolls")
      ?.addEventListener("click", () => loadPayrolls("my"));
    document
      .getElementById("btn-all-payrolls")
      ?.addEventListener("click", () => loadPayrolls("all"));
    document
      .getElementById("search-payrolls")
      ?.addEventListener("input", (e) => {
        const term = e.target.value.toLowerCase();
        filteredPayrolls = payrolls.filter(
          (p) =>
            p.name.toLowerCase().includes(term) ||
            (p.department && p.department.toLowerCase().includes(term))
        );
        renderPayrolls();
      });
    document.getElementById("add-payroll-btn")?.classList.remove("hidden");
  }

  document
    .getElementById("add-payroll-btn")
    ?.addEventListener("click", openPayrollModal);
  document
    .getElementById("close-payroll-modal")
    ?.addEventListener("click", closePayrollModal);
  document
    .getElementById("payroll-form")
    ?.addEventListener("submit", handlePayrollSubmit);

  if (hrRoles.includes(role)) loadEmployeesOptions();
}

function adjustUIByRole() {
  const role = currentUser.role.toLowerCase();
  const hrRoles = ["hr", "hr_manager", "admin"];
  if (!hrRoles.includes(role)) {
    document.getElementById("btn-my-payrolls")?.classList.add("hidden");
    document.getElementById("btn-all-payrolls")?.classList.add("hidden");
    document.getElementById("search-payrolls")?.classList.add("hidden");
  }
}

function prefillDate() {
  const now = new Date();
  const yearInput = document.getElementById("payroll-year");
  const monthInput = document.getElementById("payroll-month");
  if (yearInput) yearInput.value = now.getFullYear();
  if (monthInput) monthInput.value = now.getMonth() + 1;
}

async function loadEmployeesOptions() {
  const res = await safeFetch("users.php", "list");
  if (!res.success) return;
  const select = document.getElementById("employee-select");
  if (!select) return;
  select.innerHTML = `<option value="">Select Employee</option>`;
  res.users.forEach((u) => {
    const opt = document.createElement("option");
    opt.value = u.id;
    opt.textContent = `${u.name} (${u.department})`;
    select.appendChild(opt);
  });
}

function openPayrollModal() {
  const modal = document.getElementById("payroll-modal");
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function closePayrollModal() {
  const modal = document.getElementById("payroll-modal");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

async function handlePayrollSubmit(e) {
  e.preventDefault();
  const employeeId = document.getElementById("employee-select")?.value;
  if (!employeeId) return alert("Select an employee");
  const base = parseFloat(document.getElementById("base-salary")?.value || 0);
  const additions = parseFloat(
    document.getElementById("additions")?.value || 0
  );
  const deductions = parseFloat(
    document.getElementById("deductions")?.value || 0
  );
  const taxes = parseFloat(document.getElementById("taxes")?.value || 0);
  const year = parseInt(document.getElementById("payroll-year")?.value || 0);
  const month = parseInt(document.getElementById("payroll-month")?.value || 0);

  const res = await safeFetch("payrolls.php", "add", {
    user_id: employeeId,
    base_salary: base,
    additions,
    deductions,
    taxes,
    year,
    month,
  });

  if (res.success) {
    closePayrollModal();
    await loadPayrolls();
    document.getElementById("payroll-form")?.reset();
    prefillDate();
  } else alert(res.message || "Failed to submit payroll");
}
