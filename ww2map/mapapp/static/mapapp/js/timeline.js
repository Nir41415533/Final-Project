export function initializeTimeline(map) {
    const timelineContainer = document.getElementById('timeline-events');
    
    // Clear existing content
    timelineContainer.innerHTML = '';
    
    // Add timeline bar
    const timelineBar = document.createElement('div');
    timelineBar.className = 'timeline-bar';
    timelineContainer.appendChild(timelineBar);
    
    // Add header
    const header = document.createElement('div');
    header.className = 'timeline-header';
    timelineContainer.appendChild(header);

    // Sample events for testing
    const sampleEvents = [
    //     { date: '1939-09-01', title: 'פלישת גרמניה לפולין', latitude: 52.2297, longitude: 21.0122 },
    //     { date: '1940-05-10', title: 'הפלישה הגרמנית לצרפת', latitude: 48.8566, longitude: 2.3522 },
    //     { date: '1940-06-22', title: 'כניעת צרפת', latitude: 48.8566, longitude: 2.3522 },
    //     { date: '1940-07-10', title: 'הקרב על בריטניה', latitude: 51.5074, longitude: -0.1278 },
    //     { date: '1941-06-22', title: 'מבצע ברברוסה', latitude: 55.7558, longitude: 37.6173 },
    //     { date: '1941-12-07', title: 'התקפת פרל הארבור', latitude: 21.3069, longitude: -157.8583 },
    //     { date: '1942-06-04', title: 'קרב מידוויי', latitude: 28.2017, longitude: -177.3800 },
    //     { date: '1942-11-08', title: 'מבצע לפיד', latitude: 36.7538, longitude: 3.0588 },
    //     { date: '1943-02-02', title: 'כניעת הגרמנים בסטלינגרד', latitude: 48.7071, longitude: 44.5169 },
    //     { date: '1943-07-10', title: 'פלישת בעלות הברית לסיציליה', latitude: 37.5079, longitude: 14.0154 },
    //     { date: '1944-06-06', title: 'יום הפלישה לנורמנדי', latitude: 49.2144, longitude: -0.6959 },
    //     { date: '1944-08-25', title: 'שחרור פריז', latitude: 48.8566, longitude: 2.3522 },
    //     { date: '1944-12-16', title: 'הקרב על הבליטה', latitude: 50.8503, longitude: 4.3517 },
    //     { date: '1945-02-04', title: 'ועידת יalta', latitude: 44.4977, longitude: 34.1633 },
    //     { date: '1945-04-30', title: 'התאבדות היטלר', latitude: 52.5200, longitude: 13.4050 },
    //     { date: '1945-05-08', title: 'יום הניצחון באירופה', latitude: 48.1351, longitude: 11.5820 },
    //     { date: '1945-08-06', title: 'הטלת פצצת האטום על הירושימה', latitude: 34.3853, longitude: 132.4553 },
    //     { date: '1945-08-09', title: 'הטלת פצצת האטום על נגסאקי', latitude: 32.7503, longitude: 129.8779 },
    //     { date: '1945-08-15', title: 'כניעת יפן', latitude: 35.6762, longitude: 139.6503 },
    //     { date: '1945-09-02', title: 'סיום מלחמת העולם השנייה', latitude: 35.6762, longitude: 139.6503 }
    ];
    
    // Load events from server
    fetch("/events/")
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(events => {
            if (!Array.isArray(events) || events.length === 0) {
                throw new Error("לא התקבלו אירועים מהשרת");
            }
            
            console.log("נטענו אירועים:", events.length);
            
            // Combine server events with sample events
            const allEvents = [...events, ...sampleEvents];
            
            // Sort events by date
            allEvents.sort((a, b) => {
                const dateA = a.date ? new Date(a.date) : new Date(0);
                const dateB = b.date ? new Date(b.date) : new Date(0);
                return dateA - dateB;
            });
            
            // Filter out events without titles
            const validEvents = allEvents.filter(event => event.title);
            
            console.log("אירועים תקינים:", validEvents.length);
            
            if (validEvents.length === 0) {
                throw new Error("לא נמצאו אירועים תקינים");
            }
            
            // Find min and max dates to calculate positions
            const minDate = new Date(validEvents[0].date);
            const maxDate = new Date(validEvents[validEvents.length - 1].date);
            const dateRange = maxDate - minDate;
            
            // Create timeline events
            validEvents.forEach(event => {
                const eventElement = document.createElement('div');
                eventElement.className = 'timeline-event';
                
                // Calculate position based on date
                const date = new Date(event.date);
                const percentage = dateRange === 0 ? 0.5 : (date - minDate) / dateRange;
                const position = 5 + (95 - 5) * percentage; // From 5% to 95% of the container
                
                eventElement.style.top = `${position}%`;
                
                // Format date safely
                let dateDisplay = "";
                if (event.date) {
                    const date = new Date(event.date);
                    if (!isNaN(date.getTime())) {
                        // Format date as DD/MM/YYYY
                        const day = String(date.getDate()).padStart(2, '0');
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const year = date.getFullYear();
                        dateDisplay = `${day}/${month}/${year}`;
                    }
                }
                
                // Set data attributes for display
                eventElement.setAttribute('data-title', event.title);
                eventElement.setAttribute('data-year', dateDisplay);
                
                // Add click event to center map on the event location
                eventElement.addEventListener('click', () => {
                    // Try event coordinates first
                    let lat = event.latitude, lng = event.longitude;
                    // If not present, try event.country
                    if ((!lat || !lng) && event.country) {
                        lat = event.country.latitude;
                        lng = event.country.longitude;
                    }
                    if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
                        map.flyTo({
                            center: [lng, lat],
                            zoom: 5,
                            duration: 2000
                        });
                    } else {
                        // Default center if no coordinates
                        map.flyTo({
                            center: [31.0461, 34.8516],
                            zoom: 3,
                            duration: 2000
                        });
                    }
                });
                
                timelineContainer.appendChild(eventElement);
            });
        })
        .catch(error => {
            console.error("❌ שגיאה בטעינת אירועים:", error);
            timelineContainer.innerHTML = `<div class="timeline-error">שגיאה: ${error.message}</div>`;
        });
}