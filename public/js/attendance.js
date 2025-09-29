const apiBase = "http://localhost/HR-project/api";
const attendanceApi = `${apiBase}/attendance.php`;
const userApi = `${apiBase}/personal-data.php`;

let serverTime = null;
let clientOffset = 0;
let clockInTime = null;
let timerInterval = null;
let totalBreakSeconds = 0;
let isOnBreak = false;
let breakStartTime = null;

async function safeFetch(url, data = {}) {
    try {
        const res = await fetch(url, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        return await res.json();
    } catch {
        return { success: false, message: "Network error" };
    }
}

async function getServerTime() {
    const res = await safeFetch(attendanceApi, { action: "server-time" });
    if (res.success && res.server_time) {
        serverTime = new Date(res.server_time + " UTC");
        clientOffset = new Date().getTime() - serverTime.getTime();
    } else {
        serverTime = new Date();
        clientOffset = 0;
    }
}

async function populateUser() {
    const res = await safeFetch(userApi, { action: "get-user" });
    if (!res.success) {
        if (res.redirect) window.location.href = res.redirect;
        return;
    }
    const user = res.data;
    document.getElementById("user-name").textContent = user.full_name || user.name || "User";
    document.getElementById("user-position").textContent = user.position || "Employee";
    document.getElementById("user-img").src = user.avatar ? `${apiBase}/${user.avatar}` : "https://via.placeholder.com/100";
}

function setupNavigation() {
    document.querySelectorAll(".nav-btn, .mobile-nav-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const page = btn.dataset.page;
            if (page) window.location.href = page + ".html";
        });
    });
}

function getCorrectedNow() {
    return new Date(new Date().getTime() - clientOffset);
}

function updateTimerUI() {
    if (!clockInTime) return;
    const now = getCorrectedNow();
    let diff = (now - clockInTime) / 1000;
    if (isOnBreak && breakStartTime) diff -= (now - breakStartTime) / 1000;
    diff -= totalBreakSeconds;
    if (diff < 0) diff = 0;

    const hrs = String(Math.floor(diff / 3600)).padStart(2, "0");
    const mins = String(Math.floor((diff % 3600) / 60)).padStart(2, "0");
    const secs = String(Math.floor(diff % 60)).padStart(2, "0");

    const timerEl = document.getElementById("live-timer");
    if (timerEl) timerEl.textContent = `${hrs}:${mins}:${secs}`;

    const breaksEl = document.getElementById("session-breaks");
    if (breaksEl) breaksEl.textContent = `Breaks: ${Math.floor(totalBreakSeconds / 60)} mins`;
}

function startLiveTimer() {
    clearInterval(timerInterval);
    updateTimerUI();
    timerInterval = setInterval(updateTimerUI, 1000);
}

// function getValueBetween (input, delimiter) {
//   const regex = new RegExp(`${delimiter}(.*?)${delimiter}`, 'g');
//   const matches= [];
//   let match;

//   while ((match = regex.exec(input)) !== null) {
//     matches.push(match[1]);
//   }
//   return matches
// }

// function calculateTotalHours(clockIn, clockOut, breakSeconds = 0) {
//     if (!clockOut) return 0;
//     const inTime = getValueBetween(new Date(clockIn.replace(" ", "T") + " UTC"));
//     const outTime = getValueBetween(new Date(clockOut.replace(" ", "T") + " UTC"));
//     const totalHrs = (Number(outTime) - Number(inTime)) / 3600000 - breakSeconds / 3600;
//     return totalHrs.toFixed(2);
// }

function calculateTotalHours(clockIn, clockOut, breakSeconds = 0) {
    if (!clockIn || !clockOut) return 0;

    const inTime = new Date(clockIn.replace(" ", "T"));
    const outTime = new Date(clockOut.replace(" ", "T"));

    const totalHrs = (outTime - inTime) / 3600000 - breakSeconds / 3600;

    return totalHrs.toFixed(2);
}

function updateTodaySession() {
    const statusEl = document.getElementById("session-status");
    const clockInEl = document.getElementById("session-clockin");
    const clockOutEl = document.getElementById("session-clockout");

    if (!clockInTime) {
        if (statusEl) statusEl.textContent = "No active session";
        if (clockInEl) clockInEl.textContent = "";
        if (clockOutEl) clockOutEl.textContent = "";
        return;
    }

    if (statusEl) statusEl.textContent = "Active session";
    if (clockInEl) clockInEl.textContent = `In: ${clockInTime.toLocaleString()}`;
    if (clockOutEl) clockOutEl.textContent = "";
}

