const API_BASE = 'http://localhost:3000/api';

const getToken = () => localStorage.getItem('token');
const getUser = () => JSON.parse(localStorage.getItem('user') || 'null');
function saveAuth(token, user) { localStorage.setItem('token', token); localStorage.setItem('user', JSON.stringify(user)); }
function clearAuth() { localStorage.removeItem('token'); localStorage.removeItem('user'); }

// Req 15: logout removes stored auth info
function logout(message) {
  clearAuth();
  if (message) sessionStorage.setItem('flash', message);
  window.location.href = 'index.html';
}

function parseJwt(t) {
  try { return JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))); }
  catch { return null; }
}
function sessionValid() {
  const p = getToken() && parseJwt(getToken());
  return !!(p && p.exp * 1000 > Date.now());
}

// Req 8: every request carries the token
function apiRequest(method, url, data) {
  const token = getToken();
  return $.ajax({
    url: API_BASE + url, method, contentType: 'application/json',
    data: data ? JSON.stringify(data) : undefined,
    headers: token ? { Authorization: 'Bearer ' + token } : {}
  });
}

const errorMessage = xhr => (xhr.responseJSON && xhr.responseJSON.message) || 'Cannot reach the server. Check that it is running.';

// Req 16: expired / invalid / missing token -> back to login; 403 -> stay and warn
function handleProtectedError(xhr) {
  if (xhr.status === 401) return logout(errorMessage(xhr));
  if (xhr.status === 403) return toast('You do not have permission to do that.', 'err');
  toast(errorMessage(xhr), 'err');
}

// Page guard (UX only. Real security is on the backend)
function requireRole(role) {
  const user = getUser();
  if (!sessionValid() || !user) { logout(getToken() ? 'Your session expired. Please log in again.' : ''); return false; }
  if (user.role !== role) {
    window.location.href = user.role === 'admin' ? 'admin.html' : 'student.html';
    return false;
  }
  // auto-logout the moment the token expires
  const ms = parseJwt(getToken()).exp * 1000 - Date.now();
  setTimeout(() => logout('Your session expired. Please log in again.'), Math.min(ms, 2147483647));
  $('#userName').text(user.fullName);
  $('#userAvatar').text(initials(user.fullName));
  $('#logoutBtn').on('click', () => logout());
  return true;
}

function initials(name) {
  return (name || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0].toUpperCase()).join('');
}

function toast(msg, type = 'info') {
  if (!$('#toasts').length) $('body').append('<div id="toasts" role="status" aria-live="polite"></div>');
  const $t = $('<div class="toast">').addClass(type).text(msg).appendTo('#toasts');
  setTimeout(() => $t.fadeOut(250, () => $t.remove()), 3500);
}

function setLoading($btn, on, label) {
  if (on) { $btn.data('label', $btn.text()).prop('disabled', true).text(label || 'Please wait...'); }
  else { $btn.prop('disabled', false).text($btn.data('label')); }
}

function showAlert($el, msg, type) {
  $el.removeClass('ok err').addClass('show ' + type).text(msg);
}

function bindPasswordToggle() {
  $('.pw-toggle').on('click', function () {
    const $i = $(this).siblings('input');
    const show = $i.attr('type') === 'password';
    $i.attr('type', show ? 'text' : 'password');
    $(this).text(show ? 'Hide' : 'Show');
  });
}
