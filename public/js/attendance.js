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
  document.getElementById("user-name").textContent = user.full_name || user.name || "User";
  document.getElementById("user-position").textContent = user.position || "Employee";
  document.getElementById("user-img").src =
    user.avatar ? `http://localhost/HR-project/${user.avatar}` : "https://via.placeholder.com/100";
}

function setupNavigation() {
  document.querySelectorAll(".nav-btn, .mobile-nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const page = btn.dataset.page;
      if (page) window.location.href = page + ".html";
    });
  });
}

function setupLogout() {
  const btn = document.getElementById("logout-btn");
  if (!btn) return;
  btn.addEventListener("click", async () => {
    const res = await safeFetch(`${apiBase}/auth.php`, { action: "logout" });
    if (res.success) window.location.href = "auth.html";
  });
}

let clockInTime = null;
let timerInterval = null;
let totalBreakSeconds = 0;
let isOnBreak = false;
let breakStartTime = null;

function startLiveTimer() {
  if (!clockInTime) return;
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    const now = new Date();
    let diff = (now.getTime() - clockInTime.getTime()) / 1000;

    let breaks = totalBreakSeconds;
    if (isOnBreak && breakStartTime) {
      breaks += (now.getTime() - breakStartTime.getTime()) / 1000;
    }
    diff -= breaks;
    if (diff < 0) diff = 0;

    const hrs = Math.floor(diff / 3600);
    const mins = Math.floor((diff % 3600) / 60);
    const secs = Math.floor(diff % 60);

    document.getElementById("live-timer").textContent =
      `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

    updateTodaySession(diff);
  }, 1000);
}

function updateTodaySession(diffSeconds) {
  const sessionStatus = document.getElementById("session-status");
  const clockInElem = document.getElementById("session-clockin");
  const clockOutElem = document.getElementById("session-clockout");
  const breaksElem = document.getElementById("session-breaks");

  if (!clockInTime) {
    sessionStatus.textContent = "No active session";
    clockInElem.textContent = "";
    clockOutElem.textContent = "";
    breaksElem.textContent = "";
    return;
  }

  sessionStatus.textContent = "Active session";
  clockInElem.textContent = `In: ${clockInTime.toLocaleString()}`;
  clockOutElem.textContent = "";

  let totalBreakMinutes = Math.floor(totalBreakSeconds / 60);
  if (isOnBreak && breakStartTime) {
    totalBreakMinutes += Math.floor((new Date() - breakStartTime) / 60000);
  }
  breaksElem.textContent = `Breaks: ${totalBreakMinutes} mins`;
}

function calculateTotalHours(clockIn, clockOut, breakSeconds = 0) {
  if (!clockOut) return 0;
  const inTime = new Date(clockIn.replace(" ", "T"));
  const outTime = new Date(clockOut.replace(" ", "T"));
  const totalHrs = (outTime.getTime() - inTime.getTime()) / 3600000;
  const breaksHrs = breakSeconds / 3600;
  return (totalHrs - breaksHrs).toFixed(2);
}

async function fetchAttendanceHistory() {
  const res = await safeFetch(`${apiBase}/attendance.php`, { action: "history" }, "GET");
  if (!res.success) return;

  const list = document.getElementById("history-list");
  list.innerHTML = "";

  res.history.forEach(item => {
    const total = calculateTotalHours(item.clock_in, item.clock_out, item.break_seconds || 0);
    const li = document.createElement("li");
    li.className = "bg-white p-3 rounded-lg shadow flex justify-between items-center";
    li.innerHTML = `
      <div>
        <p class="font-semibold">${item.date}</p>
        <p>In: ${item.clock_in}</p>
        <p>Out: ${item.clock_out || "Still working"}</p>
        <p>Breaks: ${(item.break_seconds / 60 || 0).toFixed(0)} mins</p>
      </div>
      <div>Total: ${total} hrs</div>
    `;
    list.appendChild(li);
  });
}

async function fetchDepartmentData() {
  const deptRes = await safeFetch(`${apiBase}/attendance.php`, { action: "department" }, "GET");
  if (deptRes.success) populateList("manager-section", "department-list", deptRes.employees);

  const hrRes = await safeFetch(`${apiBase}/attendance.php`, { action: "all" }, "GET");
  if (hrRes.success) populateList("hr-section", "hr-list", hrRes.employees);
}

function populateList(sectionId, listId, employees) {
  document.getElementById(sectionId).classList.remove("hidden");
  const list = document.getElementById(listId);
  list.innerHTML = "";
  employees.forEach(emp => {
    const li = document.createElement("li");
    li.className = "bg-white p-3 rounded-lg shadow flex justify-between";
    li.textContent = `${emp.name} - ${emp.status}`;
    list.appendChild(li);
  });
}

async function sendAction(action) {
  const res = await safeFetch(`${apiBase}/attendance.php`, { action }, "GET");
  if (!res.success) return alert(res.message);

  const btnCheckIn = document.getElementById("btn-checkin");
  const btnCheckOut = document.getElementById("btn-checkout");
  const btnBreak = document.getElementById("btn-break");
  const totalHoursElem = document.getElementById("total-hours");

  if (action === "clock-in" && res.clock_in) {
    clockInTime = new Date(res.clock_in.replace(" ", "T"));
    totalBreakSeconds = 0;
    isOnBreak = false;
    breakStartTime = null;

    startLiveTimer();
    btnCheckIn.classList.add("hidden");
    btnCheckOut.classList.remove("hidden");
    btnBreak.classList.remove("hidden");
  }

  if (action === "clock-out") {
    clearInterval(timerInterval);
    const total = calculateTotalHours(res.clock_in || clockInTime, res.clock_out, totalBreakSeconds);
    clockInTime = null;
    totalBreakSeconds = 0;
    isOnBreak = false;
    breakStartTime = null;

    btnCheckIn.classList.remove("hidden");
    btnCheckOut.classList.add("hidden");
    btnBreak.classList.add("hidden");
    document.getElementById("live-timer").textContent = "00:00:00";
    totalHoursElem.textContent = total;

    fetchAttendanceHistory();
    updateTodaySession(0);
  }

  if (action === "break-start") {
    isOnBreak = true;
    breakStartTime = new Date();
    btnBreak.textContent = "End Break";
    btnBreak.dataset.state = "breaking";
  }

  if (action === "break-end") {
    if (breakStartTime) {
      totalBreakSeconds += Math.floor((new Date() - breakStartTime) / 1000);
    }
    isOnBreak = false;
    breakStartTime = null;
    btnBreak.textContent = "Break";
    btnBreak.dataset.state = "";
  }
}

async function restoreAttendanceState() {
  const res = await safeFetch(`${apiBase}/attendance.php`, { action: "history" }, "GET");
  if (!res.success || !res.history.length) return;

  const last = res.history[0];
  const btnCheckIn = document.getElementById("btn-checkin");
  const btnCheckOut = document.getElementById("btn-checkout");
  const btnBreak = document.getElementById("btn-break");

  if (!last.clock_out) {
    clockInTime = new Date(last.clock_in.replace(" ", "T"));
    totalBreakSeconds = last.break_seconds || 0;
    isOnBreak = false;
    breakStartTime = null;

    startLiveTimer();

    btnCheckIn.classList.add("hidden");
    btnCheckOut.classList.remove("hidden");
    btnBreak.classList.remove("hidden");

    const breakRes = await safeFetch(`${apiBase}/attendance.php`, { action: "check-break" }, "GET");
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
  document.getElementById("current-date").textContent = now.toLocaleDateString();
  document.getElementById("current-time").textContent = now.toLocaleTimeString();
}

document.addEventListener("DOMContentLoaded", () => {
  populateUser();
  setupNavigation();
  setupLogout();
  updateDateTime();
  setInterval(updateDateTime, 1000);

  fetchAttendanceHistory();
  fetchDepartmentData();
  restoreAttendanceState();

  document.getElementById("btn-checkin").addEventListener("click", () => sendAction("clock-in"));
  document.getElementById("btn-checkout").addEventListener("click", () => sendAction("clock-out"));
  document.getElementById("btn-break").addEventListener("click", () => {
    const btnBreak = document.getElementById("btn-break");
    sendAction(btnBreak.dataset.state === "breaking" ? "break-end" : "break-start");
  });
});
