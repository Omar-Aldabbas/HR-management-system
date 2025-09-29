import { safeFetch } from "./helper/savefetch.js";

const apiBase = "http://localhost/HR-project/api";

async function populateTasks() {
  const res = await safeFetch(`${apiBase}/tasks.php`, { action: "today-tasks" });
  const container = document.getElementById("tasks-list");
  if (!container) return;

  container.innerHTML = "";
  const tasks = res.tasks || [];
  if (!tasks.length) {
    container.textContent = "No tasks for today";
    return;
  }

  tasks.forEach(task => {
    const div = document.createElement("div");
    div.className = `p-2 border-l-4 rounded flex justify-between items-center ${
      task.priority === "high" ? "border-red-500 bg-red-50" : "border-yellow-500 bg-yellow-50"
    }`;
    div.innerHTML = `
      <span>${task.title}</span>
      <span class="text-gray-500 text-sm">${task.status.replace("_", " ")}</span>
    `;
    container.appendChild(div);
  });
}

async function populateMeetings() {
  const res = await safeFetch(`${apiBase}/meetings.php`, { action: "today-meetings" });
  const container = document.getElementById("meetings-list");
  if (!container) return;

  container.innerHTML = "";
  const meetings = res.meetings || [];
  if (!meetings.length) {
    container.textContent = "No meetings for today";
    return;
  }

  meetings.slice(0, 2).forEach(meeting => {
    const div = document.createElement("div");
    div.className = "p-2 border rounded flex justify-between items-center";
    div.innerHTML = `
      <span>${meeting.title}</span>
      <span class="text-gray-500 text-sm">${meeting.time}</span>
    `;
    container.appendChild(div);
  });
}

async function populateWorkSummary() {
  const res = await safeFetch(`${apiBase}/reports.php`, { action: "today-summary" });
  const el = document.getElementById("work-summary");
  if (!el) return;

  el.textContent = `Tasks completed: ${res.tasksCompleted || 0}, Meetings today: ${res.meetingsToday || 0}`;
}

async function populateNotifications() {
  const res = await safeFetch(`${apiBase}/notifications.php`, { action: "get" });
  const badge = document.getElementById("notification-badge");
  if (!badge) return;

  if (res.notifications && res.notifications.length > 0) badge.classList.remove("hidden");
  else badge.classList.add("hidden");
}

document.addEventListener("DOMContentLoaded", () => {
  populateTasks();
  populateMeetings();
  populateWorkSummary();
  populateNotifications();
});
