const apiBase = 'http://localhost/HR-project/api/personal-data.php';
let originalData = {};

async function safeFetch(url, data = {}, method = 'GET', isFormData = false) {
  try {
    const options = { method, credentials: 'include' };
    if (method === 'POST') {
      if (isFormData) {
        options.body = data;
      } else {
        options.headers = { 'Content-Type': 'application/json' };
        options.body = JSON.stringify(data);
      }
    } else if (method === 'GET' && Object.keys(data).length) {
      url += '?' + new URLSearchParams(data).toString();
    }
    const res = await fetch(url, options);
    return await res.json();
  } catch (err) {
    console.error('Fetch error:', err);
    return { success: false, message: 'Network error' };
  }
}

function populateFormFields(data) {
  const fields = ['full_name','email','phone','address','city','state','country','postal_code','department','position'];
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = data[id] || '';
  });
  const avatar = document.getElementById('avatar-preview');
  if (data.avatar && avatar) avatar.src = 'http://localhost/HR-project/' + data.avatar;

  const userName = document.getElementById('user-name');
  const userPosition = document.getElementById('user-position');
  if (userName) userName.textContent = data.full_name || 'User';
  if (userPosition) userPosition.textContent = data.position || '';
}

function setFieldsEditable(editable) {
  document.querySelectorAll('#personal-form input').forEach(input => {
    if (!input.id.match(/department|position/)) {
      input.readOnly = !editable;
      input.classList.toggle('bg-gray-100', !editable);
    }
  });
  document.getElementById('avatar')?.toggleAttribute('disabled', !editable);
  document.getElementById('edit-btn')?.classList.toggle('hidden', editable);
  document.getElementById('cancel-btn')?.classList.toggle('hidden', !editable);
  document.getElementById('save-btn')?.classList.toggle('hidden', !editable);
}

async function fetchUserData() {
  const res = await safeFetch(apiBase, { action: 'fetch' }, 'GET');
  if (res.success) {
    originalData = res.data;
    populateFormFields(res.data);
    setFieldsEditable(false);
  } else {
    alert(res.message || 'Failed to load user data');
    if (res.message === 'Not authenticated') window.location.href = 'auth.html';
  }
}

function cancelEdit() {
  populateFormFields(originalData);
  setFieldsEditable(false);
}

async function submitChanges(e) {
  e.preventDefault();
  const form = document.getElementById('personal-form');
  const formData = new FormData(form);
  formData.append('action', 'update');

  if (!formData.get('full_name') || !formData.get('email')) return alert('Full name and email are required');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.get('email'))) return alert('Invalid email');

  const res = await safeFetch(apiBase, formData, 'POST', true);
  if (res.success) {
    alert(res.message || 'Updated successfully!');
    originalData = res.data;
    populateFormFields(res.data);
    setFieldsEditable(false);
  } else {
    alert(res.message || 'Failed to update');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  fetchUserData();
  const avatarInput = document.getElementById('avatar');
  const avatarPreview = document.getElementById('avatar-preview');
  if (avatarInput && avatarPreview) {
    avatarInput.addEventListener('change', () => {
      const file = avatarInput.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = e => avatarPreview.src = e.target.result;
        reader.readAsDataURL(file);
      }
    });
  }
  document.getElementById('edit-btn')?.addEventListener('click', () => setFieldsEditable(true));
  document.getElementById('cancel-btn')?.addEventListener('click', cancelEdit);
  document.getElementById('personal-form')?.addEventListener('submit', submitChanges);
});
