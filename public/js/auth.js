import { safeFetch } from './helper/safeFetch.js';

const apiFile = 'auth.php';
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const forgotForm = document.getElementById('forgot-form');
const messageEl = document.getElementById('message');

const showMessage = (msg, success) => {
  messageEl.textContent = msg || '';
  messageEl.classList.remove('hidden', 'text-red-500', 'text-green-500');
  messageEl.classList.add(success ? 'text-green-500' : 'text-red-500');
};

const showForm = (form) => {
  [loginForm, signupForm, forgotForm].forEach(f => f.classList.add('hidden'));
  form.classList.remove('hidden');
  messageEl.classList.add('hidden');
};

document.getElementById('show-signup').addEventListener('click', e => { e.preventDefault(); showForm(signupForm); });
document.getElementById('show-forgot').addEventListener('click', e => { e.preventDefault(); showForm(forgotForm); });
document.getElementById('back-to-login1').addEventListener('click', e => { e.preventDefault(); showForm(loginForm); });
document.getElementById('back-to-login2').addEventListener('click', e => { e.preventDefault(); showForm(loginForm); });

const checkSession = async () => {
  const res = await safeFetch(apiFile, 'check-session');
  if (res.success && res.loggedIn && res.redirect) {
    window.location.href = res.redirect;
  }
};
checkSession();

loginForm.addEventListener('submit', async e => {
  e.preventDefault();
  const res = await safeFetch(apiFile, 'login', {
    email: loginForm.email.value.trim(),
    password: loginForm.password.value
  });
  showMessage(res.message, res.success);
  if (res.success) window.location.href = res.redirect || 'home.html';
});

signupForm.addEventListener('submit', async e => {
  e.preventDefault();
  const res = await safeFetch(apiFile, 'signup', {
    name: signupForm.name.value.trim(),
    email: signupForm.email.value.trim(),
    password: signupForm.password.value,
    confirm_password: signupForm.confirm_password.value
  });
  showMessage(res.message, res.success);
  if (res.success) window.location.href = res.redirect || 'auth.html';
});

forgotForm.addEventListener('submit', async e => {
  e.preventDefault();
  const res = await safeFetch(apiFile, 'forgot', {
    email: forgotForm.email.value.trim()
  });
  showMessage(res.message, res.success);
  if (res.success) window.location.href = res.redirect || 'auth.html';
});
