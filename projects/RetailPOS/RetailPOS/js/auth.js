function login(event) {
  event.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const users = lsGet(LS_KEYS.USERS, []);
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) {
    document.getElementById('loginMsg').classList.remove('d-none');
    return;
  }
  lsSet(LS_KEYS.SESSION, { userId: user.id, username: user.username, role: user.role, ts: Date.now() });
  window.location.href = 'pos.html';
}

function logout() {
  localStorage.removeItem(LS_KEYS.SESSION);
  window.location.href = 'index.html';
}

function guardRoute() {
  const session = lsGet(LS_KEYS.SESSION, null);
  if (!session) {
    window.location.href = 'index.html';
  }
}
