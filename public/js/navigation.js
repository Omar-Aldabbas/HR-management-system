import { safeFetch } from "./helper/safeFetch.js";

const body = document.body;

const desktopNav = () => `
<nav class="sticky top-0 left-0 right-0 bg-white text-black shadow-lg flex items-center justify-between px-4 py-3 z-50">
  <div class="flex items-center gap-3">
    <img id="user-img" alt="User" class="w-10 h-10 bg-gray-300 rounded-full object-cover border-2 border-white" />
    <div class="flex flex-col">
      <button class="nav-btn nav-underline text-left" data-page="profile">
        <span class="font-semibold" id="user-name">Loading...</span>
      </button>
      <span class="text-sm text-gray-400" id="user-position">Loading...</span>
    </div>
  </div>
  <div class="hidden md:flex items-center gap-6 uppercase tracking-wider font-semibold">
    <button class="nav-btn nav-underline transition-colors" data-page="home">Home</button>
    <button class="nav-btn nav-underline transition-colors" data-page="attendance">Attendance</button>
    <button class="nav-btn nav-underline transition-colors" data-page="analytics">Analytics</button>
    <button class="nav-btn nav-underline transition-colors" data-page="expenses">Expenses</button>
    <button class="nav-btn nav-underline transition-colors" data-page="leaves">Leaves</button>
  </div>
  <div class="flex items-center gap-4">
    <button id="notifications-btn" class="relative p-2 rounded hover:bg-blue-700 transition-colors">
      <i class="fa-solid fa-bell text-lg"></i>
      <span id="notification-badge" class="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full hidden"></span>
    </button>
    <button id="history-btn" class="p-2 rounded hover:bg-blue-700 transition-colors">
      <i class="fa-solid fa-message text-lg"></i>
    </button>
  </div>
</nav>
`;

const mobileNav = () => `
<nav class="sticky bottom-0 left-0 right-0 bg-blue-600 text-white md:hidden shadow-inner flex justify-around py-3 z-50">
  <button class="nav-btn nav-underline transition-colors" data-page="home"><i class="fa-solid fa-house text-lg"></i></button>
  <button class="nav-btn nav-underline transition-colors" data-page="attendance"><i class="fa-solid fa-clock text-lg"></i></button>
  <button class="nav-btn nav-underline transition-colors" data-page="analytics"><i class="fa-solid fa-clipboard-check text-lg"></i></button>
  <button class="nav-btn nav-underline transition-colors" data-page="expenses"><i class="fa-solid fa-dollar-sign text-lg"></i></button>
  <button class="nav-btn nav-underline transition-colors" data-page="leaves"><i class="fa-solid fa-calendar-days text-lg"></i></button>
</nav>
`;

function styleNav() {
  const currentPage = window.location.pathname.split('/').pop().replace('.html', '');
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.page === currentPage) btn.classList.add('active');
  });
}

function getNavs() {
  document.querySelectorAll('.nav-btn').forEach(nav => {
    nav.addEventListener("click", () => {
      window.location.href = `${nav.dataset.page}.html`;
    });
  });

  const notifBtn = document.getElementById("notifications-btn");
  if (notifBtn) notifBtn.addEventListener("click", () => window.location.href = "notifications.html");

  const historyBtn = document.getElementById("history-btn");
  if (historyBtn) historyBtn.addEventListener("click", () => window.location.href = "history.html");
}

async function populateUser() {
  const res = await safeFetch("personal-data.php", "get"); 
  if (!res || !res.success) {
    if (!window.location.pathname.endsWith('auth.html')) {
      window.location.href = 'auth.html';
    }
    return;
  }

  const user = res.data || {};
  const nameEl = document.getElementById('user-name');
  const positionEl = document.getElementById('user-position');
  const avatarEl = document.getElementById('user-img');

  if (nameEl) nameEl.textContent = user.full_name || 'User';
  if (positionEl) positionEl.textContent = user.position || 'Employee';
  if (avatarEl) {
    avatarEl.src = user.avatar && user.avatar.trim() !== ''
      ? `/${user.avatar.replace(/^\/+/, '')}` 
      : 'default-avatar.png'; 
  }
}

document.addEventListener("DOMContentLoaded", () => {
  body.insertAdjacentHTML("afterbegin", desktopNav());
  body.insertAdjacentHTML("beforeend", mobileNav());
  styleNav();
  getNavs();
  populateUser();
});
