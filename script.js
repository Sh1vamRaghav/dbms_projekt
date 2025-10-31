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

    const form = e.target; // your <form id="extra-class">
    const data = new FormData(form); // collects all fields automatically
    const params = new URLSearchParams(data); // turns FormData into query string

    console.log("➡️ Params:", params.toString());

    const res = await fetch(`/v1/faculty/extraClass?${params.toString()}`);
    if (res.ok) alert("✅ Extra class scheduled!");
    else alert("❌ Failed to schedule class");
  };

});
