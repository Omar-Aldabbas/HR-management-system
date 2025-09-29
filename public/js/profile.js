const apiBase = 'http://localhost/HR-project/api';

async function populateUser() {
  try {
    const formData = new URLSearchParams();
    formData.append('action', 'get');

    const resRaw = await fetch(`${apiBase}/personal-data.php`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const res = await resRaw.json();

    if (!res.success) {
      window.location.href = 'auth.html';
      return;
    }

    const user = res.data || {};

    const userNameEl = document.getElementById('user-name');
    const userPosEl = document.getElementById('user-position');
    const userImgEl = document.getElementById('user-img');
    const contactName = document.getElementById('contact-name');
    const contactEmail = document.getElementById('contact-email');
    const contactPhone = document.getElementById('contact-phone');

    if (userNameEl) userNameEl.textContent = user.full_name || user.name || 'User';
    if (userPosEl) userPosEl.textContent = user.position || 'Employee';
    if (userImgEl) userImgEl.src = user.avatar 
      ? `${apiBase.replace('/api','')}/${user.avatar.replace(/^\/+/,'')}` 
      : '';
    if (contactName) contactName.textContent = user.full_name || user.name || '';
    if (contactEmail) contactEmail.textContent = user.email || '';
    if (contactPhone) contactPhone.textContent = user.phone || 'N/A';

  } catch (err) {
    console.error('Error fetching user:', err);
    window.location.href = 'auth.html';
  }
}

function setupLogout() {
  const btn = document.getElementById('logout-btn');
  if (!btn) return;

btn.addEventListener('click', async () => {
  try {
    const resRaw = await fetch(`${apiBase}/auth.php`, {
      method: 'POST',
      body: JSON.stringify({ action: 'logout' }),
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });

    const res = await resRaw.json();
    console.log('Logout response:', res);

    if (res.success) window.location.href = 'auth.html';
  } catch (err) {
    console.error('Logout failed:', err);
  }
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
