$(function () {
  const u = getUser();
  if (sessionValid() && u) { window.location.href = u.role === 'admin' ? 'admin.html' : 'student.html'; return; }
  if (getToken()) clearAuth();

  const flash = sessionStorage.getItem('flash');
  if (flash) { showAlert($('#msg'), flash, 'err'); sessionStorage.removeItem('flash'); }

  bindPasswordToggle();

  $('#loginForm').on('submit', function (e) {
    e.preventDefault();
    const email = $('#email').val().trim(), password = $('#password').val();
    if (!email || !password) return showAlert($('#msg'), 'Enter your email and password.', 'err');

    const $btn = $('#loginBtn');
    setLoading($btn, true, 'Logging in...');
    apiRequest('POST', '/auth/login', { email, password })
      .done(res => {
        saveAuth(res.token, res.user);
        window.location.href = res.user.role === 'admin' ? 'admin.html' : 'student.html';
      })
      .fail(xhr => { showAlert($('#msg'), errorMessage(xhr), 'err'); setLoading($btn, false); });
  });
});
