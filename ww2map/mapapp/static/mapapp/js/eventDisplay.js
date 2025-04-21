//מייצא פונקציה שמעדכנת את המודאל עם פרטי האירוע שנבחר
export function displayEvent(event) {
    console.log("Displaying event details:", event);
    
    // Make sure we have a valid event object
    if (!event) {
        console.error("No valid event data to display");
        return;
    }
    
    // Get all the elements
    const eventTitle = document.getElementById("eventTitle");
    const startDate = document.getElementById("startDate");
    const endDate = document.getElementById("endDate");
    const location = document.getElementById("location");
    const eventType = document.getElementById("eventType");
    const eventStatus = document.getElementById("eventStatus");
    const eventId = document.getElementById("eventId");
    const eventSummary = document.getElementById("eventSummary");
    const imageElement = document.getElementById("eventImage");
    const videoElement = document.getElementById("eventVideo");
    const countryFlag = document.getElementById("countryFlag");
    const eventDetails = document.getElementById("eventDetails");

    // Make sure event details section is visible
    if (eventDetails) {
        eventDetails.style.display = "block";
    }

    // Get event data with fallbacks for different field names
    const title = event.name || event.title || 'אירוע ללא שם';
    const start = event.date || event.start_date || "לא ידוע";
    const end = event.endDate || event.end_date || event.date || "לא ידוע";
    const locationText = event.location || event.country__name_he || event.country__name || "לא ידוע";
    const type = event.event_type || event.type || "לא ידוע";
    const status = event.status || "מאושר ★";
    const id = event.event_id || event.id || "לא ידוע";
    
    // Convert the event description to html if showdown is available
    let description = event.description || event.summary || "אין תיאור זמין";
    if (window.showdown) {
        try {
            const converter = new showdown.Converter();
            description = converter.makeHtml(description);
        } catch (error) {
            console.error("Error converting markdown:", error);
        }
    }

    // Update fields with the event data
    if (eventTitle && window.currentCountryName) {
        eventTitle.textContent = window.currentCountryName;  // Always show country name
    }
    
    if (startDate) startDate.textContent = start;
    if (endDate) endDate.textContent = end;
    if (location) location.textContent = locationText;
    if (eventType) eventType.textContent = type;
    if (eventStatus) eventStatus.textContent = status;
    if (eventId) eventId.textContent = id;
    if (eventSummary) eventSummary.innerHTML = description;

    // Handle flag display
    if (countryFlag && event.country_code) {
        const flagUrl = `https://flagcdn.com/w320/${event.country_code.toLowerCase()}.png`;
        countryFlag.src = flagUrl;
        countryFlag.style.display = 'block';
        countryFlag.alt = `דגל של ${event.country__name_he || event.country__name || ""}`;
    } else if (countryFlag) {
        // If the flag is not available, hide it
        countryFlag.style.display = 'none';
    }

    // Handle media
    if (imageElement) {
        if (event.image) {
            imageElement.src = event.image;
            imageElement.style.display = "block";
        } else {
            imageElement.style.display = "none";
        }
    }
    
    if (videoElement) {
        if (event.video) {
            videoElement.src = event.video;
            videoElement.style.display = "block";
        } else {
            videoElement.style.display = "none";
        }
    }
}

export function showCountryEvents(countryName, events) {
    console.log("Showing events for country:", countryName);
    console.log("Events:", events);
    
    window.currentCountryName = countryName;
    const eventTitle = document.getElementById('eventTitle');
    const eventsContainer = document.getElementById('eventsContainer');
    const eventDetails = document.getElementById('eventDetails');
    
    // Set country name in title
    if (eventTitle) {
        eventTitle.textContent = countryName;
    }
    
    // Initially hide the event details until a card is clicked
    if (eventDetails) {
        eventDetails.style.display = 'none';
    }
    
    // Clear previous events and show loading state
    if (eventsContainer) {
        eventsContainer.innerHTML = '<div class="loading-events">טוען אירועים...</div>';
        
        // Use setTimeout to ensure DOM is updated before adding events
        setTimeout(() => {
            if (events && events.length > 0) {
                console.log("Creating event cards...");
                eventsContainer.innerHTML = ''; // Clear loading message
                
                // Create event cards
                events.forEach(event => {
                    console.log("Creating card for event:", event);
                    const eventCard = document.createElement('div');
                    eventCard.className = 'event-card';
                    
                    // Get event data with fallbacks for different field names
                    const eventTitle = event.name || event.title || 'אירוע ללא שם';
                    const eventDate = event.date || formatDate(event.start_date) || 'לא ידוע';
                    const eventType = event.event_type || event.type || 'לא ידוע';
                    
                    // Create card content with clear structure
                    eventCard.innerHTML = `
                        <div class="card-content">
                            <div class="event-card-title">${eventTitle}</div>
                            <div class="event-card-date">${eventDate}</div>
                            <div class="event-card-type">${eventType}</div>
                        </div>
                    `;
                    
                    // Add click event
                    eventCard.addEventListener('click', () => {
                        console.log("Event card clicked:", eventTitle);
                        
                        // Update UI - remove active class from all cards and add to clicked card
                        document.querySelectorAll('.event-card').forEach(card => {
                            card.classList.remove('active');
                        });
                        eventCard.classList.add('active');
                        
                        // Remove prompt message if exists
                        const promptMessage = document.querySelector('.select-event-prompt');
                        if (promptMessage) {
                            promptMessage.style.display = 'none';
                        }
                        
                        // Ensure event details container is visible
                        if (eventDetails) {
                            // Add fade-in animation
                            eventDetails.style.opacity = '0';
                            eventDetails.style.display = 'block';
                            
                            // Use setTimeout to create a fade-in effect
                            setTimeout(() => {
                                eventDetails.style.opacity = '1';
                                
                                // Show event details with animation
                                displayEvent(event);
                            }, 50);
                        }
                    });
                    
                    // Append card to container
                    eventsContainer.appendChild(eventCard);
                });
                
                // Add a clear message prompting user to select an event
                const promptDiv = document.createElement('div');
                promptDiv.className = 'select-event-prompt';
                promptDiv.textContent = 'בחר אירוע כדי לראות את הפרטים המלאים';
                eventsContainer.appendChild(promptDiv);
                
                // Don't show first event by default - wait for user to click
            } else {
                console.log("No events available");
                eventsContainer.innerHTML = '<div class="no-events">לא נמצאו אירועים למדינה זו</div>';
                if (eventDetails) {
                    eventDetails.style.display = 'none';
                }
            }
        }, 0);
    }
}

// Helper function to format date
function formatDate(dateString) {
    if (!dateString) return 'לא ידוע';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('he-IL');
    } catch (error) {
        console.error("Error formatting date:", error);
        return 'לא ידוע';
    }
}
