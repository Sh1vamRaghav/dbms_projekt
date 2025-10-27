document.addEventListener("DOMContentLoaded", () => {
    const navButtons = document.querySelectorAll(".nav-btn");
    const sections = document.querySelectorAll(".section");

    navButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            // Switch active tab
            navButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            // Show correct section
            const target = btn.getAttribute("data-section");
            sections.forEach(sec => {
                sec.classList.toggle("visible", sec.id === target);
            });
        });
    });
});
