export function initializeTimeline(map) {
    const timelineContainer = document.getElementById('timeline-events');
    
    // עיצוב חדש: רשימה אנכית עם גלילה
    timelineContainer.innerHTML = '';
    timelineContainer.classList.add('timeline-list');
    
    // טוען אירועים מהשרת
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
            // קיבוץ לפי שנה
            const validEvents = events.filter(event => event.title && event.date);
            const eventsByYear = {};
            validEvents.forEach(event => {
                const year = new Date(event.date).getFullYear();
                if (!eventsByYear[year]) eventsByYear[year] = [];
                eventsByYear[year].push(event);
            });
            const years = Object.keys(eventsByYear).sort((a, b) => parseInt(a) - parseInt(b));
            createYearCards(years, eventsByYear, timelineContainer, map);
        })
        .catch(error => {
            timelineContainer.innerHTML = `<div class="timeline-error">שגיאה: ${error.message}</div>`;
        });
}

function createYearCards(years, eventsByYear, container, map) {
    container.innerHTML = '';
    container.className = 'timeline-list';
    // כותרת
    const header = document.createElement('div');
    header.className = 'timeline-list-header';
    header.innerHTML = '<h2>בחר שנה</h2><div class="timeline-instruction">לחץ על שנה לצפייה באירועים</div>';
    container.appendChild(header);
    // רשימת שנים
    years.forEach(year => {
        const card = document.createElement('div');
        card.className = 'timeline-card timeline-year-card';
        card.innerHTML = `<div class="timeline-card-title">${year}</div><div class="timeline-card-sub">${eventsByYear[year].length} אירועים</div>`;
        card.addEventListener('click', () => {
            createEventCards(year, eventsByYear[year], container, map, () => createYearCards(years, eventsByYear, container, map));
        });
        container.appendChild(card);
    });
}

function createEventCards(year, events, container, map, backCallback) {
    container.innerHTML = '';
    container.className = 'timeline-list';
    // כותרת + כפתור חזרה
    const header = document.createElement('div');
    header.className = 'timeline-list-header';
    header.innerHTML = `<h2>אירועי ${year}</h2><div class="timeline-instruction">לחץ על אירוע למעבר במפה</div>`;
    container.appendChild(header);
    const backBtn = document.createElement('button');
    backBtn.className = 'timeline-back-btn';
    backBtn.textContent = 'חזרה לשנים';
    backBtn.onclick = backCallback;
    container.appendChild(backBtn);
    // אין אירועים
    if (!events || events.length === 0) {
        const noEvents = document.createElement('div');
        noEvents.className = 'timeline-no-events';
        noEvents.textContent = 'לא נמצאו אירועים לשנה זו';
        container.appendChild(noEvents);
        return;
    }
    // רשימת אירועים
    events.sort((a, b) => new Date(a.date) - new Date(b.date));
    events.forEach(event => {
        const card = document.createElement('div');
        card.className = 'timeline-card timeline-event-card';
        card.innerHTML = `<div class="timeline-card-title">${event.title}</div><div class="timeline-card-date">${formatDate(event.date)}</div>`;
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

function formatDate(dateStr) {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}