import { safeFetch } from "./helper/safeFetch.js";

const body = document.body;

const desktopNav = () => `
<nav id="ionix-desktop-nav" class="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-[var(--onyx-border)] z-50">
  <div class="container-onyx flex items-center justify-between px-4 py-3">
    <div class="flex items-center gap-3">
      <img id="user-img" alt="User" class="w-10 h-10 rounded-full object-cover border border-[var(--onyx-border)] shadow-sm" />
      <div class="flex flex-col leading-tight">
        <button class="nav-btn text-left text-[var(--onyx-text-primary)] font-semibold" data-page="profile"><span id="user-name">Loading...</span></button>
        <span id="user-position" class="text-sm text-[var(--onyx-text-secondary)]">Loading...</span>
      </div>
    </div>
    <div class="hidden lg:flex items-center gap-6 uppercase tracking-wide font-medium">
      <button class="nav-btn px-3 py-1 rounded-md" data-page="home">Home</button>
      <button class="nav-btn px-3 py-1 rounded-md" data-page="attendance">Attendance</button>
      <button class="nav-btn px-3 py-1 rounded-md" data-page="analytics">Analytics</button>
      <button class="nav-btn px-3 py-1 rounded-md" data-page="expenses">Expenses</button>
      <button class="nav-btn px-3 py-1 rounded-md" data-page="leaves">Leaves</button>
    </div>
    <button id="menu-btn" class="p-2 rounded-md focus:outline-none hover:text-blue-500 hover:scale-110 transition-all">
      <i class="fa-solid fa-bars-staggered text-2xl"></i>
    </button>
  </div>
</nav>
`;

function injectNavStyles() {
  const s = document.createElement("style");
  s.innerHTML = `
:root{--nav-accent:var(--onyx-accent-1);--nav-accent-2:var(--onyx-accent-2);--nav-text:var(--onyx-text-primary);--nav-muted:var(--onyx-text-secondary);--nav-surface:var(--onyx-bg-surface);--nav-border:var(--onyx-border);--nav-glow:var(--onyx-hover-glow)}
.nav-btn{color:var(--nav-muted);padding:.35rem .6rem;border-radius:.5rem;transition:all .18s ease}
.nav-btn:hover{color:var(--nav-accent);transform:translateY(-2px)}
.nav-btn.nav-active{color:var(--nav-accent);font-weight:600}
#ionix-desktop-nav .nav-btn.nav-active::after{content:'';display:block;height:3px;width:100%;background:linear-gradient(90deg,var(--nav-accent),var(--nav-accent-2));border-radius:4px;margin-top:.4rem}
.menu-backdrop{position:fixed;inset:0;background:rgba(11,12,16,0.45);opacity:0;pointer-events:none;transition:opacity .18s ease;z:60}
.menu-backdrop.open{opacity:1;pointer-events:auto}
.menu-panel{position:fixed;inset:0;background:var(--nav-surface);color:var(--nav-text);transform:translateY(100%);transition:transform .3s cubic-bezier(.25,.9,.25,1),opacity .25s;opacity:0;z-index:70;display:flex;flex-direction:column;border-top:1px solid var(--nav-border)}
.menu-panel.open{transform:translateY(0);opacity:1}
.menu-panel .panel-header{display:flex;align-items:center;justify-between;padding:1rem 1.5rem;border-bottom:1px solid var(--nav-border)}
.menu-panel .panel-title{display:flex;align-items:center;gap:.6rem;font-weight:700;color:var(--nav-accent)}
.menu-panel .menu-list{flex:1;display:flex;flex-direction:column;padding:1rem;gap:.45rem;overflow:auto}
.menu-item{display:flex;align-items:center;gap:.8rem;padding:.8rem;border-radius:.75rem;color:var(--nav-text);transition:background .12s,transform .12s;font-weight:500}
.menu-item i{width:1.3rem;height:1.3rem;flex-shrink:0;color:var(--nav-accent)}
.menu-item:hover{background:var(--nav-glow);transform:translateY(-2px)}
#menu-close{background:none;color:var(--nav-text);border:1px solid var(--nav-border);padding:.5rem .75rem;border-radius:.5rem}
@media(max-width:768px){
  .menu-panel{width:100%;height:100vh;justify-content:flex-start;padding-top:4rem}
  .menu-item{font-size:1.2rem;padding:1rem}
  #menu-close{font-size:1.3rem}
}
@media(min-width:769px){
  .menu-panel{width:50%;right:0;left:auto;border-left:1px solid var(--nav-border);border-top:none;height:100vh;transform:translateX(100%)}
  .menu-panel.open{transform:translateX(0);opacity:1}
  .menu-backdrop{background:rgba(0,0,0,0.35)}
}
`;
  document.head.appendChild(s);
}

