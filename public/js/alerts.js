import { safeFetch } from "./helper/savefetch.js";


const apiBase = 'http://localhost/HR-project/api';

async function fetchAlerts() {
  try {
    const res = await fetch(`${apiBase}/alerts.php`, {
      method: 'GET',
      credentials: 'include'
    });
    const data = await res.json();
    if (!data.success) {
      if (data.message === 'Not authenticated') window.location.href = 'auth.html';
      return;
    }
    renderAlerts(data.alerts || []);
  } catch (err) {
    console.error('Error fetching alerts:', err);
    document.getElementById('alerts-container').innerHTML =
      `<p class="text-red-500">Failed to load alerts.</p>`;
  }
}

function renderAlerts(alerts) {
  const container = document.getElementById('alerts-container');
  container.innerHTML = '';

  if (alerts.length === 0) {
    container.innerHTML = `<p class="text-gray-500">No alerts available.</p>`;
    return;
  }

  alerts.forEach(alert => {
    const div = document.createElement('div');
    let bgClass = 'bg-blue-50 border-blue-400';
    if (alert.type === 'warning') bgClass = 'bg-yellow-50 border-yellow-400';
    if (alert.type === 'critical') bgClass = 'bg-red-50 border-red-400';

    div.className = `p-3 border-l-4 rounded shadow ${bgClass} flex justify-between items-center`;
    div.innerHTML = `
      <span>${alert.message}</span>
      <span class="text-gray-400 text-sm">${new Date(alert.created_at).toLocaleString()}</span>
    `;
    container.appendChild(div);
  });
}

function setupBackToTop() {
  const btn = document.getElementById('back-to-top');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) btn.classList.remove('hidden');
    else btn.classList.add('hidden');
  });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  fetchAlerts();
  setupBackToTop();
});
