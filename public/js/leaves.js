import { safeFetch } from "./helper/safeFetch.js";

const leaveApi = "leaves.php";

let user = {};
let allLeaves = [];
let currentFilter = "all";

async function getUser() {
    const res = await safeFetch("personal-data.php", "get");
    if (res.success && res.data) user = res.data;
    else window.location.href = "auth.html";
}

async function fetchLeaves() {
    const res = await safeFetch(leaveApi, "list");
    allLeaves = res.success ? res.leaves : [];
}

async function applyLeave(type, start, end) {
    const res = await safeFetch(leaveApi, "apply", { type, start_date: start, end_date: end });
    if (!res.success) alert(res.message);
    return res;
}

async function updateLeave(id, status, message = "") {
    const res = await safeFetch(leaveApi, "update", { id, status, message });
    if (!res.success) alert(res.message);
    return res;
}

async function deleteLeave(id) {
    const res = await safeFetch(leaveApi, "delete", { id });
    if (!res.success) alert(res.message);
    return res;
}

function filterLeaves(leaves) {
    return currentFilter === "all" ? leaves : leaves.filter(l => l.status === currentFilter);
}

function makeExpandableList(listEl, leaves, renderItem) {
    listEl.innerHTML = "";
    const visibleCount = 3;
    let expanded = false;

    const render = () => {
        listEl.innerHTML = "";
        const toShow = expanded ? leaves : leaves.slice(0, visibleCount);
        toShow.forEach(l => listEl.appendChild(renderItem(l)));

        if (leaves.length > visibleCount) {
            const toggleLi = document.createElement("li");
            toggleLi.className = "p-2 cursor-pointer text-blue-700 hover:underline";
            toggleLi.textContent = expanded ? "Show Less" : `Show More (${leaves.length - visibleCount} more)`;
            toggleLi.addEventListener("click", () => {
                expanded = !expanded;
                render();
            });
            listEl.appendChild(toggleLi);
        }
    };

    render();
}

function renderForm() {
    if (["employee", "manager", "hr"].includes(user.role)) {
        document.getElementById("leave-form-section")?.classList.remove("hidden");
    }
}

function renderMyLeaves() {
    const section = document.getElementById("my-leaves-section");
    const list = document.getElementById("my-leaves-list");

    const leaves = filterLeaves(allLeaves.filter(l => l.user_id === user.id));
    if (!leaves.length) {
        section?.classList.add("hidden");
        if (list) list.innerHTML = "";
        return;
    }

    section?.classList.remove("hidden");

    makeExpandableList(list, leaves, l => {
        const li = document.createElement("li");
        li.className = "p-2 border border-gray-300 rounded flex flex-col gap-1";
        li.innerHTML = `
            <div><strong>${l.type}</strong> (${l.start_date} to ${l.end_date})</div>
            <div>Status: ${l.status}</div>
            ${l.status !== "pending" ? `<div>By: ${l.approver_name || "-"} | ${l.action_date || "-"} | ${l.action_message || "-"}</div>` : ""}
            ${l.status === "pending" ? `<button class="delete-btn px-2 py-1 bg-blue-900 hover:bg-blue-800 text-white rounded mt-1" data-id="${l.id}">Cancel</button>` : ""}
        `;

        li.querySelectorAll(".delete-btn").forEach(btn =>
            btn.addEventListener("click", async () => {
                await deleteLeave(btn.dataset.id);
                await loadLeaves();
            })
        );

        return li;
    });
}

function renderDepartmentOrAllLeaves() {
    const deptSection = document.getElementById("employee-leaves-section");
    const allSection = document.getElementById("all-leaves-section");

    deptSection?.classList.add("hidden");
    allSection?.classList.add("hidden");

    const othersLeaves = filterLeaves(allLeaves.filter(l => l.user_id !== user.id));

    if (user.role === "manager") {
        const deptLeaves = othersLeaves.filter(l => l.department === user.department);
        if (deptLeaves.length) {
            deptSection?.classList.remove("hidden");
            makeExpandableList(document.getElementById("employee-leaves-list"), deptLeaves, renderLeaveActionItem);
        }
    }

    if (user.role === "hr" && othersLeaves.length) {
        allSection?.classList.remove("hidden");
        makeExpandableList(document.getElementById("all-leaves-list"), othersLeaves, renderLeaveActionItem);
    }
}

function renderLeaveActionItem(l) {
    const li = document.createElement("li");
    li.className = "p-2 border border-gray-300 rounded flex flex-col gap-1";
    li.innerHTML = `
        <div><strong>${l.user_name}</strong> (${l.department} / ${l.role}) - ${l.type} (${l.start_date} to ${l.end_date})</div>
        <div>Status: ${l.status}</div>
        ${l.status !== "pending" ? `<div>By: ${l.approver_name || "-"} | ${l.action_date || "-"} | ${l.action_message || "-"}</div>` : ""}
        ${l.status === "pending" ? `
            <input type="text" placeholder="Message" class="action-msg border p-1 rounded w-full mb-1 bg-gray-100 text-gray-900">
            <div class="flex gap-2">
                <button data-id="${l.id}" data-status="approved" class="px-2 py-1 bg-blue-900 hover:bg-blue-800 text-white rounded">Approve</button>
                <button data-id="${l.id}" data-status="rejected" class="px-2 py-1 bg-blue-900 hover:bg-blue-800 text-white rounded">Reject</button>
            </div>` : ""}
    `;

    li.querySelectorAll("button").forEach(btn =>
        btn.addEventListener("click", async () => {
            const message = btn.closest("li").querySelector(".action-msg")?.value || "";
            await updateLeave(btn.dataset.id, btn.dataset.status, message);
            await loadLeaves();
        })
    );

    return li;
}

async function loadLeaves() {
    await fetchLeaves();
    renderForm();
    renderMyLeaves();
    renderDepartmentOrAllLeaves();
}

function setupFilterButtons() {
    document.querySelectorAll(".filter-btn").forEach(btn =>
        btn.addEventListener("click", () => {
            currentFilter = btn.dataset.filter;
            loadLeaves();
        })
    );
}

document.addEventListener("DOMContentLoaded", async () => {
    await getUser();
    document.getElementById("filters-row")?.classList.remove("hidden");
    setupFilterButtons();

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
