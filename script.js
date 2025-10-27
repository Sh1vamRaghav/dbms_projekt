document.addEventListener("DOMContentLoaded", () => {
    // === NAVIGATION BETWEEN TABS ===
    const navButtons = document.querySelectorAll(".nav-btn");
    const sections = document.querySelectorAll(".section");

    navButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            navButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            const target = btn.getAttribute("data-section");
            sections.forEach(sec => {
                sec.classList.toggle("visible", sec.id === target);
            });
        });
    });

    // === STUDENTS SECTION LOGIC ===
    const studentsMenu = document.getElementById("students-menu");
    const timetableForm = document.getElementById("timetable-form");
    const timetableContainer = document.getElementById("timetable-container");
    const timetableBody = document.querySelector("#timetable-table tbody");

    const openTimetableBtn = document.getElementById("open-timetable");
    const backToMenuBtn = document.getElementById("back-to-menu");
    const backToFormBtn = document.getElementById("back-to-form");
    const submitTimetableBtn = document.getElementById("submit-timetable");

    const daySelect = document.getElementById("day-select");
    const batchSelect = document.getElementById("batch-select");
    const yearSelect = document.getElementById("year-select");

    // Step 1: Open form
    openTimetableBtn.addEventListener("click", () => {
        studentsMenu.classList.add("hidden");
        timetableForm.classList.remove("hidden");
    });

    // Step 2: Back to main menu
    backToMenuBtn.addEventListener("click", () => {
        timetableForm.classList.add("hidden");
        studentsMenu.classList.remove("hidden");
    });

    // Step 3: Back from table to form
    backToFormBtn.addEventListener("click", () => {
        timetableContainer.classList.add("hidden");
        timetableForm.classList.remove("hidden");
    });

    // Step 4: Submit form to get timetable
    submitTimetableBtn.addEventListener("click", async () => {
        const batch = batchSelect.value;
        const year = yearSelect.value;
        const day = daySelect.value;

        if (!batch || !year) {
            alert("Please select both batch and year.");
            return;
        }

        try {
            const res = await fetch(`/v1/timetable?batch=${batch}&year=${year}&day=${day}`);
            if (!res.ok) {
                alert("Failed to load timetable.");
                return;
            }

            const data = await res.json();
            timetableBody.innerHTML = "";

            if (data.length === 0) {
                timetableBody.innerHTML = `<tr><td colspan="6">No timetable found.</td></tr>`;
            } else {
                data.forEach(row => {
                    const tr = document.createElement("tr");
                    tr.innerHTML = `
                        <td>${row.course_id}</td>
                        <td>${row.division_label}</td>
                        <td>${row.day_name}</td>
                        <td>${row.room_id}</td>
                        <td>${row.start_time}</td>
                        <td>${row.end_time}</td>
                    `;
                    timetableBody.appendChild(tr);
                });
            }

            timetableForm.classList.add("hidden");
            timetableContainer.classList.remove("hidden");
        } catch (err) {
            console.error("Fetch error:", err);
            alert("Error fetching timetable.");
        }
    });
});

// === FACULTY SECTION LOGIC ===
document.addEventListener("DOMContentLoaded", () => {
  const facultyMenu = document.getElementById("faculty-menu");
  const facultyFormContainer = document.getElementById("faculty-timetable-form-container");
  const facultyContainer = document.getElementById("faculty-timetable-container");
  const facultyGrid = document.getElementById("faculty-timetable-grid");

  const openFacultyBtn = document.getElementById("faculty-view-timetable");
  const backToFacultyMenu = document.getElementById("back-to-faculty-menu");
  const backToFacultyForm = document.getElementById("back-to-faculty-form");

  const form = document.getElementById("faculty-timetable-form");

  // Open the form
  openFacultyBtn.addEventListener("click", () => {
    facultyMenu.classList.add("hidden");
    facultyFormContainer.classList.remove("hidden");
  });

  // Back to main faculty menu
  backToFacultyMenu.addEventListener("click", () => {
    facultyFormContainer.classList.add("hidden");
    facultyMenu.classList.remove("hidden");
  });

  // Back to form from results
  backToFacultyForm.addEventListener("click", () => {
    facultyContainer.classList.add("hidden");
    facultyFormContainer.classList.remove("hidden");
  });

  // Handle form submit
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fid = document.getElementById("faculty-id").value;
    const batch = document.getElementById("batch").value;
    const year = document.getElementById("year").value;
    const day = document.getElementById("day").value;

    if (!fid || !batch || !year) {
      alert("Please fill in all required fields.");
      return;
    }

    const url = `/v1/faculty/timetable?fid=${fid}&batch=${batch}&year=${year}&day=${day}`;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch timetable");

      const data = await res.json();
      if (data.length === 0) {
        facultyGrid.innerHTML = `<p>No timetable found.</p>`;
      } else {
        let html = `
          <table class="timetable-grid">
            <thead>
              <tr>
                <th>Batch</th>
                <th>Division</th>
                <th>Course</th>
                <th>Day</th>
                <th>Start</th>
                <th>End</th>
              </tr>
            </thead>
            <tbody>
        `;

        data.forEach(entry => {
          html += `
            <tr>
              <td>${entry.batch_name}</td>
              <td>${entry.division_label}</td>
              <td>${entry.course_name}</td>
              <td>${entry.day_name}</td>
              <td>${entry.start_time}</td>
              <td>${entry.end_time}</td>
            </tr>
          `;
        });

        html += `</tbody></table>`;
        facultyGrid.innerHTML = html;
      }

      // Switch view
      facultyFormContainer.classList.add("hidden");
      facultyContainer.classList.remove("hidden");

    } catch (err) {
      console.error(err);
      facultyGrid.innerHTML = `<p>Error loading timetable.</p>`;
    }
  });
});
