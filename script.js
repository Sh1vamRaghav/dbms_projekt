document.addEventListener("DOMContentLoaded", () => {
  // ======== Utility Functions ========

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const toggleVisibility = (hideEl, showEl) => {
    hideEl?.classList.add("hidden");
    showEl?.classList.remove("hidden");
  };

  const fetchJSON = async (url) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Fetch failed: ${url}`);
    return res.json();
  };

  const showAlert = (ok, msg) =>
    alert(`${ok ? "✅" : "⚠️"} ${msg}`);

  // ======== Navigation ========

  function initNavigation() {
    const navBtns = $$(".nav-btn");
    const sections = $$(".section");

    navBtns.forEach((btn) =>
      btn.addEventListener("click", () => {
        navBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        sections.forEach((s) => s.classList.remove("visible"));
        $(`#${btn.dataset.section}`)?.classList.add("visible");
      })
    );
  }

  // ======== Student Section ========

  function initStudentSection() {
    const menu = $("#students-menu");
    const form = $("#student-timetable-form");
    const container = $("#student-timetable-container");

    $("#open-student-timetable").onclick = () => toggleVisibility(menu, form);
    $("#back-student-menu").onclick = () => toggleVisibility(form, menu);
    $("#back-student-form").onclick = () => toggleVisibility(container, form);

    $("#submit-student-timetable").onclick = async () => {
      try {
        const batch = $("#student-batch").value;
        const year = $("#student-year").value;
        const day = $("#student-day").value;

        const data = await fetchJSON(`/v1/timetable?batch=${batch}&year=${year}&day=${day}`);
        const tbody = $("#student-timetable-table tbody");
        tbody.innerHTML = data.map(
          (r) => `
            <tr>
              <td>${r.course_id}</td>
              <td>${r.division_label}</td>
              <td>${r.day_name}</td>
              <td>${r.room_id}</td>
              <td>${r.start_time}</td>
              <td>${r.end_time}</td>
            </tr>`
        ).join("");

        toggleVisibility(form, container);
      } catch (err) {
        showAlert(false, err.message);
      }
    };
  }

  // ======== Faculty Section ========

  async function loadFacultyDropdowns() {
    const [faculties, courses, rooms, slots] = await Promise.all([
      fetchJSON("/v1/faculty"),
      fetchJSON("/v1/courses"),
      fetchJSON("/v1/rooms"),
      fetchJSON("/v1/timeSlots")
    ]);

    const fillSelect = (el, items, labelFn) => {
      el.innerHTML = `<option value="">Select</option>`;
      items.forEach((i) => {
        const opt = document.createElement("option");
        opt.value = i.faculty_id || i.course_id || i.room_id || i.time_slot_id;
        opt.textContent = labelFn(i);
        el.appendChild(opt);
      });
    };

    fillSelect($("#faculty-select"), faculties, (f) => f.faculty_name);
    fillSelect($("#cid"), courses, (c) => c.course_name);
    fillSelect($("#rid"), rooms, (r) => r.room_id);
    fillSelect($("#tid"), slots, (t) => `${t.start_time} - ${t.end_time}`);
  }

  function initFacultySection() {
    const menu = $("#faculty-menu");
    const form = $("#faculty-timetable-form-container");
    const container = $("#faculty-timetable-container");
    const extraForm = $("#extra-class-form");

    $("#open-faculty-timetable").onclick = () => toggleVisibility(menu, form);
    $("#back-faculty-menu").onclick = () => toggleVisibility(form, menu);
    $("#open-extra-class").onclick = () => toggleVisibility(menu, extraForm);
    $("#back-extra").onclick = () => toggleVisibility(extraForm, menu);
    $("#back-faculty-form").onclick = () => toggleVisibility(container, form);

    // Timetable form
    $("#faculty-timetable-form").onsubmit = async (e) => {
      e.preventDefault();
      try {
        const fid = $("#faculty-select").value;
        const batch = $("#faculty-batch").value;
        const year = $("#faculty-year").value;
        const day = $("#faculty-day").value;

        const data = await fetchJSON(`/v1/faculty/timetable?fid=${fid}&batch=${batch}&year=${year}&day=${day}`);
        const tbody = $("#faculty-timetable-table tbody");
        tbody.innerHTML = data.map(
          (r) => `
            <tr>
              <td>${r.course_name}</td>
              <td>${r.division_label}</td>
              <td>${r.day_name}</td>
              <td>${r.batch_name}</td>
              <td>${r.start_time}</td>
              <td>${r.end_time}</td>
            </tr>`
        ).join("");
        toggleVisibility(form, container);
      } catch (err) {
        showAlert(false, err.message);
      }
    };

    // Extra class form
    $("#extra-class").onsubmit = async (e) => {
      e.preventDefault();
      const params = new URLSearchParams(new FormData(e.target));
      try {
        const res = await fetch(`/v1/faculty/extraClass?${params}`);
        const body = await res.json();
        showAlert(res.ok, body.message || body.error || "Extra class update");
      } catch (err) {
        showAlert(false, "Network error");
      }
    };

    loadFacultyDropdowns();
  }

  // ======== Admin Section ========

  async function initAdminSection() {
    const menu = $("#admin-menu");
    const createForm = $("#create-class-form");
    const deleteForm = $("#delete-class-form");

    $("#open-create-class").onclick = () => toggleVisibility(menu, createForm);
    $("#open-delete-class").onclick = () => toggleVisibility(menu, deleteForm);
    $("#back-admin-menu-create").onclick = () => toggleVisibility(createForm, menu);
    $("#back-admin-menu-delete").onclick = () => toggleVisibility(deleteForm, menu);

    // Fetch dropdowns
    const [faculties, courses, rooms, slots] = await Promise.all([
      fetchJSON("/v1/faculty"),
      fetchJSON("/v1/courses"),
      fetchJSON("/v1/rooms"),
      fetchJSON("/v1/timeSlots")
    ]);

    const populate = (sel, arr, textFn) => {
      sel.innerHTML = `<option value="">Select</option>`;
      arr.forEach((x) => {
        const opt = document.createElement("option");
        opt.value = x.faculty_id || x.course_id || x.room_id || x.time_slot_id;
        opt.textContent = textFn(x);
        sel.appendChild(opt);
      });
    };

    populate($("#faculty_id"), faculties, (f) => f.faculty_name);
    populate($("#del_faculty"), faculties, (f) => f.faculty_name);
    populate($("#course_id"), courses, (c) => c.course_name);
    populate($("#del_course"), courses, (c) => c.course_name);
    populate($("#room_id"), rooms, (r) => r.room_id);
    populate($("#del_room"), rooms, (r) => r.room_id);
    populate($("#time_slot"), slots, (s) => `${s.start_time} - ${s.end_time}`);
    populate($("#del_time"), slots, (s) => `${s.start_time} - ${s.end_time}`);

    // CRUD actions
    const handleAdminAction = (formId, endpoint, successMsg) => {
      $(formId).onsubmit = async (e) => {
        e.preventDefault();
        const params = new URLSearchParams(new FormData(e.target));
        try {
          const res = await fetch(`/v1/admin/${endpoint}?${params}`);
          const body = await res.json();
          showAlert(res.ok, body.message || body.error || successMsg);
        } catch (err) {
          showAlert(false, "Network error");
        }
      };
    };

    handleAdminAction("#create-class", "createEntry", "Class created!");
    handleAdminAction("#delete-class", "deleteEntry", "Class deleted!");
  }

  // ======== Vacant Room Finder ========

  function initVacantRoomFinder() {
    const $ = (sel) => document.querySelector(sel);
    const form = $("#vacant-room-form");
    const results = $("#vacant-room-results");
    const tableBody = $("#vacant-room-table tbody"); // ✅ define this properly
    const menu = $("#students-menu");

    const getVal = (id) => $(id).value;
    const toggle = (hide, show) => {
      hide.classList.add("hidden");
      show.classList.remove("hidden");
    };

    async function loadSlots() {
      const slots = await fetchJSON("/v1/timeSlots");
      ["#vacant-start", "#vacant-end"].forEach((id) => {
        const select = $(id);
        select.innerHTML =
          `<option value="">Select</option>` +
          slots
            .map(
              (s) =>
                `<option value="${s.time_slot_id}">${s.start_time} - ${s.end_time}</option>`
            )
            .join("");
      });
    }

    $("#open-vacant-room").onclick = () => {
      toggle(menu, form);
      loadSlots();
    };

    $("#back-student-menu-vacant").onclick = () => toggle(form, menu);
    $("#back-vacant-results").onclick = () => {
      tableBody.innerHTML = "";
      toggle(results, form);
    };


    form.onsubmit = async (e) => {
      e.preventDefault();
      try {
        const params = new URLSearchParams({
          day: getVal("#vacant-day"),
          start_tid: getVal("#vacant-start"),
          end_tid: getVal("#vacant-end"),
        });

        const rooms = await fetchJSON(`/v1/admin/vacantRooms?${params}`);

        if (rooms.length) {
          tableBody.innerHTML = rooms
            .map(
              (r) => `
              <tr>
                <td>${r}</td>
                <td>✅ Available</td>
              </tr>`
            )
            .join("");
        } else {
          tableBody.innerHTML = `
            <tr>
              <td colspan="2">🚫 No rooms available.</td>
            </tr>`;
        }

        toggle(form, results);
      } catch (err) {
        showAlert(false, err.message);
      }
    };
  }



  // ======== Initialize All ========

  initNavigation();
  initStudentSection();
  initFacultySection();
  initAdminSection();
  initVacantRoomFinder();
});
