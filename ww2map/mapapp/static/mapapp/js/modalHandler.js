    // js/modalHandler.js

    import { displayEvent, showCountryEvents } from "./eventDisplay.js";
    import { showSoldierDetails } from "./soldierHandler.js";

    // Keep a reference to all soldiers for search functionality
    let allSoldiers = [];

    export function showCountryEventsModal(countryName, events, soldiers) {
        const modal = document.getElementById("eventModal");
        if (!modal) {
            console.error("❌ שגיאה: המודאל לא נמצא!");
            return;
        }

        console.log("Opening modal for country:", countryName);

        // Initialize modal elements
        const eventTitle = document.getElementById("eventTitle");
        const eventSummary = document.getElementById("eventSummary");
        const imageElement = document.getElementById("eventImage");
        const videoElement = document.getElementById("eventVideo");
        const soldiersContainer = document.getElementById("soldiersContainer");
        const soldiersTitle = document.getElementById("soldiersTitle");
        const eventDetails = document.getElementById("eventDetails");
        const soldiersSearch = document.getElementById("soldiersSearch");
        const clearSearch = document.getElementById("clearSearch");

        // Reset modal content
        if (eventTitle) eventTitle.textContent = countryName;
        if (eventSummary) eventSummary.innerHTML = "אין תיאור זמין";
        if (imageElement) {
            imageElement.src = "";
            imageElement.style.display = "none";
        }
        if (videoElement) {
            videoElement.src = "";
            videoElement.style.display = "none";
        }
        
        // Note: We don't change the flag here because it is set by the caller
        // This ensures the flag stays visible when viewing different events
        
        // Store reference to all soldiers
        allSoldiers = [...soldiers];

        // Handle soldiers section
        if (soldiersContainer) {
            renderSoldiers(soldiers, soldiersContainer);
        }

        if (soldiersTitle) {
            soldiersTitle.style.display = soldiers.length > 0 ? "block" : "none";
        }

        // Setup search functionality
        if (soldiersSearch) {
            soldiersSearch.value = ""; // Clear any previous search
            soldiersSearch.addEventListener("input", handleSearch);
            
            // Show clear button when there's text
            soldiersSearch.addEventListener("input", function() {
                clearSearch.style.display = this.value ? "block" : "none";
            });
        }

        if (clearSearch) {
            clearSearch.style.display = "none"; // Initially hidden
            clearSearch.addEventListener("click", function() {
                soldiersSearch.value = "";
                renderSoldiers(allSoldiers, soldiersContainer);
                this.style.display = "none";
                soldiersSearch.focus();
            });
        }

        // Show modal
        modal.style.display = "block";

        // Display events if available
        if (events && events.length > 0) {
            window.currentEvents = events;
            window.currentIndex = 0;
            
            // Call showCountryEvents instead of displayEvent
            showCountryEvents(countryName, events);
            
            // Don't show event details initially - wait for user to click a card
            if (eventDetails) {
                eventDetails.style.display = 'none';
            }
        } else {
            console.log("No events found for this country");
            const eventsContainer = document.getElementById('eventsContainer');
            if (eventsContainer) {
                eventsContainer.innerHTML = '<div class="no-events">לא נמצאו אירועים למדינה זו</div>';
            }
            if (eventDetails) {
                eventDetails.style.display = 'none';
            }
        }

        console.log("🔍 המודאל נפתח בהצלחה");
    }

    // Function to render soldiers list
    function renderSoldiers(soldiers, container) {
        if (!container) return;
        
        container.innerHTML = "";
        if (soldiers.length === 0) {
            container.innerHTML = "<p>לא נמצאו לוחמים למדינה זו</p>";
            return;
        }
        
        soldiers.forEach(soldier => {
            const soldierDiv = document.createElement("div");
            soldierDiv.classList.add("soldier");

            const imageUrl = soldier.image && soldier.image.trim() !== ""
                ? soldier.image
                : (soldier.gender === "1.0" || soldier.gender === "1" || soldier.gender === 1
                    ? "https://media.istockphoto.com/id/666545204/vector/default-placeholder-profile-icon.jpg?s=612x612&w=0&k=20&c=UGYk-MX0pFWUZOr5hloXDREB6vfCqsyS7SgbQ1-heY8="
                    : "https://media.istockphoto.com/id/666545148/vector/default-placeholder-profile-icon.jpg?s=612x612&w=0&k=20&c=swBnLcHy6L9v5eaiRkDwfGLr5cfLkH9hKW-sZfH-m90=");

            soldierDiv.innerHTML = `
                <div class="soldier-image">
                    <img src="${imageUrl}" alt="${soldier.name || 'לוחם'}">
                </div>
                <p class="soldier-name">${soldier.name || 'לוחם'}</p>
            `;

            soldierDiv.onclick = () => showSoldierDetails(soldier);
            container.appendChild(soldierDiv);
        });
    }

    // Search function
    function handleSearch() {
        const query = this.value.trim().toLowerCase();
        const soldiersContainer = document.getElementById("soldiersContainer");
        
        if (!query) {
            renderSoldiers(allSoldiers, soldiersContainer);
            return;
        }
        
        const filteredSoldiers = allSoldiers.filter(soldier => 
            (soldier.name && soldier.name.toLowerCase().includes(query))
        );
        
        renderSoldiers(filteredSoldiers, soldiersContainer);
    }

    export function setupModalClose(map) {
        const modal = document.getElementById("eventModal");
        if (!modal) return;

        window.closeModal = function () {
            if (!modal) return;

            if (window.currentMapView) {
                map.setView(window.currentMapView, map.getZoom(), { animate: true, duration: 0.3 });
            }

            modal.style.display = "none";
            const imageElement = document.getElementById("eventImage");
            const videoElement = document.getElementById("eventVideo");
            if (imageElement) imageElement.src = "";
            if (videoElement) videoElement.src = "";

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
