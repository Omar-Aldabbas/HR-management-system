import { safeFetch } from "./helper/safeFetch.js";

const leaveApi = "leaves.php";

let user = {};
let leaves = [];
let currentFilter = "all";

async function getUser() {
    const res = await safeFetch("personal-data.php", "get");
    if (res.success && res.data) user = res.data;
    else window.location.href = "auth.html";
}

async function fetchLeaves() {
    const res = await safeFetch(leaveApi, "list");
    if (res.success) leaves = res.leaves || [];
    else leaves = [];
}

async function applyLeave(type, start, end) {
    const res = await safeFetch(leaveApi, "apply", { type, start_date: start, end_date: end });
    if (!res.success) alert(res.message);
    return res;
}

async function deleteLeave(id) {
    const res = await safeFetch(leaveApi, "delete", { id });
    if (!res.success) alert(res.message);
    return res;
}

function filterLeaves(list) {
    return currentFilter === "all" ? list : list.filter(l => l.status === currentFilter);
}

function makeList(listEl, items, renderItem) {
    listEl.innerHTML = "";
    items.forEach(item => listEl.appendChild(renderItem(item)));
}

function renderForm() {
    document.getElementById("leave-form-section")?.classList.remove("hidden");
}

function renderLeaves() {
    const section = document.getElementById("my-leaves-section");
    const list = document.getElementById("my-leaves-list");
    const myLeaves = filterLeaves(leaves.filter(l => l.user_id === user.id));

    if (!myLeaves.length) {
        section?.classList.add("hidden");
        if (list) list.innerHTML = "";
        return;
    }

    section?.classList.remove("hidden");

    makeList(list, myLeaves, l => {
        const li = document.createElement("li");
        li.className = "p-2 border border-gray-300 rounded flex flex-col gap-1";
        li.innerHTML = `
            <div><strong>${l.type}</strong> (${l.start_date} to ${l.end_date})</div>
            <div>Status: ${l.status}</div>
            ${l.status !== "pending" ? `<div>By: ${l.approver_name || "-"} | ${l.approver_role || "-"} | ${l.action_date || "-"} | ${l.action_message || "-"}</div>` : ""}
            ${l.status === "pending" ? `<button class="delete-btn px-2 py-1 bg-blue-900 hover:bg-blue-800 text-white rounded mt-1" data-id="${l.id}">Cancel</button>` : ""}
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

function setupFilters() {
    document.querySelectorAll(".filter-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            currentFilter = btn.dataset.filter;
            renderLeaves();
        });
    });
}

async function loadLeaves() {
    await fetchLeaves();
    renderForm();
    renderLeaves();
}

document.addEventListener("DOMContentLoaded", async () => {
    await getUser();
    document.getElementById("filters-row")?.classList.remove("hidden");
    setupFilters();

    await loadLeaves();

    document.getElementById("leave-form")?.addEventListener("submit", async e => {
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
