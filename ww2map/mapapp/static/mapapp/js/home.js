// Initialize the Map
const map = new maplibregl.Map({
    container: 'map', // ID of the map container in HTML
    style: 'https://api.maptiler.com/maps/66aaf810-42b4-405e-b738-f7b427aa3adc/style.json?key=id6E01naKP3UCWgW7hY1',
    center: [40.80402, -2.61425], // Initial center of the map
    zoom: 1, // Initial zoom level
    interactive: false // Disable interactions for moving background map
});

// Add smooth panning animation for the moving map
setInterval(() => {
    map.panBy([3, 0], { duration: 0 }); // Pan map horizontally
}, 100);

// Handle "Select Time Range" button click
// Handle "Select Time Range" button click
const timeRangeButton = document.getElementById("show-time-range");
const timeRangeForm = document.getElementById("time-range-form");

timeRangeButton.addEventListener("click", (e) => {
    e.preventDefault(); // Prevent default behavior
    if (timeRangeForm.style.display === "none") {
        timeRangeForm.style.display = "block"; // Show the form
    } else {
        timeRangeForm.style.display = "none"; // Hide the form if already visible
    }
});
document.addEventListener("DOMContentLoaded", function () {
    const toggle = document.getElementById("dark-mode-toggle");
    toggle.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
    });
});