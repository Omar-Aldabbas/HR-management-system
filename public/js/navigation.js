const apiBase = "http://localhost/HR-project/api";
const body = document.body;

const desktopNav = () => `
<nav class="sticky top-0 left-0 right-0 bg-white shadow-lg flex items-center justify-between px-4 py-3">
  <div class="flex items-center gap-3">
    <img id="user-img" alt="User" class="w-10 h-10 bg-gray-600 rounded-full" />
    <div class="flex flex-col">
      <button class="nav-btn" data-page="profile"><span class="font-semibold" id="user-name">Loading...</span></button>
      <span class="text-sm text-gray-500" id="user-position">Loading...</span>
    </div>
  </div>
  <div class="hidden md:flex items-center gap-6">
    <button class="nav-btn" data-page="index">Home</button>
    <button class="nav-btn" data-page="attendance">Attendance</button>
    <button class="nav-btn" data-page="analytics">Analytics</button>
    <button class="nav-btn" data-page="expenses">Expenses</button>
    <button class="nav-btn" data-page="leaves">Leaves</button>
  </div>
  <div class="flex items-center gap-4">
    <button id="notifications-btn" class="relative">
      <i class="fa-solid fa-bell text-lg"></i>
      <span id="notification-badge" class="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full hidden"></span>
    </button>
    <button id="history-btn">
      <i class="fa-solid fa-message text-lg"></i>
    </button>
  </div>
</nav>
`;

const mobileNav = () => `
<nav class="sticky bottom-0 left-0 right-0 bg-white md:hidden shadow-inner flex justify-around py-4 shadow-md">
  <button class="nav-btn" data-page="index"><i class="fa-solid fa-house text-lg"></i></button>
  <button class="nav-btn" data-page="attendance"><i class="fa-solid fa-clock text-lg"></i></button>
  <button class="nav-btn" data-page="analytics"><i class="fa-solid fa-clipboard-check text-lg"></i></button>
  <button class="nav-btn" data-page="expenses"><i class="fa-solid fa-dollar-sign text-lg"></i></button>
  <button class="nav-btn" data-page="leaves"><i class="fa-solid fa-calendar-days text-lg"></i></button>
</nav>
`;

const styleNav = () => {
  const currentPage = window.location.pathname.split('/').pop().replace('.html','');
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.add('nav-underline');
    if (btn.dataset.page === currentPage) btn.classList.add('active');
  });
};

const getNavs = () => {
  document.querySelectorAll('.nav-btn').forEach(nav => {
    const page = nav.dataset.page;
    nav.addEventListener("click", () => window.location.href = `${page}.html`);
  });

  const notifBtn = document.getElementById("notifications-btn");
  if (notifBtn) notifBtn.addEventListener("click", () => window.location.href = "notifications.html");

  const historyBtn = document.getElementById("history-btn");
  if (historyBtn) historyBtn.addEventListener("click", () => window.location.href = "history.html");

  document.addEventListener("DOMContentLoaded", styleNav);
};

async function populateUser() {
  try {
    const resRaw = await fetch(`${apiBase}/personal-data.php`, {
      method: 'POST',
      body: new URLSearchParams({ action: 'get' }),
      credentials: 'include'
    });
    const res = await resRaw.json();

    if (!res.success) {
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
    if (avatarEl) avatarEl.src = user.avatar && user.avatar.trim() !== ''
      ? `${apiBase.replace('/api','')}/${user.avatar.replace(/^\/+/,'')}`
      : '';

  } catch (err) {
    console.error('User fetch error:', err);
    if (!window.location.pathname.endsWith('auth.html')) {
      window.location.href = 'auth.html';
    }
  }
}

body.insertAdjacentHTML("afterbegin", desktopNav());
body.insertAdjacentHTML("beforeend", mobileNav());

getNavs();
populateUser();
