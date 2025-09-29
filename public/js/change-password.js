import { safeFetch } from "./helper/savefetch.js";

const apiBase = 'http://localhost/HR-project/api';

document.getElementById('change-password-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const current = document.getElementById('current-password').value;
  const newPass = document.getElementById('new-password').value;
  const confirm = document.getElementById('confirm-password').value;
  const msgEl = document.getElementById('message');

  msgEl.textContent = '';

  const data = await safeFetch(`${apiBase}/auth.php`, {
    action: 'change-password',
    current_password: current,
    new_password: newPass,
    confirm_password: confirm
  });

  if (!data) {
    msgEl.textContent = 'Error connecting to server.';
    msgEl.classList.remove('text-green-500');
    msgEl.classList.add('text-red-500');
    return;
  }

  if (data.success) {
    msgEl.classList.remove('text-red-500');
    msgEl.classList.add('text-green-500');
    msgEl.textContent = data.message;
    setTimeout(() => window.location.href = 'index.html', 1500);
  } else {
    msgEl.classList.remove('text-green-500');
    msgEl.classList.add('text-red-500');
    msgEl.textContent = data.message;
  }
});

document.getElementById('back-btn').addEventListener('click', () => {
  window.location.href = 'index.html';
});
