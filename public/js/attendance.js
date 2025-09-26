const apiBase = "http://localhost/HR-project/api";

async function safeFetch(url, data = {}, method = "POST") {
  try {
    const options = { method, credentials: "include" };
    if (method === "POST") {
      options.headers = { "Content-Type": "application/json" };
      options.body = JSON.stringify(data);
    } else if (method === "GET") {
      const params = new URLSearchParams(data).toString();
      url += params ? `?${params}` : "";
    }
    const res = await fetch(url, options);
    return await res.json();
  } catch {
    return { success: false, message: "Network error" };
  }
}

async function populateUser() {
  const res = await safeFetch(`${apiBase}/personal-data.php`, {}, "GET");
  if (!res.success) {
    if (res.message === "Not authenticated") window.location.href = "auth.html";
    return;
  }
  const user = res.data;
  document.getElementById("user-name").textContent =
    user.full_name || user.name || "User";
  document.getElementById("user-position").textContent =
    user.position || "Employee";
  document.getElementById("user-img").src = user.avatar
    ? `http://localhost/HR-project/${user.avatar}`
    : "https://via.placeholder.com/100";
}

function setupNavigation() {
  document.querySelectorAll(".nav-btn, .mobile-nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const page = btn.dataset.page;
      if (page) window.location.href = page + ".html";
    });
  });
}

// function setupLogout() {
//   const btn = document.getElementById("logout-btn");
//   if (!btn) return;
//   btn.addEventListener("click", async () => {
//     const res = await safeFetch(`${apiBase}/auth.php`, { action: "logout" });
//     if (res.success) window.location.href = "auth.html";
//   });
// }

let clockInTime = null;
let timerInterval = null;
let totalBreakSeconds = 0;
let isOnBreak = false;
let breakStartTime = null;

