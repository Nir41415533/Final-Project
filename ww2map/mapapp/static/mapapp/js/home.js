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

// Handle Timeline button click
const timelineButton = document.getElementById("show-timeline");

timelineButton.addEventListener("click", (e) => {
    e.preventDefault();
    // כאן נוסיף את הלוגיקה להצגת ציר הזמן האינטראקטיבי
    showInteractiveTimeline();
});

function showInteractiveTimeline() {
    // יצירת חלון טעינה
    const loadingModal = document.createElement('div');
    loadingModal.className = 'timeline-modal';
    loadingModal.innerHTML = `
        <div class="timeline-content">
            <div class="timeline-header">
                <h2>טוען אירועים...</h2>
                <div class="loading-spinner"></div>
            </div>
        </div>
    `;
    document.body.appendChild(loadingModal);
    
    setTimeout(() => {
        loadingModal.classList.add('timeline-modal-active');
    }, 10);

    // קריאה לשרת לקבלת האירועים
    fetch('/events/')
        .then(response => response.json())
        .then(events => {
            // הסרת חלון הטעינה
            loadingModal.remove();
            
            // עיבוד האירועים
            const processedEvents = events.map((event, index) => {
                const eventDate = new Date(event.date);
                const year = eventDate.getFullYear().toString();
                const month = eventDate.toLocaleDateString('he-IL', { month: 'long' });
                
                // בחירת אייקון וצבע על בסיס תוכן האירוע
                let icon = '📅';
                let color = '#007bff';
                
                const title = event.title.toLowerCase();
                if (title.includes('קרב') || title.includes('battle') || title.includes('מלחמה') || title.includes('war')) {
                    icon = '⚔️';
                    color = '#dc3545';
                } else if (title.includes('שחרור') || title.includes('liberation') || title.includes('חירות')) {
                    icon = '🕊️';
                    color = '#28a745';
                } else if (title.includes('פלישה') || title.includes('invasion') || title.includes('כיבוש')) {
                    icon = '🔥';
                    color = '#fd7e14';
                } else if (title.includes('הפצצה') || title.includes('bombing') || title.includes('תקיפה')) {
                    icon = '💥';
                    color = '#ffc107';
                } else if (title.includes('כניעה') || title.includes('surrender') || title.includes('נפילה')) {
                    icon = '🏳️';
                    color = '#6c757d';
                } else if (title.includes('ניצחון') || title.includes('victory')) {
                    icon = '🏆';
                    color = '#28a745';
                }
                
                return {
                    ...event,
                    year: year,
                    month: month,
                    icon: icon,
                    color: color,
                    details: event.description || 'לא מוגדר תיאור מפורט לאירוע זה.'
                };
            }).sort((a, b) => new Date(a.date) - new Date(b.date)); // מיון לפי תאריך

            // יצירת רשימת שנים ייחודיות
            const years = [...new Set(processedEvents.map(event => event.year))].sort();

            const modal = document.createElement('div');
            modal.className = 'timeline-modal';
            modal.innerHTML = `
                <div class="timeline-content">
                    <div class="timeline-header">
                        <h2>ציר הזמן של מלחמת העולם השנייה</h2>
                        <p class="timeline-subtitle">האירועים המכריעים שעיצבו את ההיסטוריה • ${processedEvents.length} אירועים</p>
                    </div>
                    <div class="timeline-navigation">
                        <button class="timeline-nav-btn active" data-year="all">כל השנים</button>
                        ${years.map(year => `
                            <button class="timeline-nav-btn" data-year="${year}">${year}</button>
                        `).join('')}
                    </div>
                    <div class="timeline-container">
                        ${processedEvents.map((event, index) => `
                            <div class="timeline-item enhanced" data-year="${event.year}" data-index="${index}">
                            
                                <div class="timeline-content-item">
                                    <div class="timeline-date">
                                        <span class="year">${event.year}</span>
                                        <span class="month">${event.month}</span>
                                    </div>
                                    <h3>${event.title}</h3>
                                    ${event.country && event.country.name_he ? `<p class="timeline-location"> ${event.country.name_he}</p>` : ''}
                                    <button class="timeline-details-btn" data-index="${index}">קרא עוד</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="timeline-progress">
                        <div class="progress-line"></div>
                        <span class="progress-text">גלול למטה לראות עוד אירועים</span>
                    </div>
                    <button class="close-timeline">✕</button>
                </div>
            `;
            
            document.body.appendChild(modal);

            // הוספת אנימציית כניסה
            setTimeout(() => {
                modal.classList.add('timeline-modal-active');
            }, 10);

            // הוספת מאזין לכפתור הסגירה
            const closeButton = modal.querySelector('.close-timeline');
            closeButton.addEventListener('click', () => {
                modal.classList.remove('timeline-modal-active');
                setTimeout(() => modal.remove(), 300);
            });

            // הוספת מאזינים לכפתורי "קרא עוד"
            const detailButtons = modal.querySelectorAll('.timeline-details-btn');
            detailButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    const index = parseInt(e.target.dataset.index);
                    showEventDetails(processedEvents[index]);
                });
            });

            // הוספת מאזינים לכפתורי השנים
            const navButtons = modal.querySelectorAll('.timeline-nav-btn');
            navButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    const selectedYear = e.target.dataset.year;
                    filterTimelineByYear(selectedYear);
                    // עדכון כפתור פעיל
                    navButtons.forEach(btn => btn.classList.remove('active'));
                    e.target.classList.add('active');
                });
            });

            // אנימציית האירועים
            const timelineItems = modal.querySelectorAll('.timeline-item');
            timelineItems.forEach((item, index) => {
                setTimeout(() => {
                    item.classList.add('timeline-item-visible');
                }, index * 100);
            });
        })
        .catch(error => {
            // טיפול בשגיאות
            loadingModal.innerHTML = `
                <div class="timeline-content">
                    <div class="timeline-header">
                        <h2>שגיאה בטעינת האירועים</h2>
                        <p>אנא נסה שוב מאוחר יותר</p>
                        <button class="close-timeline" onclick="this.closest('.timeline-modal').remove()">סגור</button>
                    </div>
                </div>
            `;
            console.error('Error loading events:', error);
        });
}

function filterTimelineByYear(selectedYear) {
    const timelineItems = document.querySelectorAll('.timeline-item.enhanced');
    
    timelineItems.forEach(item => {
        const itemYear = item.dataset.year;
        
        if (selectedYear === 'all' || itemYear === selectedYear) {
            // הצגת האירוע
            item.style.display = 'block';
            setTimeout(() => {
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            }, 50);
        } else {
            // הסתרת האירוע
            item.style.opacity = '0';
            item.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                item.style.display = 'none';
            }, 300);
        }
    });
}

function showEventDetails(event) {
    const detailModal = document.createElement('div');
    detailModal.className = 'event-detail-modal';
    detailModal.innerHTML = `
        <div class="event-detail-content">
            <div class="event-header">
                <div class="event-title-section">
                    <h2>${event.title}</h2>
                    <p class="event-date">${event.month} ${event.year}</p>
                    ${event.country && event.country.name_he ? `<p class="event-location">${event.country.name_he}</p>` : ''}
                </div>
            </div>
            <div class="event-body">
                <div class="event-description-section">
                    <h4>תיאור האירוע</h4>
                    <p class="event-main-description">${event.description}</p>
                </div>
            </div>
            <button class="close-event-detail">סגור</button>
        </div>
    `;
    
    document.body.appendChild(detailModal);
    
    setTimeout(() => {
        detailModal.classList.add('event-detail-active');
    }, 10);

    // מאזין לסגירה
    const closeButton = detailModal.querySelector('.close-event-detail');
    closeButton.addEventListener('click', () => {
        detailModal.classList.remove('event-detail-active');
        setTimeout(() => detailModal.remove(), 300);
    });

    // סגירה בלחיצה על הרקע
    detailModal.addEventListener('click', (e) => {
        if (e.target === detailModal) {
            detailModal.classList.remove('event-detail-active');
            setTimeout(() => detailModal.remove(), 300);
        }
    });
}

function showEventsForYear(year) {
    // שיפור הפונקציה הקיימת
    console.log(`Showing detailed events for year ${year}`);
    // TODO: הוספת לוגיקה להצגת אירועים מפורטים לפי שנה
}

document.addEventListener("DOMContentLoaded", function () {
    const toggle = document.getElementById("dark-mode-toggle");
    toggle.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
    });
});