import { safeFetch } from "./helper/safeFetch.js";

const attendanceApi = "attendance.php";

let activeSession = null;
let isOnBreak = false;

function fmtDate(d) {
  return d.toLocaleDateString("en-GB", { timeZone: "Asia/Amman" });
}
function fmtTime(d) {
  return d.toLocaleTimeString("en-GB", {
    hour12: true,
    timeZone: "Asia/Amman",
  });
}
function fmtDateTime(d) {
  return d.toLocaleString("en-GB", { hour12: true, timeZone: "Asia/Amman" });
}
// function parseServerTime(str){
//   if(!str) return null;
//   const [datePart,timePart] = str.split(" ");
//   const [y,m,d] = datePart.split("-").map(Number);
//   const [h,min,sec] = timePart.split(":").map(Number);
//   return new Date(y,m-1,d,h,min,sec);
// }

function parseServerTime(str) {
  if (!str) return null;
  const [datePart, timePart] = str.split(' ');
  const [y, m, d] = datePart.split('-').map(Number);
  const [h, min, sec] = timePart.split(':').map(Number);
  // create Date in UTC
  const utcDate = new Date(Date.UTC(y, m - 1, d, h, min, sec));
  // add 1 hour 47 minutes
  return new Date(utcDate.getTime() - (2*3600 + 0*60) * 1000);
}

function getTimeIcon() {
  const hour = Number(
    new Date().toLocaleString("en-GB", {
      hour12: false,
      hour: "numeric",
      timeZone: "Asia/Amman",
    })
  );
  if (hour >= 5 && hour < 12)
    return '<i class="fa-solid fa-sun text-yellow-400"></i>';
  if (hour >= 12 && hour < 17)
    return '<i class="fa-solid fa-sun text-orange-400"></i>';
  if (hour >= 17 && hour < 20)
    return '<i class="fa-solid fa-cloud-sun text-orange-600"></i>';
  return '<i class="fa-solid fa-moon text-gray-600"></i>';
}

function updateClock() {
  const now = new Date();
  document.getElementById("current-date").textContent = fmtDate(now);
  document.getElementById("current-time").textContent = fmtTime(now);
  document.getElementById("total-hours").innerHTML = getTimeIcon();
}

function updateButtons() {
  const btnIn = document.getElementById("btn-checkin");
  const btnOut = document.getElementById("btn-checkout");
  const btnBreak = document.getElementById("btn-break");
  if (!activeSession || activeSession.clock_out) {
    btnIn.classList.remove("hidden");
    btnOut.classList.add("hidden");
    btnBreak.classList.add("hidden");
  } else {
    btnIn.classList.add("hidden");
    btnOut.classList.remove("hidden");
    btnBreak.classList.remove("hidden");
    btnBreak.textContent = isOnBreak ? "End Break" : "Start Break";
  }
}

function updateSessionUI(session) {
  activeSession = session;
  isOnBreak = session?.break_active || false;

  const statusEl = document.getElementById("session-status");
  const clockInEl = document.getElementById("session-clockin");
  const clockOutEl = document.getElementById("session-clockout");
  const breaksEl = document.getElementById("session-breaks");

  if (!session) {
    statusEl.textContent = "No active session";
    clockInEl.textContent = "";
    clockOutEl.textContent = "";
    breaksEl.textContent = "";
  } else {
    statusEl.textContent = session.clock_out
      ? "Finished session"
      : "Active session";
    clockInEl.textContent = `In: ${fmtDateTime(
      parseServerTime(session.clock_in)
    )}`;
    clockOutEl.textContent = session.clock_out
      ? `Out: ${fmtDateTime(parseServerTime(session.clock_out))}`
      : "";
    breaksEl.textContent = `Breaks: ${session.break_minutes || 0} mins`;
  }
  updateButtons();
}

async function fetchApi(action, data = {}) {
  const res = await safeFetch(attendanceApi, action, data);
  return res;
}

async function fetchHistory() {
  const res = await fetchApi("history");
  if (!res.success) return;

  const list = document.getElementById("history-list");
  list.innerHTML = "";

  (res.history || []).forEach((item) => {
    const clockIn = parseServerTime(item.clock_in);
    const clockOut = item.clock_out ? parseServerTime(item.clock_out) : null;
    const workedSec =
      clockIn && clockOut ? (clockOut.getTime() - clockIn.getTime()) / 1000 : 0;
    const h = Math.floor(workedSec / 3600);
    const m = Math.floor((workedSec % 3600) / 60);
    const s = Math.floor(workedSec % 60);

    const li = document.createElement("li");
    li.className =
      "bg-white p-3 rounded-lg shadow flex justify-between items-center";
    li.innerHTML = `
      <div>
        <p class="font-semibold">${item.date}</p>
        <p>In: ${fmtDateTime(clockIn)}</p>
        <p>Out: ${clockOut ? fmtDateTime(clockOut) : ""}</p>
        <p>Breaks: ${item.break_minutes || 0} mins</p>
      </div>
      <div>Total: ${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}</div>
    `;
    list.appendChild(li);
  });

  updateSessionUI(res.active_session || null);
}

async function sendAction(action) {
  const btnIn = document.getElementById("btn-checkin");
  const btnOut = document.getElementById("btn-checkout");
  const btnBreak = document.getElementById("btn-break");
  btnIn.disabled = true;
  btnOut.disabled = true;
  btnBreak.disabled = true;

  const res = await fetchApi(action);
  if (res.success) await fetchHistory();

  btnIn.disabled = false;
  btnOut.disabled = false;
  btnBreak.disabled = false;
}

document.addEventListener("DOMContentLoaded", async () => {
  setInterval(updateClock, 1000);
  await fetchHistory();
  document
    .getElementById("btn-checkin")
    .addEventListener("click", () => sendAction("clock-in"));
  document
    .getElementById("btn-checkout")
    .addEventListener("click", () => sendAction("clock-out"));
  document
    .getElementById("btn-break")
    .addEventListener("click", () =>
      sendAction(isOnBreak ? "break-end" : "break-start")
    );
});
