const apiBase = 'http://localhost/HR-project/api';

async function populateUser() {
  try {
    const formData = new FormData();
    formData.append('action', 'get');

    const resRaw = await fetch(`${apiBase}/personal-data.php`, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });

    const res = await resRaw.json();

    if (!res.success) {
      window.location.href = 'auth.html';
      return;
    }

    const user = res.data;
    if (!user) {
      console.error('User data undefined', res);
      window.location.href = 'auth.html';
      return;
    }

    document.getElementById('full_name').value = user.full_name || '';
    document.getElementById('email').value = user.email || '';
    document.getElementById('phone').value = user.phone || '';
    document.getElementById('address').value = user.address || '';
    document.getElementById('city').value = user.city || '';
    document.getElementById('state').value = user.state || '';
    document.getElementById('country').value = user.country || '';
    document.getElementById('postal_code').value = user.postal_code || '';
    document.getElementById('department').value = user.department || '';
    document.getElementById('position').value = user.position || '';
    document.getElementById('avatar-preview').src = user.avatar
      ? `http://localhost/HR-project/${user.avatar.replace(/^\/+/, '')}`
      : '';

    document.getElementById('department').readOnly = true;
    document.getElementById('position').readOnly = true;

  } catch (err) {
    console.error('Error fetching user:', err);
    window.location.href = 'auth.html';
  }
}

function enableEditing(enable = true) {
  const fields = document.querySelectorAll('#personal-form input');
  fields.forEach(f => {
    if (!['department','position'].includes(f.id)) f.readOnly = !enable;
  });

  document.getElementById('edit-btn').classList.toggle('hidden', enable);
  document.getElementById('cancel-btn').classList.toggle('hidden', !enable);
  document.getElementById('save-btn').classList.toggle('hidden', !enable);
  document.getElementById('change-avatar-btn').classList.toggle('hidden', !enable);
}

function setupFormActions() {
  const editBtn = document.getElementById('edit-btn');
  const cancelBtn = document.getElementById('cancel-btn');
  const avatarInput = document.getElementById('avatar');
  const avatarPreview = document.getElementById('avatar-preview');

  editBtn.addEventListener('click', () => enableEditing(true));
  cancelBtn.addEventListener('click', () => {
    enableEditing(false);
    populateUser();
  });

  avatarInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => avatarPreview.src = ev.target.result;
      reader.readAsDataURL(e.target.files[0]);
    }
  });

  document.getElementById('personal-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('action', 'update');
    ['full_name','email','phone','address','city','state','country','postal_code'].forEach(id => {
      formData.append(id, document.getElementById(id).value);
    });
    if (avatarInput.files[0]) formData.append('avatar', avatarInput.files[0]);

    try {
      const resRaw = await fetch(`${apiBase}/personal-data.php`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      const res = await resRaw.json();

      if (res.success) {
        enableEditing(false);
        populateUser();
        alert('Personal info updated successfully');
      } else {
        alert(res.message || 'Update failed');
      }
    } catch (err) {
      console.error('Update error:', err);
    }
  });
}

// function setupLogout() {
//   const btn = document.getElementById('logout-btn');
//   if (!btn) return;

//   btn.addEventListener('click', async () => {
//     const formData = new FormData();
//     formData.append('action', 'logout');
//     const resRaw = await fetch(`${apiBase}/auth.php`, {
//       method: 'POST',
//       body: formData,
//       credentials: 'include'
//     });
//     const res = await resRaw.json();
//     if (res.success) window.location.href = 'auth.html';
//   });
// }

// function setupLogout() {
//   const btn = document.getElementById('logout-btn');
//   if (!btn) return;

//   btn.addEventListener('click', async () => {
//     const res = await safeFetch(`${apiBase}/auth.php`, { action: 'logout' });
//     if (res.success) window.location.href = 'auth.html';
//   });
// }



document.addEventListener('DOMContentLoaded', () => {
  populateUser();
  setupFormActions();
  // setupLogout();
});