function updateTimerUI() {
  if (!clockInTime) return;
  const now = new Date();
  let diff = (now.getTime() - clockInTime.getTime()) / 1000;
  let breaks = totalBreakSeconds;
  if (isOnBreak && breakStartTime)
    breaks += (now.getTime() - breakStartTime.getTime()) / 1000;
  diff -= breaks;
  if (diff < 0) diff = 0;

  const hrs = Math.floor(diff / 3600);
  const mins = Math.floor((diff % 3600) / 60);
  const secs = Math.floor(diff % 60);

  const timerEl = document.getElementById("live-timer");
  if (timerEl)
    timerEl.textContent = `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

  const breaksElem = document.getElementById("session-breaks");
  if (breaksElem)
    breaksElem.textContent = `Breaks: ${Math.floor(breaks / 60)} mins`;

  updateTodaySession(diff);
}

function startLiveTimer() {
  if (!clockInTime) return;
  clearInterval(timerInterval);
  updateTimerUI();
  timerInterval = setInterval(updateTimerUI, 1000);
}

function updateTodaySession(diffSeconds) {
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

function calculateTotalHours(clockIn, clockOut, breakSeconds = 0) {
  if (!clockOut) return 0;
  const inTime = new Date(clockIn.replace(" ", "T"));
  const outTime = new Date(clockOut.replace(" ", "T"));
  const totalHrs = (outTime - inTime) / 3600000 - breakSeconds / 3600;
  return totalHrs.toFixed(2);
}

async function sendAction(action) {
  const res = await safeFetch(`${apiBase}/attendance.php`, { action }, "GET");
  if (!res.success) return alert(res.message || "Action failed");

  const btnCheckIn = document.getElementById("btn-checkin");
  const btnCheckOut = document.getElementById("btn-checkout");
  const btnBreak = document.getElementById("btn-break");
  const totalHoursEl = document.getElementById("total-hours");

  if (action === "clock-in" && res.clock_in) {
    clockInTime = new Date(res.clock_in.replace(" ", "T"));
    totalBreakSeconds = 0;
    isOnBreak = false;
    breakStartTime = null;
    startLiveTimer();
    btnCheckIn?.classList.add("hidden");
    btnCheckOut?.classList.remove("hidden");
    btnBreak?.classList.remove("hidden");
  }

  if (action === "clock-out") {
    clearInterval(timerInterval);
    const total = calculateTotalHours(
      clockInTime,
      res.clock_out,
      totalBreakSeconds
    );
    clockInTime = null;
    totalBreakSeconds = 0;
    isOnBreak = false;
    breakStartTime = null;
    btnCheckIn?.classList.remove("hidden");
    btnCheckOut?.classList.add("hidden");
    btnBreak?.classList.add("hidden");
    if (totalHoursEl) totalHoursEl.textContent = total;
    fetchAttendanceHistory();
    updateTodaySession(0);
    document.getElementById("live-timer").textContent = "00:00:00";
  }

  if (action === "break-start") {
    isOnBreak = true;
    breakStartTime = new Date();
    btnBreak.textContent = "End Break";
    btnBreak.dataset.state = "breaking";
  }

  if (action === "break-end") {
    if (breakStartTime)
      totalBreakSeconds += Math.floor((new Date() - breakStartTime) / 1000);
    isOnBreak = false;
    breakStartTime = null;
    btnBreak.textContent = "Break";
    btnBreak.dataset.state = "";
  }
}

async function fetchAttendanceHistory(limit = 2) {
  const res = await safeFetch(
    `${apiBase}/attendance.php?action=history`,
    {},
    "GET"
  );
  if (!res.success) return;

  const container = document.getElementById("history-container");
  const list = document.getElementById("history-list");
  if (!list || !container) return;
  list.innerHTML = "";

  const records = res.history;

  container._allItems = records.map((item) => {
    const li = document.createElement("li");
    li.className =
      "bg-white p-3 rounded-lg shadow flex justify-between items-center";
    const total = calculateTotalHours(
      item.clock_in,
      item.clock_out,
      item.total_break_seconds || 0
    );
    li.innerHTML = `
      <div>
        <p class="font-semibold">${item.date}</p>
        <p>In: ${item.clock_in}</p>
        <p>Out: ${item.clock_out || "Still working"}</p>
        <p>Breaks: ${Math.floor(item.total_break_seconds / 60)} mins</p>
      </div>
      <div>Total: ${total} hrs</div>
    `;
    return li;
  });

  container._allItems.slice(0, limit).forEach((li) => list.appendChild(li));
  container._collapsed = true;

  container.onclick = () => {
    list.innerHTML = "";
    if (container._collapsed) {
      container._allItems.forEach((li) => list.appendChild(li));
    } else {
      container._allItems.slice(0, limit).forEach((li) => list.appendChild(li));
    }
    container._collapsed = !container._collapsed;
  };
}

async function restoreAttendanceState() {
  const res = await safeFetch(
    `${apiBase}/attendance.php`,
    { action: "history" },
    "GET"
  );
  if (!res.success || !res.history.length) return;
  const last = res.history[0];
  const btnCheckIn = document.getElementById("btn-checkin");
  const btnCheckOut = document.getElementById("btn-checkout");
  const btnBreak = document.getElementById("btn-break");

  if (!last.clock_out) {
    clockInTime = new Date(last.clock_in.replace(" ", "T"));
    totalBreakSeconds = last.total_break_seconds || 0;
    startLiveTimer();
    btnCheckIn?.classList.add("hidden");
    btnCheckOut?.classList.remove("hidden");
    btnBreak?.classList.remove("hidden");
    const breakRes = await safeFetch(
      `${apiBase}/attendance.php`,
      { action: "check-break" },
      "GET"
    );
    if (breakRes.success && breakRes.onBreak) {
      isOnBreak = true;
      breakStartTime = new Date(breakRes.start_time.replace(" ", "T"));
      btnBreak.textContent = "End Break";
      btnBreak.dataset.state = "breaking";
    }
  }
}

function updateDateTime() {
  const now = new Date();
  document.getElementById("current-date").textContent =
    now.toLocaleDateString();
  document.getElementById("current-time").textContent =
    now.toLocaleTimeString();
}

document.addEventListener("DOMContentLoaded", () => {
  populateUser();
  setupNavigation();
  // setupLogout();
  updateDateTime();
  setInterval(updateDateTime, 1000);
  fetchAttendanceHistory();
  restoreAttendanceState();
  fetchAttendanceHistory(2);

  document
    .getElementById("btn-checkin")
    .addEventListener("click", () => sendAction("clock-in"));
  document
    .getElementById("btn-checkout")
    .addEventListener("click", () => sendAction("clock-out"));
  document.getElementById("btn-break").addEventListener("click", () => {
    const btnBreak = document.getElementById("btn-break");
    sendAction(
      btnBreak.dataset.state === "breaking" ? "break-end" : "break-start"
    );
  });
});
