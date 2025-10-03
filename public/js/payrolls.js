import { safeFetch } from "./helper/safeFetch.js";

document.addEventListener("DOMContentLoaded", loadCurrentUser);

let currentUser = null;
let employees = [];

/** Load the logged in user */
async function loadCurrentUser() {
  const res = await safeFetch("users.php", "get");
  if (res.success && res.data) {
    currentUser = res.data;
    renderUI();

    // HR or HR manager can load all employees
    if (["hr", "hr_manager"].includes(currentUser.role.toLowerCase())) {
      await loadEmployees();
    }

    // Everyone can see their own payrolls, HR/manager see more
    await loadPayrolls();
  } else {
    alert(res.message || "Failed to load current user");
  }
}

/** Load employees list for HR/manager */
async function loadEmployees() {
  const res = await safeFetch("users.php", "list");
  if (res.success && Array.isArray(res.users)) {
    employees = res.users;
    renderEmployeeOptions();
  }
}

/** Load payrolls for current user / dept / all */
async function loadPayrolls() {
  const res = await safeFetch("payrolls.php", "list");
  if (res.success && Array.isArray(res.payrolls)) {
    renderPayrolls(res.payrolls);
  } else {
    const tbody = document.getElementById("payrolls-body");
    tbody.innerHTML = `<tr><td colspan="10" class="text-center p-4">No payrolls found</td></tr>`;
  }
}

/** Show/hide buttons depending on role */
function renderUI() {
  const addBtn = document.getElementById("add-payroll-btn");
  if (["hr", "hr_manager"].includes(currentUser.role.toLowerCase())) {
    addBtn.classList.remove("hidden");
  } else {
    addBtn.classList.add("hidden");
  }
}

/** Fill employee select dropdown */
function renderEmployeeOptions() {
  const select = document.getElementById("employee-select");
  if (!select) return;
  select.innerHTML = `<option value="">Select Employee</option>`;
  employees.forEach(emp => {
    const opt = document.createElement("option");
    opt.value = emp.id;
    opt.textContent = `${emp.name} (${emp.department} - ${emp.role})`;
    select.appendChild(opt);
  });
}

/** Render payroll table rows */
function renderPayrolls(payrolls) {
  const tbody = document.getElementById("payrolls-body");
  tbody.innerHTML = "";
  payrolls.forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="border px-4 py-2">${p.name}</td>
      <td class="border px-4 py-2">${p.department}</td>
      <td class="border px-4 py-2">${p.role}</td>
      <td class="border px-4 py-2">${p.year}-${p.month}</td>
      <td class="border px-4 py-2">${p.base_salary}</td>
      <td class="border px-4 py-2">${p.additions}</td>
      <td class="border px-4 py-2">${p.deductions}</td>
      <td class="border px-4 py-2">${p.taxes}</td>
      <td class="border px-4 py-2">${p.net_salary}</td>
      <td class="border px-4 py-2">${p.last_payment || "-"}</td>
      <td class="border px-4 py-2">${p.approved_by || "-"}</td>
    `;
    tbody.appendChild(tr);
  });
}

/** Show form */
document.getElementById("add-payroll-btn")?.addEventListener("click", () => {
  document.getElementById("payroll-form-section").classList.remove("hidden");
});

/** Hide form */
document.getElementById("close-form-btn")?.addEventListener("click", () => {
  document.getElementById("payroll-form-section").classList.add("hidden");
});

/** Submit payroll form */
document.getElementById("payroll-form")?.addEventListener("submit", async e => {
  e.preventDefault();

  const userId = parseInt(document.getElementById("employee-select").value);

  if (!userId) {
    alert("Please select an employee");
    return;
  }

  const data = {
    user_id: userId,
    year: parseInt(document.getElementById("year").value),
    month: parseInt(document.getElementById("month").value),
    base_salary: parseFloat(document.getElementById("base-salary").value),
    additions: parseFloat(document.getElementById("additions").value),
    deductions: parseFloat(document.getElementById("deductions").value),
    taxes: parseFloat(document.getElementById("taxes").value),
  };

  const res = await safeFetch("payrolls.php", "add", data);

  if (res.success) {
    document.getElementById("payroll-form").reset();
    document.getElementById("payroll-form-section").classList.add("hidden");
    await loadPayrolls();
  } else {
    alert(res.message || "Failed to add payroll");
  }
});
