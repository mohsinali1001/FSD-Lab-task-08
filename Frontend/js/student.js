$(function () {
  if (!requireRole('student')) return;

  let courses = [];
  const $grid = $('#courseGrid');
  $grid.html('<div class="skeleton"></div>'.repeat(3));

  function render() {
    const q = $('#search').val().toLowerCase().trim();
    const sort = $('#sort').val();
    const list = courses
      .filter(c => [c.course_code, c.title, c.instructor].join(' ').toLowerCase().includes(q))
      .sort((a, b) => sort === 'title' ? a.title.localeCompare(b.title)
        : sort === 'credits' ? b.credit_hours - a.credit_hours
        : a.course_code.localeCompare(b.course_code));

    $grid.empty();
    if (!list.length) {
      return $grid.append($('<div class="empty">').append(
        $('<h3>').text(courses.length ? 'No courses match your search' : 'No courses yet'),
        $('<p>').text(courses.length ? 'Try a different code, title or instructor.' : 'Check back once an administrator adds courses.')));
    }
    list.forEach(c => {   // .text() keeps course data from running as HTML (XSS-safe)
      $grid.append($('<article class="course">').append(
        $('<div class="code">').text(c.course_code),
        $('<h3>').text(c.title),
        $('<p>').text(c.description || 'No description provided.'),
        $('<div class="meta">').append($('<span>').text(c.instructor || 'Instructor to be announced'),
          $('<span class="badge">').text(c.credit_hours + ' credit hrs'))));
    });
  }

  apiRequest('GET', '/student/dashboard')
    .done(res => {
      courses = res.courses;
      $('#welcome').text('Welcome, ' + res.user.full_name.split(' ')[0]);
      $('#email').text(res.user.email);
      $('#statCourses').text(courses.length);
      $('#statCredits').text(courses.reduce((s, c) => s + c.credit_hours, 0));
      $('#statInstructors').text(new Set(courses.map(c => c.instructor).filter(Boolean)).size);
      render();
    })
    .fail(xhr => { $grid.empty(); handleProtectedError(xhr); });

  $('#search').on('input', render);
  $('#sort').on('change', render);
});
