const apiUrl = 'http://localhost/HR-project/api/auth.php';

const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const forgotForm = document.getElementById('forgot-form');
const messageEl = document.getElementById('message');

function showMessage(msg, success) {
  messageEl.textContent = msg;
  messageEl.classList.remove('hidden', 'text-red-500', 'text-green-500');
  messageEl.classList.add(success ? 'text-green-500' : 'text-red-500');
}

async function postData(data) {
  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  } catch (err) {
    console.error('API fetch error:', err);
    return { success: false, message: 'Server error' };
  }
}

document.getElementById('show-signup').addEventListener('click', e => {
  e.preventDefault();
  loginForm.classList.add('hidden');
  signupForm.classList.remove('hidden');
  messageEl.classList.add('hidden');
});

document.getElementById('show-forgot').addEventListener('click', e => {
  e.preventDefault();
  loginForm.classList.add('hidden');
  forgotForm.classList.remove('hidden');
  messageEl.classList.add('hidden');
});

document.getElementById('back-to-login1').addEventListener('click', e => {
  e.preventDefault();
  signupForm.classList.add('hidden');
  loginForm.classList.remove('hidden');
  messageEl.classList.add('hidden');
});

document.getElementById('back-to-login2').addEventListener('click', e => {
  e.preventDefault();
  forgotForm.classList.add('hidden');
  loginForm.classList.remove('hidden');
  messageEl.classList.add('hidden');
});

(async function checkSession() {
  const res = await postData({ action: 'check-session' });
  if (res.loggedIn) {
    window.location.href = res.redirect || 'index.html';
  }
})();

loginForm.addEventListener('submit', async e => {
  e.preventDefault();
  const res = await postData({
    action: 'login',
    email: loginForm.email.value.trim(),
    password: loginForm.password.value
  });
  showMessage(res.message, res.success);
  if (res.success) {
    window.location.href = res.redirect || 'index.html';
  }
});

signupForm.addEventListener('submit', async e => {
  e.preventDefault();
  const res = await postData({
    action: 'signup',
    name: signupForm.name.value.trim(),
    email: signupForm.email.value.trim(),
    password: signupForm.password.value,
    confirm_password: signupForm.confirm_password.value
  });
  showMessage(res.message, res.success);
  if (res.success) {
    window.location.href = res.redirect || 'auth.html';
  }
});

forgotForm.addEventListener('submit', async e => {
  e.preventDefault();
  const res = await postData({
    action: 'forgot',
    email: forgotForm.email.value.trim()
  });
  showMessage(res.message, res.success);
  if (res.success) {
    window.location.href = res.redirect || 'auth.html';
  }
});
