import { safeFetch } from "./helper/safeFetch.js";

const form = document.getElementById('change-password-form');
const msgEl = document.getElementById('message');
const backBtn = document.getElementById('back-btn');

const showMessage = (text, success = false) => {
  msgEl.textContent = text;
  msgEl.classList.remove('text-red-500', 'text-green-500');
  msgEl.classList.add(success ? 'text-green-500' : 'text-red-500');
};

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  msgEl.textContent = '';

  const current = document.getElementById('current-password').value.trim();
  const newPass = document.getElementById('new-password').value.trim();
  const confirm = document.getElementById('confirm-password').value.trim();

  if (!current || !newPass || !confirm) {
    showMessage('Please fill in all fields.');
    return;
  }
  if (newPass !== confirm) {
    showMessage('New passwords do not match.');
    return;
  }

  try {
    const res = await safeFetch('auth.php', 'change-password', {
      current_password: current,
      new_password: newPass,
      confirm_password: confirm
    });

    console.log('Server response:', res);

    if (!res) {
      showMessage('Error connecting to server.');
      return;
    }

    showMessage(res.message || 'Unexpected error', res.success);

    if (res.success) {
      form.reset();
      setTimeout(() => window.location.href = 'home.html', 1500);
    }

  } catch (err) {
    console.error('Unexpected error:', err);
    showMessage('An unexpected error occurred.');
  }
});

backBtn.addEventListener('click', () => {
  window.location.href = 'home.html';
});
