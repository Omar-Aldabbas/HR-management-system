const apiBase = 'http://localhost/HR-project/api';

async function safeFetch(url, data) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  } catch (err) {
    console.error('Fetch error:', err);
    return {};
  }
}


const styleNav = () => {
  document.querySelectorAll('.nav-btn, .mobile-nav-btn').forEach(btn => {
    btn.classList.add('nav-underline');

    const currentPage = window.location.pathname.split('/').pop().replace('.html','');
    if (btn.dataset.page === currentPage) {
      btn.classList.add('active');
    }
  });
};

document.addEventListener('DOMContentLoaded', () => {
  styleNav();
});


function setupNav() {
  try {
    document.querySelectorAll('.nav-btn, .mobile-nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const page = btn.dataset.page;
        window.location.href = `${page}.html`;
      });
    });

    document.getElementById('notifications-btn').addEventListener('click', () => {
      window.location.href = 'notifications.html';
    });

    document.getElementById('history-btn').addEventListener('click', () => {
      window.location.href = 'history.html';
    });
  } catch (err) {
    console.error('Navigation setup error:', err);
  }
}

async function populateUser() {
  try {
    const res = await fetch(`${apiBase}/personal-data.php`, {
      method: 'GET',
      credentials: 'include'
    });
    const data = await res.json();

    if (!data.success) {
      if (data.message === 'Not authenticated') window.location.href = 'auth.html';
      return;
    }

    const user = data.data;
    document.getElementById('user-name').textContent = user.full_name || user.name || 'User';
    document.getElementById('user-position').textContent = user.position || 'Employee';

    const avatarEl = document.getElementById('user-img');
    if (avatarEl) {
      const avatarPath = user.avatar
        ? `http://localhost/HR-project/${user.avatar.replace(/^\/+/, '')}`
        : 'https://via.placeholder.com/40';
      avatarEl.src = avatarPath;
    }
  } catch (err) {
    console.error('User fetch error:', err);
  }
}



async function populateTasks() {
  let data = {};
  try {
    data = await safeFetch(`${apiBase}/tasks.php`, { action: 'today-tasks' });
    const container = document.getElementById('tasks-list');
    container.innerHTML = '';
    if (!data.tasks || data.tasks.length === 0) return container.textContent = 'No tasks for today';
    data.tasks.forEach(task => {
      const div = document.createElement('div');
      div.className = `p-2 border-l-4 rounded flex justify-between items-center ${
        task.priority === 'high' ? 'border-red-500 bg-red-50' : 'border-yellow-500 bg-yellow-50'
      }`;
      div.innerHTML = `<span>${task.title}</span><span class="text-gray-500 text-sm">${task.status.replace('_',' ')}</span>`;
      container.appendChild(div);
    });
  } catch (err) {
    console.error('Tasks fetch error:', err);
  } finally {
  }
}

async function populateMeetings() {
  let data = {};
  try {
    data = await safeFetch(`${apiBase}/meetings.php`, { action: 'today-meetings' });
    const container = document.getElementById('meetings-list');
    container.innerHTML = '';
    if (!data.meetings || data.meetings.length === 0) return container.textContent = 'No meetings for today';
    data.meetings.slice(0,2).forEach(meeting => {
      const div = document.createElement('div');
      div.className = 'p-2 border rounded flex justify-between items-center';
      div.innerHTML = `<span>${meeting.title}</span><span class="text-gray-500 text-sm">${meeting.time}</span>`;
      container.appendChild(div);
    });
  } catch (err) {
    console.error('Meetings fetch error:', err);
  } finally {
  }
}

async function populateWorkSummary() {
  let data = {};
  try {
    data = await safeFetch(`${apiBase}/reports.php`, { action: 'today-summary' });
    document.getElementById('work-summary').textContent = `Tasks completed: ${data.tasksCompleted}, Meetings today: ${data.meetingsToday}`;
  } catch (err) {
    console.error('Summary fetch error:', err);
  } finally {
  }
}

async function populateNotifications() {
  let data = {};
  try {
    data = await safeFetch(`${apiBase}/notifications.php`, { action: 'get' });
    const badge = document.getElementById('notification-badge');
    if (data.notifications && data.notifications.length > 0) badge.classList.remove('hidden');
    else badge.classList.add('hidden');
  } catch (err) {
    console.error('Notifications fetch error:', err);
  } finally {
  }
}




document.addEventListener('DOMContentLoaded', () => {
  setupNav();
  populateUser();
  populateTasks();
  populateMeetings();
  populateWorkSummary();
  populateNotifications();
});
