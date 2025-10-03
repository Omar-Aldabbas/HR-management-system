import { safeFetch } from "./helper/safeFetch.js";

const usersCache = {};

async function getUser(userId) {
  if (usersCache[userId]) return usersCache[userId];
  const resRaw = await fetch(`http://localhost/HR-project/api/users.php`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "get", user_id: userId }),
  });
  const json = await resRaw.json();
  if (json.success && json.data) {
    const user = json.data.find((u) => u.id == userId);
    if (user) usersCache[userId] = user;
    return user;
  }
  return null;
}

function getAvatarUrl(user) {
  if (!user || !user.avatar) return "http://localhost/HR-project/uploads/avatars/default.png";
  return `http://localhost/HR-project/${user.avatar.replace(/^\/+/, "")}`;
}

async function populateWorkSummary() {
  const tasksRes = await safeFetch("tasks.php", "list");
  const meetingsRes = await safeFetch("meetings.php", "get");
  const el = document.getElementById("work-summary");
  if (!el) return;
  const tasksCompleted = tasksRes.success ? tasksRes.tasks.filter(t => t.status === "finished").length : 0;
  let meetingsToday = 0;
  if (meetingsRes.success && meetingsRes.meetings.length) {
    const today = new Date().toISOString().split("T")[0];
    meetingsToday = meetingsRes.meetings.filter(m => m.start_time?.startsWith(today)).length;
  }
  el.innerHTML = `
    <i class="fa-solid fa-check-circle text-green-500"></i> Tasks completed: ${tasksCompleted} <br>
    <i class="fa-solid fa-calendar-days text-blue-500"></i> Meetings today: ${meetingsToday}
  `;
}

async function populateTasks() {
  const res = await safeFetch("tasks.php", "list");
  const container = document.getElementById("tasks-list");
  if (!container) return;
  container.innerHTML = "";
  if (!res?.success || !res.tasks.length) {
    container.innerHTML = `<i class="fa-solid fa-circle-info text-gray-400"></i> No tasks for today`;
    return;
  }
  let expandedTaskId = null;
  res.tasks.slice(0, 10).forEach((task) => {
    const div = document.createElement("div");
    div.className = `task-card p-3 border rounded-md mb-2 cursor-pointer bg-white shadow-sm hover:shadow-md transition`;
    const priorityIcon =
      task.priority === "high"
        ? "fa-exclamation-circle text-red-500"
        : task.priority === "medium"
        ? "fa-exclamation text-yellow-500"
        : "fa-circle text-gray-400";
    div.innerHTML = `
      <div class="flex justify-between items-center">
        <div>
          <i class="fa-solid ${priorityIcon} mr-2"></i>
          <span class="font-semibold">${task.title}</span>
        </div>
        <i class="fa-solid fa-chevron-down transition transform"></i>
      </div>
      <div class="task-detail mt-2 text-gray-600 hidden">
        <p>${task.description || "No description"}</p>
        <p class="text-sm text-gray-500">Deadline: ${task.deadline || "N/A"}</p>
      </div>
    `;
    div.addEventListener("click", () => {
      const detail = div.querySelector(".task-detail");
      const chevron = div.querySelector(".fa-chevron-down");
      if (expandedTaskId === task.id) {
        detail.classList.add("hidden");
        chevron.classList.remove("rotate-180");
        expandedTaskId = null;
      } else {
        container.querySelectorAll(".task-detail").forEach((d) => d.classList.add("hidden"));
        container.querySelectorAll(".fa-chevron-down").forEach((c) => c.classList.remove("rotate-180"));
        detail.classList.remove("hidden");
        chevron.classList.add("rotate-180");
        expandedTaskId = task.id;
      }
    });
    container.appendChild(div);
  });
}

async function populateMeetings() {
  const res = await safeFetch("meetings.php", "get");
  const container = document.getElementById("meetings-list");
  if (!container) return;
  container.innerHTML = "";
  if (!res?.success || !res.meetings.length) {
    container.innerHTML = `<i class="fa-solid fa-circle-info text-gray-400"></i> No meetings today`;
    return;
  }
  let expandedMeetingId = null;
  res.meetings.slice(0, 10).forEach(async (meeting) => {
    const div = document.createElement("div");
    div.className = `meeting-card p-3 border rounded-md mb-2 cursor-pointer bg-white shadow-sm hover:shadow-md transition`;
    const organizer = await getUser(meeting.organizer_id);
    const organizerName = organizer?.name || "Unknown";
    const organizerPos = organizer?.position || "-";
    const organizerDept = organizer?.department || "-";
    const avatarUrl = getAvatarUrl(organizer);
    const participantsIds = (meeting.participants || "").split(",").filter(Boolean);
    const participantAvatars = await Promise.all(
      participantsIds.map(async (id) => {
        const u = await getUser(id);
        return `<img src="${getAvatarUrl(u)}" title="${u?.name}" class="w-5 h-5 rounded-full border border-white -ml-2 shadow-sm">`;
      })
    );
    const typeIcon = participantsIds.length > 0 ? "fa-globe" : "fa-map-pin";
    const locationText = participantsIds.length > 0 ? "Online" : meeting.location || "N/A";
    div.innerHTML = `
      <div class="flex justify-between items-center">
        <div class="flex items-center space-x-2">
          <img src="${avatarUrl}" alt="${organizerName}" class="w-6 h-6 rounded-full border border-white shadow-sm">
          <div>
            <p class="font-semibold">${meeting.title}</p>
            <p class="text-xs text-gray-500">${organizerName} - ${organizerPos}, ${organizerDept}</p>
            <div class="flex mt-1">${participantAvatars.join("")}</div>
          </div>
        </div>
        <i class="fa-solid fa-chevron-down transition transform"></i>
      </div>
      <div class="meeting-detail mt-2 text-gray-600 hidden">
        <p><i class="fa-solid ${typeIcon} mr-1"></i> ${locationText}</p>
        <p><i class="fa-solid fa-clock mr-1"></i> ${meeting.start_time || ""} - ${meeting.end_time || ""}</p>
      </div>
    `;
    div.addEventListener("click", () => {
      const detail = div.querySelector(".meeting-detail");
      const chevron = div.querySelector(".fa-chevron-down");
      if (expandedMeetingId === meeting.id) {
        detail.classList.add("hidden");
        chevron.classList.remove("rotate-180");
        expandedMeetingId = null;
      } else {
        container.querySelectorAll(".meeting-detail").forEach((d) => d.classList.add("hidden"));
        container.querySelectorAll(".fa-chevron-down").forEach((c) => c.classList.remove("rotate-180"));
        detail.classList.remove("hidden");
        chevron.classList.add("rotate-180");
        expandedMeetingId = meeting.id;
      }
    });
    container.appendChild(div);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  populateWorkSummary();
  populateTasks();
  populateMeetings();
});
