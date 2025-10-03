import { safeFetch } from "./helper/safeFetch.js";

const body = document.body;

const desktopNav = () => `
<nav class="sticky top-0 left-0 right-0 bg-white text-black shadow-md flex items-center justify-between px-6 py-3 z-50">
  <div class="flex items-center gap-4">
    <img id="user-img" alt="User" class="w-10 h-10 bg-gray-300 rounded-full object-cover border-2 border-white shadow-sm" />
    <div class="flex flex-col">
      <button class="nav-btn text-left font-semibold text-black" data-page="profile">
        <span id="user-name">Loading...</span>
      </button>
      <span class="text-sm text-gray-500" id="user-position">Loading...</span>
    </div>
  </div>
  <div class="hidden md:flex items-center gap-6 uppercase tracking-wider font-semibold">
    <button class="nav-btn px-3 py-1 rounded transition-transform duration-200" data-page="home">Home</button>
    <button class="nav-btn px-3 py-1 rounded transition-transform duration-200" data-page="attendance">Attendance</button>
    <button class="nav-btn px-3 py-1 rounded transition-transform duration-200" data-page="analytics">Analytics</button>
    <button class="nav-btn px-3 py-1 rounded transition-transform duration-200" data-page="expenses">Expenses</button>
    <button class="nav-btn px-3 py-1 rounded transition-transform duration-200" data-page="leaves">Leaves</button>
  </div>
  <div class="flex items-center gap-3">
    <button id="menu-btn" class="p-2 rounded hover:scale-105 transition-transform">
      <i class="fa-solid fa-bars text-lg"></i>
    </button>
  </div>
</nav>
`;

const mobileNav = () => `
<nav class="sticky bottom-0 left-0 right-0 bg-white text-black md:hidden shadow-t flex justify-around py-4 px-6 z-50 border-t border-gray-200">
  <button class="nav-btn transition-transform duration-200 flex flex-col items-center" data-page="home"><i class="fa-solid fa-house text-lg"></i></button>
  <button class="nav-btn transition-transform duration-200 flex flex-col items-center" data-page="attendance"><i class="fa-solid fa-clock text-lg"></i></button>
  <button class="nav-btn transition-transform duration-200 flex flex-col items-center" data-page="analytics"><i class="fa-solid fa-clipboard-check text-lg"></i></button>
  <button class="nav-btn transition-transform duration-200 flex flex-col items-center" data-page="expenses"><i class="fa-solid fa-dollar-sign text-lg"></i></button>
  <button class="nav-btn transition-transform duration-200 flex flex-col items-center" data-page="leaves"><i class="fa-solid fa-calendar-days text-lg"></i></button>
</nav>
`;

// commnt for unbuilt comp
// notes, events emptypages
const menuTemplate = (role) => {
  let items = `
    <li><a href="companydashboard.html" class="block px-4 py-3 rounded hover:bg-gray-100">Company Dashboard</a></li>
    <li><a href="department.html" class="block px-4 py-3 rounded hover:bg-gray-100">Department</a></li>
    <li><a href="faq.html" class="block px-4 py-3 rounded hover:bg-gray-100">FAQ</a></li>
    <li><a href="notes.html" class="block px-4 py-3 rounded hover:bg-gray-100">Notes</a></li>
    <li><a href="events.html" class="block px-4 py-3 rounded hover:bg-gray-100">Events</a></li>
  `;
  if (["manager"].includes(role)) items += `<li><a href="manager-tools.html" class="block px-4 py-3 rounded hover:bg-gray-100">Manage Tasks & Targets</a></li>`;
  if (["hr","hr_manager","admin"].includes(role)) items += `<li><a href="hr-tools.html" class="block px-4 py-3 rounded hover:bg-gray-100">HR Tools</a></li>`;
  if (role === "sales") items += `<li><a href="sales.html" class="block px-4 py-3 rounded hover:bg-gray-100">Sales</a></li>`;
  items += `<li id="history-link" class="block px-4 py-3 rounded cursor-pointer flex items-center"><i class="fa-solid fa-message mr-2"></i>History</li>`;

  return `
  <div id="menu-container" class="fixed inset-0 bg-white z-50 transform scale-95 opacity-0 transition-all duration-300 overflow-auto hidden flex flex-col">
    <div class="flex justify-between items-center p-4 border-b">
      <span class="font-semibold text-lg">Menu</span>
      <button id="close-menu" class="p-2 rounded hover:scale-105 transition-transform"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <ul class="flex flex-col p-2 space-y-1">
      ${items}
    </ul>
  </div>
  `;
};

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
}

async function populateUser() {
  try {
    const apiBase = 'http://localhost/HR-project/api';
    const resRaw = await fetch(`${apiBase}/personal-data.php`, {
      method: 'POST',
      body: JSON.stringify({ action: 'get' }),
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    const res = await resRaw.json();
    if (!res.success || !res.data) {
      if (!window.location.pathname.endsWith('auth.html')) window.location.href = 'auth.html';
      return;
    }
    const user = res.data;
    const nameEl = document.getElementById('user-name');
    const positionEl = document.getElementById('user-position');
    const avatarEl = document.getElementById('user-img');
    if (nameEl) nameEl.textContent = user.full_name || 'User';
    if (positionEl) positionEl.textContent = user.position || 'Employee';
    if (avatarEl) {
      avatarEl.src = user.avatar && user.avatar.trim() !== ''
        ? `${apiBase.replace('/api','')}/${user.avatar.replace(/^\/+/, '')}` 
        : 'http://localhost/HR-project/uploads/avatars/default.png';
    }

    body.insertAdjacentHTML("beforeend", menuTemplate(user.role || 'employee'));
    const menuBtn = document.getElementById("menu-btn");
    const container = document.getElementById("menu-container");
    const closeMenu = document.getElementById("close-menu");
    const historyLink = document.getElementById("history-link");

    if (menuBtn && container) {
      menuBtn.addEventListener("click", () => {
        container.classList.remove("hidden");
        setTimeout(() => container.classList.remove("scale-95","opacity-0"), 10);
      });
      closeMenu.addEventListener("click", () => {
        container.classList.add("scale-95","opacity-0");
        setTimeout(() => container.classList.add("hidden"), 200);
      });
      historyLink.addEventListener("click", () => window.location.href="history.html");
    }

  } catch (err) {
    console.error('Error fetching user:', err);
    if (!window.location.pathname.endsWith('auth.html')) window.location.href = 'auth.html';
  }
}

document.addEventListener("DOMContentLoaded", () => {
  body.insertAdjacentHTML("afterbegin", desktopNav());
  body.insertAdjacentHTML("beforeend", mobileNav());
  styleNav();
  getNavs();
  populateUser();
});
