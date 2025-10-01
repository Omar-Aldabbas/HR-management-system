//  notes:
// there is an image so i cant do the savefetch


const apiBase = 'http://localhost/HR-project/api';

async function populateUser() {
  try {
    const resRaw = await fetch(`${apiBase}/personal-data.php`, {
      method: 'POST',
      body: JSON.stringify({ action: 'get' }),
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });

    const res = await resRaw.json();

    if (!res.success || !res.data) {
      window.location.href = 'auth.html';
      return;
    }

    const user = res.data;

    const userNameEl   = document.getElementById('user-name');
    const userPosEl    = document.getElementById('user-position');
    const userImgEl    = document.getElementById('user-img');
    const contactName  = document.getElementById('contact-name');
    const contactEmail = document.getElementById('contact-email');
    const contactPhone = document.getElementById('contact-phone');

    const fullName = user.full_name || user.name || 'User';
    const position = user.position || 'Employee';
    const avatarSrc = user.avatar
      ? `${apiBase.replace('/api','')}/${user.avatar.replace(/^\/+/, '')}`
      : '';

    if (userNameEl)   userNameEl.textContent = fullName;
    if (userPosEl)    userPosEl.textContent = position;
    if (userImgEl)    userImgEl.src = avatarSrc || 'default-avatar.png';
    if (contactName)  contactName.textContent = fullName;
    if (contactEmail) contactEmail.textContent = user.email || 'N/A';
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
