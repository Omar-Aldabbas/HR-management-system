
async function safeFetch(url, data) {
  try {
    const res = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (err) {
    console.error("Fetch error:", err);
    return {};
  }
}

const body = document.body;

const desktopNav = () => {
  return `
    <nav class="sticky top-0 left-0 right-0 bg-white shadow-lg flex items-center justify-between px-4 py-3">
    <div class="flex items-center gap-3">
      <img id="user-img" src="https://via.placeholder.com/40" alt="User" class="w-10 h-10 rounded-full">
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
  </nav>`;
};
const mobileNav = () => {
  return `
  <nav class="sticky bottom-0 left-0 right-0 bg-white md:hidden shadow-inner flex justify-around py-3">
    <button class="nav-btn" data-page="index"><i class="fa-solid fa-house text-lg"></i></button>
    <button class="nav-btn" data-page="attendance"><i class="fa-solid fa-clock text-lg"></i></button>
    <button class="nav-btn" data-page="analytics"><i class="fa-solid fa-clipboard-check text-lg"></i></button>
    <button class="nav-btn" data-page="expenses"><i class="fa-solid fa-dollar-sign text-lg"></i></button>
    <button class="nav-btn" data-page="leaves"><i class="fa-solid fa-calendar-days text-lg"></i></button>
  </nav>`;
};

const styleNav = () => {
  document.querySelectorAll('.nav-btn, .mobile-nav-btn').forEach(btn => {
    btn.classList.add('nav-underline');

    const currentPage = window.location.pathname.split('/').pop().replace('.html','');
    if (btn.dataset.page === currentPage) {
      btn.classList.add('active');
    }
  });
};

const getNavs = () => {
  const NAVS = document.getElementsByClassName("nav-btn");

  Array.from(NAVS).forEach((nav) => {
    const page = nav.dataset.page;
    nav.addEventListener("click", () => {
      window.location.href =`${page}.html`;
    });
  });

  document.getElementById("notifications-btn").addEventListener("click", () => {
    window.location.href = "notifications.html";
  });

  document.getElementById("history-btn").addEventListener("click", () => {
    window.location.href = "history.html";
  });

  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.add("nav-underline");

  const currentPage = window.location.pathname
      .split("/")
      .pop()
      .replace(".html", "");
    if (btn.dataset.page === currentPage) {
      btn.classList.add("active");
    }
  });

  document.addEventListener("DOMContentLoaded", () => {
    styleNav();
  });
};

async function populateUser() {
  try {
    const res = await fetch(`${apiBase}/personal-data.php`, {
      method: 'GET',
      credentials: 'include'
    });
    const data = await res.json();

    if (!data.success) {
      if (data.message === 'Not authenticated') window.location.href = 'auth.html';
      return;
    }

    const user = data.data;
    document.getElementById('user-name').textContent = user.full_name || user.name || 'User';
    document.getElementById('user-position').textContent = user.position || 'Employee';

    const avatarEl = document.getElementById('user-img');
    if (avatarEl) {
      const avatarPath = user.avatar
        ? `http://localhost/HR-project/${user.avatar.replace(/^\/+/, '')}`
        : 'https://via.placeholder.com/40';
      avatarEl.src = avatarPath;
    }
  } catch (err) {
    console.error('User fetch error:', err);
  }
}

body.insertAdjacentHTML("afterbegin", desktopNav());
body.insertAdjacentHTML("beforeend", mobileNav());


getNavs();
populateUser();