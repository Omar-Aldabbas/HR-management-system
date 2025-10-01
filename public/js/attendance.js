const apiBase = "http://localhost/HR-project/api";
const attendanceApi = `${apiBase}/attendance.php`;
const userApi = `${apiBase}/personal-data.php`;

let user = {};
let clockInTime = null;
let timerInterval = null;
let totalBreakSeconds = 0;
let isOnBreak = false;
let breakStartTime = null;

function getAmmanDate() {
    return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Amman" }));
}

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


async function getUser() {
  const res = await safeFetch(userApi, {action: 'get'});

}

function parseDateTime(dtString) {
    return dtString ? new Date(dtString.replace(" ", "T")) : null;
}

function calculateTotalHours(clockIn, clockOut, breakSeconds = 0) {
    if (!clockIn || !clockOut) return 0;
    const diffMs = clockOut - clockIn - breakSeconds * 1000;
    return Math.max((diffMs / 3600000).toFixed(2), 0);
}

function updateTimerUI() {
    if (!clockInTime) return;
    let now = getAmmanDate();
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

function updateTodaySession(clockOut = null) {
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
    if (clockInEl) clockInEl.textContent = `In: ${clockInTime.toLocaleString("en-US", { timeZone: "Asia/Amman" })}`;
    if (clockOutEl) clockOutEl.textContent = clockOut ? `Out: ${clockOut.toLocaleString("en-US", { timeZone: "Asia/Amman" })}` : "";
}

async function fetchAttendanceHistory(limit = 5) {
    const res = await safeFetch(attendanceApi, { action: "history" });
    if (!res.success) return;

    const list = document.getElementById("history-list");
    if (!list) return;
    list.innerHTML = "";

    const records = res.history || [];
    records.slice(0, limit).forEach(item => {
        const clockIn = parseDateTime(item.clock_in);
        const clockOut = parseDateTime(item.clock_out);
        let breakSeconds = 0;
        item.breaks.forEach(b => {
            if (b.start_time) {
                const start = parseDateTime(b.start_time);
                const end = parseDateTime(b.end_time) || getAmmanDate();
                breakSeconds += (end - start) / 1000;
            }
        });
        const total = calculateTotalHours(clockIn, clockOut || getAmmanDate(), breakSeconds);

        const li = document.createElement("li");
        li.className = "bg-white p-3 rounded-lg shadow flex justify-between items-center";
        li.innerHTML = `
            <div>
                <p class="font-semibold">${item.date}</p>
                <p>In: ${item.clock_in}</p>
                <p>Out: ${item.clock_out || "Still working"}</p>
                <p>Breaks: ${Math.floor(breakSeconds / 60)} mins</p>
            </div>
            <div>Total: ${total} hrs</div>
        `;
        list.appendChild(li);
    });

    const totalHoursEl = document.getElementById("total-hours");
    if (records.length && totalHoursEl) {
        const last = records[0];
        let breakSeconds = 0;
        last.breaks.forEach(b => {
            if (b.start_time) {
                const start = parseDateTime(b.start_time);
                const end = parseDateTime(b.end_time) || getAmmanDate();
                breakSeconds += (end - start) / 1000;
            }
        });
        totalHoursEl.textContent = calculateTotalHours(
            parseDateTime(last.clock_in),
            parseDateTime(last.clock_out) || getAmmanDate(),
            breakSeconds
        );
    }
}

async function sendAction(action) {
    const btnCheckIn = document.getElementById("btn-checkin");
    const btnCheckOut = document.getElementById("btn-checkout");
    const btnBreak = document.getElementById("btn-break");

    let payload = { action };
    if (action === "clock-in") payload.clock_in = getAmmanDate().toISOString().slice(0,19).replace("T"," ");
    if (action === "clock-out") payload.clock_out = getAmmanDate().toISOString().slice(0,19).replace("T"," ");
    if (action === "break-start") payload.start_time = getAmmanDate().toISOString().slice(0,19).replace("T"," ");
    if (action === "break-end") payload.end_time = getAmmanDate().toISOString().slice(0,19).replace("T"," ");

    const res = await safeFetch(attendanceApi, payload);
    if (!res.success) return alert(res.message || "Action failed");

    if (action === "clock-in") {
        clockInTime = parseDateTime(payload.clock_in);
        totalBreakSeconds = 0;
        isOnBreak = false;
        breakStartTime = null;
        startLiveTimer();
        btnCheckIn?.classList.add("hidden");
        btnCheckOut?.classList.remove("hidden");
        btnBreak?.classList.remove("hidden");
        updateTodaySession();
        await fetchAttendanceHistory();
    }

    if (action === "clock-out") {
        clearInterval(timerInterval);
        clockInTime = null;
        totalBreakSeconds = 0;
        isOnBreak = false;
        breakStartTime = null;
        btnCheckIn?.classList.remove("hidden");
        btnCheckOut?.classList.add("hidden");
        btnBreak?.classList.add("hidden");
        updateTodaySession(parseDateTime(payload.clock_out));
        document.getElementById("live-timer").textContent = "00:00:00";
        await fetchAttendanceHistory();
    }

    if (action === "break-start") {
        isOnBreak = true;
        breakStartTime = getAmmanDate();
        btnBreak.textContent = "End Break";
        btnBreak.dataset.state = "breaking";
    }

    if (action === "break-end") {
        if (breakStartTime) totalBreakSeconds += Math.floor((getAmmanDate() - breakStartTime) / 1000);
        isOnBreak = false;
        breakStartTime = null;
        btnBreak.textContent = "Break";
        btnBreak.dataset.state = "";
    }
}

async function restoreAttendanceState() {
    const res = await safeFetch(attendanceApi, { action: "history" });
    if (!res.success || !res.history.length) return;

    const last = res.history[0];
    const btnCheckIn = document.getElementById("btn-checkin");
    const btnCheckOut = document.getElementById("btn-checkout");
    const btnBreak = document.getElementById("btn-break");

    if (!last.clock_out) {
        clockInTime = parseDateTime(last.clock_in);
        totalBreakSeconds = 0;
        last.breaks.forEach(b => {
            if (b.start_time && !b.end_time) {
                isOnBreak = true;
                breakStartTime = parseDateTime(b.start_time);
                btnBreak.textContent = "End Break";
                btnBreak.dataset.state = "breaking";
            } else if (b.start_time && b.end_time) {
                totalBreakSeconds += (parseDateTime(b.end_time) - parseDateTime(b.start_time))/1000;
            }
        });
        startLiveTimer();
        btnCheckIn?.classList.add("hidden");
        btnCheckOut?.classList.remove("hidden");
        btnBreak?.classList.remove("hidden");
        updateTodaySession();
    }
}

function updateDateTime() {
    const now = getAmmanDate();
    document.getElementById("current-date").textContent = now.toLocaleDateString("en-US", { timeZone: "Asia/Amman" });
    document.getElementById("current-time").textContent = now.toLocaleTimeString("en-US", { timeZone: "Asia/Amman" });
}

document.addEventListener("DOMContentLoaded", async () => {
    await getUser();
    setInterval(updateDateTime, 1000);
    await fetchAttendanceHistory();
    await restoreAttendanceState();

    document.getElementById("btn-checkin")?.addEventListener("click", async () => await sendAction("clock-in"));
    document.getElementById("btn-checkout")?.addEventListener("click", async () => await sendAction("clock-out"));
    document.getElementById("btn-break")?.addEventListener("click", async () => {
        const btnBreak = document.getElementById("btn-break");
        await sendAction(btnBreak.dataset.state === "breaking" ? "break-end" : "break-start");
    });
});
