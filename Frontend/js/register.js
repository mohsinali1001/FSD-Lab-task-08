$(function () {
  bindPasswordToggle();

  // Live password strength meter
  $('#password').on('input', function () {
    const p = $(this).val();
    let s = 0;
    if (p.length >= 6) s++;
    if (p.length >= 10) s++;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
    if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) s++;
    const levels = [['0%', '', 'Use letters, numbers and symbols for a stronger password.'],
      ['25%', '#b42318', 'Weak'], ['50%', '#e3a72f', 'Fair'], ['75%', '#1d4fd7', 'Good'], ['100%', '#16794c', 'Strong']];
    const [w, c, t] = levels[p ? Math.max(s, 1) : 0];
    $('#meterBar').css({ width: w, background: c });
    $('#meterText').text(t);
  });

  $('#regForm').on('submit', function (e) {
    e.preventDefault();
    const fullName = $('#fullName').val().trim(), email = $('#email').val().trim();
    const password = $('#password').val(), confirm = $('#confirm').val();
    const $msg = $('#msg');

    // Client checks improve feedback; the backend validates again
    if (!fullName || !email || !password) return showAlert($msg, 'All fields are required.', 'err');
    if (fullName.length < 3) return showAlert($msg, 'Full name must be at least 3 characters.', 'err');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showAlert($msg, 'Enter a valid email address.', 'err');
    if (password.length < 6) return showAlert($msg, 'Password must be at least 6 characters.', 'err');
    if (password !== confirm) return showAlert($msg, 'Passwords do not match.', 'err');

    const $btn = $('#regBtn');
    setLoading($btn, true, 'Creating account...');
    // No role is ever sent. The server always assigns "student".
    apiRequest('POST', '/auth/register', { fullName, email, password })
      .done(res => {
        showAlert($msg, res.message + ' Redirecting...', 'ok');
        setTimeout(() => (window.location.href = 'index.html'), 1400);
      })
      .fail(xhr => { showAlert($msg, errorMessage(xhr), 'err'); setLoading($btn, false); });
  });
});
