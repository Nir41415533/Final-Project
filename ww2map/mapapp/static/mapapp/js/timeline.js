export function initializeTimeline(map) {
    const timelineContainer = document.getElementById('timeline-events');
    
    // Get current language
    const currentLang = document.documentElement.lang || 'he';
    
    // עיצוב חדש: רשימה אנכית עם גלילה
    timelineContainer.innerHTML = '';
    timelineContainer.classList.add('timeline-list');
    
    // Add language parameter to the API call
    const apiUrl = currentLang === 'he' ? "/events/?lang=he" : "/events/?lang=en";
    
    // טוען אירועים מהשרת
    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(events => {
            if (!Array.isArray(events) || events.length === 0) {
                const noEventsMessage = currentLang === 'he' ? "לא התקבלו אירועים מהשרת" : "No events received from server";
                throw new Error(noEventsMessage);
            }
            // קיבוץ לפי שנה
            const validEvents = events.filter(event => event.title && event.date);
            const eventsByYear = {};
            validEvents.forEach(event => {
                const year = new Date(event.date).getFullYear();
                if (!eventsByYear[year]) eventsByYear[year] = [];
                eventsByYear[year].push(event);
            });
            const years = Object.keys(eventsByYear).sort((a, b) => parseInt(a) - parseInt(b));
            createYearCards(years, eventsByYear, timelineContainer, map, currentLang);
        })
        .catch(error => {
            const errorMessage = currentLang === 'he' ? `שגיאה: ${error.message}` : `Error: ${error.message}`;
            timelineContainer.innerHTML = `<div class="timeline-error">${errorMessage}</div>`;
        });
}

function createYearCards(years, eventsByYear, container, map, currentLang) {
    container.innerHTML = '';
    container.className = 'timeline-list';
    
    // כותרת - bilingual
    const header = document.createElement('div');
    header.className = 'timeline-list-header';
    const headerTitle = currentLang === 'he' ? 'בחר שנה' : 'Select Year';
    const headerInstruction = currentLang === 'he' ? 'לחץ על שנה לצפייה באירועים' : 'Click on a year to view events';
    header.innerHTML = `<h2>${headerTitle}</h2><div class="timeline-instruction">${headerInstruction}</div>`;
    container.appendChild(header);
    
    // רשימת שנים
    years.forEach(year => {
        const card = document.createElement('div');
        card.className = 'timeline-card timeline-year-card';
        const eventsText = currentLang === 'he' ? 'אירועים' : 'events';
        
        // Set tooltip attributes for CSS hover effects
        const clickTooltip = currentLang === 'he' ? `לחץ לצפייה ב-${year}` : `Click to view ${year}`;
        const eventsCountText = `${eventsByYear[year].length} ${eventsText}`;
        card.setAttribute('data-tooltip', clickTooltip);
        card.setAttribute('data-events-text', eventsCountText);
        
        card.innerHTML = `<div class="timeline-card-title">${year}</div><div class="timeline-card-sub">${eventsByYear[year].length} ${eventsText}</div>`;
        card.addEventListener('click', () => {
            createEventCards(year, eventsByYear[year], container, map, currentLang, () => createYearCards(years, eventsByYear, container, map, currentLang));
        });
        container.appendChild(card);
    });
}

function createEventCards(year, events, container, map, currentLang, backCallback) {
    container.innerHTML = '';
    container.className = 'timeline-list';
    
    // כותרת + כפתור חזרה - bilingual
    const header = document.createElement('div');
    header.className = 'timeline-list-header';
    const yearTitle = currentLang === 'he' ? `אירועי ${year}` : `Events of ${year}`;
    const yearInstruction = currentLang === 'he' ? 'לחץ על אירוע למעבר במפה' : 'Click on an event to navigate on the map';
    header.innerHTML = `<h2>${yearTitle}</h2><div class="timeline-instruction">${yearInstruction}</div>`;
    container.appendChild(header);
    
    const backBtn = document.createElement('button');
    backBtn.className = 'timeline-back-btn';
    backBtn.textContent = currentLang === 'he' ? 'חזרה לשנים' : 'Back to Years';
    backBtn.onclick = backCallback;
    container.appendChild(backBtn);
    
    // אין אירועים
    if (!events || events.length === 0) {
        const noEvents = document.createElement('div');
        noEvents.className = 'timeline-no-events';
        const noEventsText = currentLang === 'he' ? 'לא נמצאו אירועים לשנה זו' : 'No events found for this year';
        noEvents.textContent = noEventsText;
        container.appendChild(noEvents);
        return;
    }
    
    // רשימת אירועים
    events.sort((a, b) => new Date(a.date) - new Date(b.date));
    events.forEach(event => {
        const card = document.createElement('div');
        card.className = 'timeline-card timeline-event-card';
        card.innerHTML = `<div class="timeline-card-title">${event.title}</div><div class="timeline-card-date">${formatDate(event.date, currentLang)}</div>`;
        card.addEventListener('click', () => {
            let lat = event.latitude, lng = event.longitude;
            if ((!lat || !lng) && event.country) {
                lat = event.country.latitude;
                lng = event.country.longitude;
            }
            if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
                map.flyTo({ center: [lng, lat], zoom: 5, duration: 2000 });
            } else {
                map.flyTo({ center: [31.0461, 34.8516], zoom: 3, duration: 2000 });
            }
        });
        container.appendChild(card);
    });
}

// Update formatDate function to support both languages
function formatDate(dateString, currentLang = 'he') {
    const date = new Date(dateString);
    
    if (currentLang === 'he') {
        const hebrewMonths = [
            'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
            'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
        ];
        return `${date.getDate()} ${hebrewMonths[date.getMonth()]} ${date.getFullYear()}`;
    } else {
        // English format
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }
}