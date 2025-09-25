const apiBase = 'http://localhost/HR-project/api';

document.getElementById('change-password-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const current = document.getElementById('current-password').value;
  const newPass = document.getElementById('new-password').value;
  const confirm = document.getElementById('confirm-password').value;
  const msgEl = document.getElementById('message');

  msgEl.textContent = '';

  try {
    const res = await fetch(`${apiBase}/auth.php`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'change-password',
        current_password: current,
        new_password: newPass,
        confirm_password: confirm
      })
    });

    const data = await res.json();

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

  } catch (err) {
    msgEl.textContent = 'Error connecting to server.';
    console.error(err);
  }
});

document.getElementById('back-btn').addEventListener('click', () => {
  window.location.href = 'index.html';
});