async function sendAction(action) {
    const res = await safeFetch(attendanceApi, { action });

    if (!res.success) {
        if (res.redirect) window.location.href = res.redirect;
        else return alert(res.message || "Action failed");
    }

    const btnCheckIn = document.getElementById("btn-checkin");
    const btnCheckOut = document.getElementById("btn-checkout");
    const btnBreak = document.getElementById("btn-break");
    const totalHoursEl = document.getElementById("total-hours");

    if (action === "clock-in" && res.clock_in) {
        clockInTime = new Date(res.clock_in + " UTC");
        totalBreakSeconds = 0;
        isOnBreak = false;
        breakStartTime = null;
        startLiveTimer();
        btnCheckIn?.classList.add("hidden");
        btnCheckOut?.classList.remove("hidden");
        btnBreak?.classList.remove("hidden");
    }

    if (action === "clock-out" && res.clock_out) {
        clearInterval(timerInterval);
        const total = calculateTotalHours(clockInTime, res.clock_out, totalBreakSeconds);
        clockInTime = null;
        totalBreakSeconds = 0;
        isOnBreak = false;
        breakStartTime = null;
        btnCheckIn?.classList.remove("hidden");
        btnCheckOut?.classList.add("hidden");
        btnBreak?.classList.add("hidden");
        if (totalHoursEl) totalHoursEl.textContent = total;
        updateTodaySession();
        document.getElementById("live-timer").textContent = "00:00:00";
        await fetchAttendanceHistory();
    }

    if (action === "break-start") {
        isOnBreak = true;
        breakStartTime = getCorrectedNow();
        btnBreak.textContent = "End Break";
        btnBreak.dataset.state = "breaking";
    }

    if (action === "break-end") {
        if (breakStartTime) totalBreakSeconds += Math.floor((getCorrectedNow() - breakStartTime) / 1000);
        isOnBreak = false;
        breakStartTime = null;
        btnBreak.textContent = "Break";
        btnBreak.dataset.state = "";
    }
}

async function fetchAttendanceHistory(limit = 2) {
    const res = await safeFetch(attendanceApi, { action: "history" });
    if (!res.success) return;
    const list = document.getElementById("history-list");
    if (!list) return;
    list.innerHTML = "";

    const records = res.history || [];
    records.slice(0, limit).forEach(item => {
        const li = document.createElement("li");
        li.className = "bg-white p-3 rounded-lg shadow flex justify-between items-center";
        const total = calculateTotalHours(item.clock_in, item.clock_out, item.total_break_seconds || 0);
        li.innerHTML = `
            <div>
                <p class="font-semibold">${item.date}</p>
                <p>In: ${item.clock_in}</p>
                <p>Out: ${item.clock_out || "Still working"}</p>
                <p>Breaks: ${Math.floor(item.total_break_seconds / 60)} mins</p>
            </div>
            <div>Total: ${total} hrs</div>
        `;
        list.appendChild(li);
    });
}

async function restoreAttendanceState() {
    const res = await safeFetch(attendanceApi, { action: "history" });
    if (!res.success || !res.history.length) return;
    const last = res.history[0];
    const btnCheckIn = document.getElementById("btn-checkin");
    const btnCheckOut = document.getElementById("btn-checkout");
    const btnBreak = document.getElementById("btn-break");

    if (!last.clock_out) {
        clockInTime = new Date(last.clock_in + " UTC");
        totalBreakSeconds = last.total_break_seconds || 0;
        startLiveTimer();
        btnCheckIn?.classList.add("hidden");
        btnCheckOut?.classList.remove("hidden");
        btnBreak?.classList.remove("hidden");

        const breakRes = await safeFetch(attendanceApi, { action: "check-break" });
        if (breakRes.success && breakRes.onBreak) {
            isOnBreak = true;
            breakStartTime = new Date(breakRes.start_time + " UTC");
            btnBreak.textContent = "End Break";
            btnBreak.dataset.state = "breaking";
        }
    }
}

function updateDateTime() {
    const now = getCorrectedNow();
    document.getElementById("current-date").textContent = now.toLocaleDateString();
    document.getElementById("current-time").textContent = now.toLocaleTimeString();
}

document.addEventListener("DOMContentLoaded", async () => {
    await getServerTime();
    await populateUser();
    setupNavigation();
    updateDateTime();
    setInterval(updateDateTime, 1000);

    await fetchAttendanceHistory();
    await restoreAttendanceState();

    document.getElementById("btn-checkin").addEventListener("click", async () => await sendAction("clock-in"));
    document.getElementById("btn-checkout").addEventListener("click", async () => await sendAction("clock-out"));
    document.getElementById("btn-break").addEventListener("click", async () => {
        const btnBreak = document.getElementById("btn-break");
        await sendAction(btnBreak.dataset.state === "breaking" ? "break-end" : "break-start");
    });
});
