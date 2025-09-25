const apiBase = 'http://localhost/HR-project/api';

async function safeFetch(url, data = {}, method = 'POST') {
  try {
    const options = { method, credentials: 'include' };
    if (method === 'POST') {
      options.headers = { 'Content-Type': 'application/json' };
      options.body = JSON.stringify(data);
    } else if (method === 'GET') {
      const params = new URLSearchParams(data).toString();
      url += params ? `?${params}` : '';
    }
    const res = await fetch(url, options);
    return await res.json();
  } catch (err) {
    console.error('Fetch error:', err);
    return { success: false, message: 'Network error' };
  }
}

async function populateUser() {
  const res = await safeFetch(`${apiBase}/personal-data.php`, {}, 'GET');
  if (!res.success) {
    if (res.message === 'Not authenticated') window.location.href = 'auth.html';
    return;
  }
  
  const user = res.data;

  document.getElementById('user-name').textContent = user.full_name || user.name || 'User';
  document.getElementById('user-position').textContent = user.position || 'Employee';
  document.getElementById('user-img').src = user.avatar ? `http://localhost/HR-project/${user.avatar}` : 'https://via.placeholder.com/100';

  const contactName = document.getElementById('contact-name');
  const contactEmail = document.getElementById('contact-email');
  const contactPhone = document.getElementById('contact-phone');

  if (contactName) contactName.textContent = user.full_name || user.name || '';
  if (contactEmail) contactEmail.textContent = user.email || '';
  if (contactPhone) contactPhone.textContent = user.phone || 'N/A';
}

function setupLogout() {
  const btn = document.getElementById('logout-btn');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    const res = await safeFetch(`${apiBase}/auth.php`, { action: 'logout' });
    if (res.success) window.location.href = 'auth.html';
  });
}

function setupNavigation() {
  document.querySelectorAll('.btn-h').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = btn.dataset.page;
      if (page) window.location.href = page;
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  populateUser();
  setupLogout();
  setupNavigation();
});