function desktopMenuHtml(itemsHtml) {
  return `
    <div class="menu-backdrop" id="menu-backdrop"></div>
    <aside class="menu-panel hidden" id="menu-panel">
      <div class="panel-header">
        <div class="panel-title"><i class="fa-solid fa-compass"></i><span>Navigation</span></div>
        <div class="flex items-center justify-between gap-3 w-full">
          <div class="flex-1"></div>
          <button id="menu-close"><i class="fa-solid fa-xmark text-xl"></i></button>
        </div>
      </div>
      <div class="menu-list">
        ${itemsHtml}
      </div>
    </aside>
  `;
}

function buildItems(role) {
  const base = [
    { href: "companyDashboard.html", icon: "fa-tachometer", label: "Company Dashboard" },
    { href: "department.html", icon: "fa-building", label: "Department" },
    { href: "home.html", icon: "fa-house", label: "Home" },
    { href: "attendance.html", icon: "fa-clock", label: "Attendance" },
    { href: "analytics.html", icon: "fa-chart-line", label: "Analytics" },
    { href: "expenses.html", icon: "fa-wallet", label: "Expenses" },
    { href: "leaves.html", icon: "fa-calendar-days", label: "Leaves" },
    { href: "faq.html", icon: "fa-circle-question", label: "FAQ" },
    { href: "notes.html", icon: "fa-note-sticky", label: "Notes" },
    { href: "events.html", icon: "fa-calendar-check", label: "Events" },
  ];
  if (role === "manager")
    base.push({ href: "manager-tools.html", icon: "fa-user-tie", label: "Manager Tools" });
  if (["hr", "hr_manager", "admin"].includes(role))
    base.push({ href: "hr-tools.html", icon: "fa-users-gear", label: "HR Tools" });
  if (["hr", "hr_manager"].includes(role))
    base.push({ href: "requests.html", icon: "fa-envelope-open-text", label: "Requests" });
  if (role === "sales")
    base.push({ href: "sales.html", icon: "fa-chart-pie", label: "Sales" });
  return base.map(i => `<a href="${i.href}" class="menu-item"><i class="fa-solid ${i.icon}"></i>${i.label}</a>`).join("");
}

function highlightActive() {
  const current = window.location.pathname.split("/").pop().replace(".html", "");
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.remove("nav-active");
    if (btn.dataset.page === current) btn.classList.add("nav-active");
  });
}

function bindNavClicks() {
  document.querySelectorAll(".nav-btn").forEach((el) => {
    el.removeEventListener("click", navClickHandler);
    el.addEventListener("click", navClickHandler);
  });
}

function navClickHandler(e) {
  const b = e.currentTarget;
  const page = b.dataset.page;
  if (!page) return;
  window.location.href = `${page}.html`;
}

async function fetchUserAndWire() {
  try {
    const apiBase = "http://localhost/HR-project/api";
    const resp = await fetch(`${apiBase}/personal-data.php`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "get" }),
    });
    const data = await resp.json();
    if (!data.success || !data.data) {
      if (!window.location.pathname.endsWith("auth.html"))
        window.location.href = "auth.html";
      return;
    }
    const user = data.data;
    const nameEl = document.getElementById("user-name");
    const posEl = document.getElementById("user-position");
    const imgEl = document.getElementById("user-img");
    if (nameEl) nameEl.textContent = user.full_name || "User";
    if (posEl) posEl.textContent = user.position || "Employee";
    if (imgEl)
      imgEl.src =
        user.avatar && user.avatar.trim()
          ? `${apiBase.replace("/api", "")}/${user.avatar.replace(/^\/+/, "")}`
          : "http://localhost/HR-project/uploads/avatars/default.png";
    const items = buildItems(user.role || "employee");
    body.insertAdjacentHTML("beforeend", desktopMenuHtml(items));
    wireMenu();
    highlightActive();
  } catch {
    if (!window.location.pathname.endsWith("auth.html"))
      window.location.href = "auth.html";
  }
}

function wireMenu() {
  const menuBtn = document.getElementById("menu-btn");
  const menuPanel = document.getElementById("menu-panel");
  const menuBackdrop = document.getElementById("menu-backdrop");
  const menuClose = document.getElementById("menu-close");
  menuBtn && menuBtn.addEventListener("click", () => openMenu(menuPanel, menuBackdrop));
  menuClose && menuClose.addEventListener("click", () => closeMenu(menuPanel, menuBackdrop));
  menuBackdrop && menuBackdrop.addEventListener("click", () => closeMenu(menuPanel, menuBackdrop));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu(menuPanel, menuBackdrop);
  });
}

function openMenu(panel, backdrop) {
  panel && panel.classList.add("open");
  backdrop && backdrop.classList.add("open");
  panel && panel.classList.remove("hidden");
  document.documentElement.style.overflow = "hidden";
}

function closeMenu(panel, backdrop) {
  panel && panel.classList.remove("open");
  backdrop && backdrop.classList.remove("open");
  setTimeout(() => {
    panel && panel.classList.add("hidden");
  }, 260);
  document.documentElement.style.overflow = "";
}

document.addEventListener("DOMContentLoaded", () => {
  injectNavStyles();
  body.insertAdjacentHTML("afterbegin", desktopNav());
  highlightActive();
  bindNavClicks();
  fetchUserAndWire();
});
