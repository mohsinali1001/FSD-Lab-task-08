$(function () {
  if (!requireRole('admin')) return;

  let courses = [], pendingDelete = null;
  const form = document.getElementById('courseDialog');
  const del = document.getElementById('deleteDialog');

  function loadCourses() {
    apiRequest('GET', '/admin/courses')
      .done(rows => { courses = rows; render(); })
      .fail(handleProtectedError);
  }

  function render() {
    $('#statCourses').text(courses.length);
    $('#statCredits').text(courses.reduce((s, c) => s + c.credit_hours, 0));
    $('#statInstructors').text(new Set(courses.map(c => c.instructor).filter(Boolean)).size);

    const q = $('#search').val().toLowerCase().trim();
    const list = courses.filter(c => [c.course_code, c.title, c.instructor].join(' ').toLowerCase().includes(q));
    const $body = $('#courseBody').empty();

    if (!list.length) {
      return $body.append($('<tr>').append($('<td colspan="5" class="empty">').append(
        $('<h3>').text(courses.length ? 'No courses match your search' : 'No courses yet'),
        $('<p>').text(courses.length ? 'Try a different search.' : 'Select "Add course" to create the first one.'))));
    }
    list.forEach(c => {
      const $actions = $('<td class="actions">').append(
        $('<button class="btn ghost small">').text('Edit').on('click', () => openForm(c)),
        $('<button class="btn danger small">').text('Delete').on('click', () => askDelete(c)));
      $body.append($('<tr>').append(
        $('<td>').append($('<strong>').text(c.course_code)),
        $('<td>').text(c.title),
        $('<td>').append($('<span class="badge">').text(c.credit_hours)),
        $('<td>').text(c.instructor || 'Not assigned'),
        $actions));
    });
  }

  function openForm(c) {
    $('#formMsg').removeClass('show');
    $('#courseId').val(c ? c.id : '');
    $('#course_code').val(c ? c.course_code : '');
    $('#title').val(c ? c.title : '');
    $('#description').val(c ? c.description || '' : '');
    $('#credit_hours').val(c ? c.credit_hours : 3);
    $('#instructor').val(c ? c.instructor || '' : '');
    $('#dialogTitle').text(c ? 'Update course' : 'Add course');
    form.showModal();
  }

  $('#addBtn').on('click', () => openForm(null));
  $('#cancelBtn').on('click', () => form.close());
  $('#search').on('input', render);

  // CREATE / UPDATE
  $('#courseForm').on('submit', function (e) {
    e.preventDefault();
    const id = $('#courseId').val();
    const data = {
      course_code: $('#course_code').val().trim(), title: $('#title').val().trim(),
      description: $('#description').val().trim(), credit_hours: $('#credit_hours').val(),
      instructor: $('#instructor').val().trim()
    };
    if (!data.course_code || !data.title) return showAlert($('#formMsg'), 'Course code and title are required.', 'err');

    const $btn = $('#saveBtn');
    setLoading($btn, true, 'Saving...');
    (id ? apiRequest('PUT', '/admin/courses/' + id, data) : apiRequest('POST', '/admin/courses', data))
      .done(res => { form.close(); toast(res.message, 'ok'); loadCourses(); })
      .fail(xhr => {
        if (xhr.status === 401) return handleProtectedError(xhr);
        showAlert($('#formMsg'), errorMessage(xhr), 'err');
      })
      .always(() => setLoading($btn, false));
  });

  // DELETE with confirmation
  function askDelete(c) {
    pendingDelete = c;
    $('#deleteText').text(c.course_code + ' - ' + c.title + ' will be removed for all students.');
    del.showModal();
  }
  $('#deleteCancel').on('click', () => del.close());
  $('#deleteConfirm').on('click', function () {
    if (!pendingDelete) return;
    const $btn = $(this);
    setLoading($btn, true, 'Deleting...');
    apiRequest('DELETE', '/admin/courses/' + pendingDelete.id)
      .done(res => { toast(res.message, 'ok'); loadCourses(); })
      .fail(handleProtectedError)
      .always(() => { setLoading($btn, false); del.close(); });
  });

  loadCourses();
});
