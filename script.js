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
