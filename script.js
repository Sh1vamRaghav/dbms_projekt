document.addEventListener("DOMContentLoaded", () => {
  // NAVIGATION
  const navBtns = document.querySelectorAll(".nav-btn");
  const sections = document.querySelectorAll(".section");

  navBtns.forEach((btn) =>
    btn.addEventListener("click", () => {
      navBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      sections.forEach((s) => s.classList.remove("visible"));
      document.getElementById(btn.dataset.section).classList.add("visible");
    })
  );

  // STUDENT SECTION
  const studentMenu = document.getElementById("students-menu");
  const studentForm = document.getElementById("student-timetable-form");
  const studentContainer = document.getElementById("student-timetable-container");

  document.getElementById("open-student-timetable").onclick = () => {
    studentMenu.classList.add("hidden");
    studentForm.classList.remove("hidden");
  };

  document.getElementById("back-student-menu").onclick = () => {
    studentForm.classList.add("hidden");
    studentMenu.classList.remove("hidden");
  };

  document.getElementById("submit-student-timetable").onclick = async () => {
    const batch = document.getElementById("student-batch").value;
    const year = document.getElementById("student-year").value;
    const day = document.getElementById("student-day").value;

    const res = await fetch(`/v1/timetable?batch=${batch}&year=${year}&day=${day}`);
    const data = await res.json();
    const tbody = document.querySelector("#student-timetable-table tbody");
    tbody.innerHTML = "";
    data.forEach((row) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${row.course_id}</td>
        <td>${row.division_label}</td>
        <td>${row.day_name}</td>
        <td>${row.room_id}</td>
        <td>${row.start_time}</td>
        <td>${row.end_time}</td>`;
      tbody.appendChild(tr);
    });

    studentForm.classList.add("hidden");
    studentContainer.classList.remove("hidden");
  };

  document.getElementById("back-student-form").onclick = () => {
    studentContainer.classList.add("hidden");
    studentForm.classList.remove("hidden");
  };

  // FACULTY SECTION
  const facultyMenu = document.getElementById("faculty-menu");
  const facultyForm = document.getElementById("faculty-timetable-form-container");
  const facultyContainer = document.getElementById("faculty-timetable-container");
  const extraForm = document.getElementById("extra-class-form");

  document.getElementById("open-faculty-timetable").onclick = () => {
    facultyMenu.classList.add("hidden");
    facultyForm.classList.remove("hidden");
  };

  document.getElementById("back-faculty-menu").onclick = () => {
    facultyForm.classList.add("hidden");
    facultyMenu.classList.remove("hidden");
  };

  document.getElementById("open-extra-class").onclick = () => {
    facultyMenu.classList.add("hidden");
    extraForm.classList.remove("hidden");
  };

  document.getElementById("back-extra").onclick = () => {
    extraForm.classList.add("hidden");
    facultyMenu.classList.remove("hidden");
  };

  // LOAD FACULTY DATA
  async function loadFacultyData() {
    try {
      const [facRes, courseRes, roomRes, slotRes] = await Promise.all([
        fetch("/v1/faculty"),
        fetch("/v1/courses"),
        fetch("/v1/rooms"),
        fetch("/v1/timeSlots")
      ]);

      if (!facRes.ok || !courseRes.ok || !roomRes.ok || !slotRes.ok)
        throw new Error("One of the endpoints returned an error");

      const [faculties, courses, rooms, slots] = await Promise.all([
        facRes.json(),
        courseRes.json(),
        roomRes.json(),
        slotRes.json()
      ]);

      console.log("✅ Data loaded:", { faculties, courses, rooms, slots });

      // FACULTY
      const fidSelects = [document.getElementById("faculty-select"), document.getElementById("fid")];
      fidSelects.forEach(sel => {
        sel.innerHTML = `<option value="">Select Faculty</option>`;
        faculties.forEach(f => {
          const opt = document.createElement("option");
          opt.value = f.faculty_id;
          opt.textContent = f.faculty_name;
          sel.appendChild(opt);
        });
      });

      // COURSES
      const cidSelect = document.getElementById("cid");
      cidSelect.innerHTML = `<option value="">Select Course</option>`;
      courses.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c.course_id;
        opt.textContent = c.course_name;
        cidSelect.appendChild(opt);
      });

      // ROOMS
      const ridSelect = document.getElementById("rid");
      ridSelect.innerHTML = `<option value="">Select Room</option>`;
      rooms.forEach(r => {
        const opt = document.createElement("option");
        opt.value = r.room_id;
        opt.textContent = r.room_id;
        ridSelect.appendChild(opt);
      });

      // TIME SLOTS
      const tidSelect = document.getElementById("tid");
      tidSelect.innerHTML = `<option value="">Select Time Slot</option>`;
      slots.forEach(t => {
        const opt = document.createElement("option");
        opt.value = t.time_slot_id;
        opt.textContent = `${t.start_time} - ${t.end_time}`;
        tidSelect.appendChild(opt);
      });

    } catch (err) {
      console.error("❌ Failed to load faculty data:", err);
    }
  }

  loadFacultyData();

  // FACULTY TIMETABLE FORM
  document.getElementById("faculty-timetable-form").onsubmit = async (e) => {
    e.preventDefault();
    const fid = document.getElementById("faculty-select").value;
    const batch = document.getElementById("faculty-batch").value;
    const year = document.getElementById("faculty-year").value;
    const day = document.getElementById("faculty-day").value;
    
    const res = await fetch(`/v1/faculty/timetable?fid=${fid}&batch=${batch}&year=${year}&day=${day}`);
    const data = await res.json();

    const tbody = document.querySelector("#faculty-timetable-table tbody");
    tbody.innerHTML = "";
    data.forEach(row => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${row.course_name}</td>
        <td>${row.division_label}</td>
        <td>${row.day_name}</td>
        <td>${row.batch_name}</td>
        <td>${row.start_time}</td>
        <td>${row.end_time}</td>`;
      tbody.appendChild(tr);
    });

    facultyForm.classList.add("hidden");
    facultyContainer.classList.remove("hidden");
  };

  document.getElementById("back-faculty-form").onclick = () => {
    facultyContainer.classList.add("hidden");
    facultyForm.classList.remove("hidden");
  };

  // SCHEDULE EXTRA CLASS
  document.getElementById("extra-class").onsubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = new FormData(form);
    const params = new URLSearchParams(data);
    try {
      const res = await fetch(`/v1/faculty/extraClass?${params.toString()}`);
      const text = await res.text();
      let body;
      try {
        body = JSON.parse(text);
      } catch {
        body = {};
      }
      if (res.ok) {
        alert(`✅ ${body.message || "Extra class scheduled!"}`);
      } else {
        alert(`⚠️ ${body.error || text || "Failed to schedule class"}`);
      }
    } catch (err) {
      console.error(err);
      alert("🚨 Network or server error");
    }
  };

  // ADMIN SECTION
  const adminMenu = document.getElementById("admin-menu");
  const createForm = document.getElementById("create-class-form");
  const deleteForm = document.getElementById("delete-class-form");

  // open create form
  document.getElementById("open-create-class").onclick = () => {
    adminMenu.classList.add("hidden");
    createForm.classList.remove("hidden");
  };

  // open delete form
  document.getElementById("open-delete-class").onclick = () => {
    adminMenu.classList.add("hidden");
    deleteForm.classList.remove("hidden");
  };

  // back buttons
  document.getElementById("back-admin-menu-create").onclick = () => {
    createForm.classList.add("hidden");
    adminMenu.classList.remove("hidden");
  };
  document.getElementById("back-admin-menu-delete").onclick = () => {
    deleteForm.classList.add("hidden");
    adminMenu.classList.remove("hidden");
  };

  // dynamically load dropdowns for admin like faculty, course, room, timeslot
  async function loadAdminData() {
    try {
      const [facRes, courseRes, roomRes, slotRes] = await Promise.all([
        fetch("/v1/faculty"),
        fetch("/v1/courses"),
        fetch("/v1/rooms"),
        fetch("/v1/timeSlots")
      ]);

      const [faculties, courses, rooms, slots] = await Promise.all([
        facRes.json(), courseRes.json(), roomRes.json(), slotRes.json()
      ]);

      // --- FACULTY SELECTS (Create + Delete) ---
      const facultySelects = [
        document.getElementById("faculty_id"), // create form
        document.getElementById("del_faculty") // delete form
      ];
      facultySelects.forEach(sel => {
        sel.innerHTML = `<option value="">Select Faculty</option>`;
        faculties.forEach(f => {
          const opt = document.createElement("option");
          opt.value = f.faculty_id;
          opt.textContent = f.faculty_name;
          sel.appendChild(opt);
        });
      });

      // --- COURSE SELECTS (Create + Delete) ---
      const courseSelects = [
        document.getElementById("course_id"),
        document.getElementById("del_course")
      ];
      courseSelects.forEach(sel => {
        sel.innerHTML = `<option value="">Select Course</option>`;
        courses.forEach(c => {
          const opt = document.createElement("option");
          opt.value = c.course_id;
          opt.textContent = c.course_name;
          sel.appendChild(opt);
        });
      });

      // --- ROOM SELECTS (Create + Delete) ---
      const roomSelects = [
        document.getElementById("room_id"),
        document.getElementById("del_room")
      ];
      roomSelects.forEach(sel => {
        sel.innerHTML = `<option value="">Select Room</option>`;
        rooms.forEach(r => {
          const opt = document.createElement("option");
          opt.value = r.room_id;
          opt.textContent = r.room_id;
          sel.appendChild(opt);
        });
      });

      // --- TIME SLOT SELECTS (Create + Delete) ---
      const slotSelects = [
        document.getElementById("time_slot"),
        document.getElementById("del_time")
      ];
      slotSelects.forEach(sel => {
        sel.innerHTML = `<option value="">Select Time Slot</option>`;
        slots.forEach(s => {
          const opt = document.createElement("option");
          opt.value = s.time_slot_id;
          opt.textContent = `${s.start_time} - ${s.end_time}`;
          sel.appendChild(opt);
        });
      });

      console.log("✅ Admin dropdowns loaded");

    } catch (err) {
      console.error("⚠️ Failed to load admin dropdown data:", err);
    }
  }

  loadAdminData();

  // handle CREATE class
  document.getElementById("create-class").onsubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = new FormData(form);
    const params = new URLSearchParams(data);
    try {
      const res = await fetch(`/v1/admin/createEntry?${params.toString()}`);
      const text = await res.text();
      let body;
      try { body = JSON.parse(text); } catch { body = {}; }
      if (res.ok) alert(`✅ ${body.message || "Class scheduled successfully!"}`);
      else alert(`⚠️ ${body.error || text || "Failed to schedule class"}`);
    } catch (err) {
      console.error(err);
      alert("🚨 Network error");
    }
  };

  // handle DELETE class
  document.getElementById("delete-class").onsubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = new FormData(form);
    const params = new URLSearchParams(data);
    try {
      const res = await fetch(`/v1/admin/deleteEntry?${params.toString()}`);
      const text = await res.text();
      let body;
      try { body = JSON.parse(text); } catch { body = {}; }
      if (res.ok) alert(`✅ ${body.message || "Class deleted successfully!"}`);
      else alert(`⚠️ ${body.error || text || "Failed to delete class"}`);
    } catch (err) {
      console.error(err);
      alert("🚨 Network error");
    }
  };
  // ====== VACANT ROOM FINDER ======

  const vacantForm = document.getElementById("vacant-room-form");
  const vacantResults = document.getElementById("vacant-room-results");
  const vacantList = document.getElementById("vacant-room-list");

  // Open vacant room form
  document.getElementById("open-vacant-room").onclick = () => {
    document.getElementById("students-menu").classList.add("hidden");
    vacantForm.classList.remove("hidden");
  };

  // Back to student menu from form
  document.getElementById("back-student-menu-vacant").onclick = () => {
    vacantForm.classList.add("hidden");
    document.getElementById("students-menu").classList.remove("hidden");
  };

  // Back to vacant search from results
  document.getElementById("back-vacant-results").onclick = () => {
    vacantResults.classList.add("hidden");
    vacantForm.classList.remove("hidden");
  };

  // Load time slots for dropdown
  async function loadVacantSlots() {
    try {
      const res = await fetch("/v1/timeSlots");
      if (!res.ok) throw new Error("Failed to fetch time slots");
      const slots = await res.json();
      const tidSelect = document.getElementById("vacant-tid");
      tidSelect.innerHTML = `<option value="">Select Time Slot</option>`;
      slots.forEach(s => {
        const opt = document.createElement("option");
        opt.value = s.time_slot_id;
        opt.textContent = `${s.start_time} - ${s.end_time}`;
        tidSelect.appendChild(opt);
      });
    } catch (err) {
      console.error("❌ Failed to load time slots:", err);
    }
  }
  loadVacantSlots();

  // Handle form submit
  document.getElementById("vacant-room").onsubmit = async (e) => {
    e.preventDefault();
    const day = document.getElementById("vacant-day").value;
    const tid = document.getElementById("vacant-tid").value;
    const date = document.getElementById("vacant-date").value;

    try {
      const res = await fetch(`/v1/vacantRooms?day=${day}&tid=${tid}&date=${date}`);
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = [];
      }

      if (!res.ok) {
        alert(`⚠️ ${data.error || text || "Failed to fetch vacant rooms"}`);
        return;
      }

      vacantList.innerHTML = "";

      if (data.length === 0) {
        vacantList.innerHTML = `<li>🚫 No rooms available for that time.</li>`;
      } else {
        data.forEach(room => {
          const li = document.createElement("li");
          li.textContent = `🏫 Room ${room}`;
          vacantList.appendChild(li);
        });
      }

      vacantForm.classList.add("hidden");
      vacantResults.classList.remove("hidden");
    } catch (err) {
      console.error(err);
      alert("🚨 Network error while fetching vacant rooms");
    }
  };
  
});
