import { safeFetch } from "./helper/safeFetch.js";

async function populateTasks() {
  const res = await safeFetch("tasks.php", "today-tasks");
  const container = document.getElementById("tasks-list");
  if (!container) return;
  container.innerHTML = "";
  if (!res?.success) {
    container.textContent = res?.message || "Failed to load tasks";
    return;
  }
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
  const res = await safeFetch("meetings.php", "today-meetings");
  const container = document.getElementById("meetings-list");
  if (!container) return;
  container.innerHTML = "";
  if (!res?.success) {
    container.textContent = res?.message || "Failed to load meetings";
    return;
  }
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
      <span class="text-gray-500 text-sm">${meeting.time || meeting.start_time || ""}</span>
    `;
    container.appendChild(div);
  });
}

async function populateWorkSummary() {
  const res = await safeFetch("reports.php", "today-summary");
  const el = document.getElementById("work-summary");
  if (!el) return;
  if (!res?.success) {
    el.textContent = res?.message || "Failed to load summary";
    return;
  }
  el.textContent = `Tasks completed: ${res.tasksCompleted || 0}, Meetings today: ${res.meetingsToday || 0}`;
}

async function populateNotifications() {
  const res = await safeFetch("notifications.php", "get");
  const badge = document.getElementById("notification-badge");
  if (!badge) return;
  if (!res?.success) {
    badge.classList.add("hidden");
    return;
  }
  const hasNotifications = (res.alerts && res.alerts.length > 0) || (res.notifications && res.notifications.length > 0);
  badge.classList.toggle("hidden", !hasNotifications);
}

document.addEventListener("DOMContentLoaded", () => {
  populateTasks();
  populateMeetings();
  populateWorkSummary();
  populateNotifications();
});
