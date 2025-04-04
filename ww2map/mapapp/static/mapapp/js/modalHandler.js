// js/modalHandler.js

import { displayEvent } from "./eventDisplay.js";
import { showSoldierDetails } from "./soldierHandler.js";

export function showCountryEventsModal(countryName, events, soldiers) {
    const modal = document.getElementById("eventModal");
    if (!modal) {
        console.error("❌ שגיאה: המודאל לא נמצא!");
        return;
    }

    const eventTitle = document.getElementById("eventTitle");
    const imageElement = document.getElementById("eventImage");
    const videoElement = document.getElementById("eventVideo");
    const eventsTableBody = document.getElementById("eventsTableBody");
    const soldiersContainer = document.getElementById("soldiersContainer");
    const soldiersTitle = document.getElementById("soldiersTitle");

    // איפוס
    eventsTableBody.innerHTML = "";
    imageElement.style.display = "none";
    videoElement.style.display = "none";
    soldiersContainer.innerHTML = "";

    // אירועים
    if (events.length === 0) {
        eventsTableBody.innerHTML = `<tr><td colspan="2">אין אירועים במדינה זו</td></tr>`;
    } else {
        displayEvent(0);
    }

    // לוחמים
    soldiersTitle.style.display = soldiers.length > 0 ? "block" : "none";
    soldiersContainer.style.display = soldiers.length > 0 ? "block" : "none";

    if (soldiers.length === 0) {
        soldiersContainer.innerHTML = "<p>לא נמצאו לוחמים למדינה זו</p>";
    } else {
        soldiers.forEach(soldier => {
            const soldierDiv = document.createElement("div");
            soldierDiv.classList.add("soldier");

            const imageUrl = soldier.image && soldier.image.trim() !== ""
                ? soldier.image
                : (soldier.gender === "1.0" || soldier.gender === "1" || soldier.gender === 1
                    ? "https://media.istockphoto.com/id/666545204/vector/default-placeholder-profile-icon.jpg?s=612x612&w=0&k=20&c=UGYk-MX0pFWUZOr5hloXDREB6vfCqsyS7SgbQ1-heY8="
                    : "https://media.istockphoto.com/id/666545148/vector/default-placeholder-profile-icon.jpg?s=612x612&w=0&k=20&c=swBnLcHy6L9v5eaiRkDwfGLr5cfLkH9hKW-sZfH-m90=");

            soldierDiv.innerHTML = `
                <div class="soldier-image" style="
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    overflow: hidden;
                    margin: auto;
                    border: 2px solid #ccc;">
                    <img src="${imageUrl}" alt="${soldier.name || 'לוחם'}" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
                <p class="soldier-name">${soldier.name || 'לוחם'}</p>
            `;

            soldierDiv.onclick = () => showSoldierDetails(soldier);
            soldiersContainer.appendChild(soldierDiv);
        });

        soldiersContainer.offsetHeight; // Reflow
    }

    modal.style.display = "block";
    console.log("🔍 המודאל אמור להיות גלוי כעת");
}
export function setupModalClose(map) {
    const modal = document.getElementById("eventModal");

    window.closeModal = function () {
        if (!modal) return;

        if (window.currentMapView) {
            map.setView(window.currentMapView, map.getZoom(), { animate: true, duration: 0.3 });
        }

        modal.style.display = "none";
        document.getElementById("eventImage").src = "";
        document.getElementById("eventVideo").src = "";

        updateHeaderHintVisibility();
    };

    function updateHeaderHintVisibility() {
        const header = document.querySelector('.map-header');
        const headerHint = document.querySelector('.header-hint');
        if (!header || !headerHint) return;

        const isModalVisible = modal.style.display === 'block';
        if (isModalVisible) {
            headerHint.classList.add('hidden');
        } else if (!header.classList.contains('visible')) {
            headerHint.classList.remove('hidden');
        }
    }

    modal.addEventListener('transitionend', updateHeaderHintVisibility);
}
