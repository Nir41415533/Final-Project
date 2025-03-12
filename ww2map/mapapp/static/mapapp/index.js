// מאזין לאירוע טעינת הדף - הקוד ירוץ רק לאחר שה-DOM נטען במלואו
document.addEventListener("DOMContentLoaded", () => {

    // הגדרת מפתח API לשירות MapTiler כדי לגשת לשכבות מפה (כמו רחובות)
    const MAPTILER_KEY = "a1se7rp3zc7WUUPq5C1F";
    
    // הגדרת גבולות גיאוגרפיים למפה כדי למנוע גלילה לאזורים לא רלוונטיים (פינות העולם)
    const southWest = L.latLng(-89.981557, -180); // נקודה דרום-מערבית
    const northEast = L.latLng(89.993461, 180);   // נקודה צפון-מזרחית
    const maxBounds = L.latLngBounds(southWest, northEast); // יצירת גבולות מפה

    // יצירת מפה באמצעות Leaflet, הגדרת מרכז התצוגה ההתחלתי (ורשה, פולין), זום וגבולות
    const map = L.map("map", {
        center: [52.2298, 21.0122], // מרכז המפה - קואורדינטות של ורשה
        zoom: 3,  // רמת זום התחלתית (רחוק יחסית)
        minZoom: 3, // זום מינימלי (מונע התרחקות מוגזמת)
        maxZoom: 8, // זום מקסימלי (מונע התקרבות מוגזמת)
        maxBounds: maxBounds, // מגביל את תנועת המפה לגבולות שהוגדרו
        maxBoundsViscosity: 1.0 // מונע גלילה מחוץ לגבולות בצורה חלקה
    });

    // הוספת שכבת מפת רקע של MapTiler (מפת רחובות) למפה עם קרדיט ליוצרים
    L.tileLayer(`https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`, {
        attribution: '© MapTiler' // קרדיט חובה ל-MapTiler
    }).addTo(map);

    // הגדרת אלמנטים מה-DOM לשימוש בקוד (ציר זמן, תצוגת שנה נוכחית)
    const timeline = document.getElementById("timeline"); // אלמנט סליידר של ציר הזמן
    const currentYear = document.getElementById("current-year"); // אלמנט לתצוגת השנה הנוכחית

    // משתני מצב לשמירת נתונים שונים
    let historicalEvents = []; // מערך לאחסון אירועים היסטוריים
    let countriesGeoJSON; // משתנה לאחסון נתוני GeoJSON של מדינות (גבולות גיאוגרפיים)
    let geojsonLayer; // שכבת GeoJSON שתציג את גבולות המדינות על המפה
    let currentMapView = null; // משתנה לשמירת תצוגת המפה הנוכחית (מרכז וזום)

    // פונקציה לטעינת אירועים היסטוריים מהשרת באמצעות בקשת Fetch
    function loadEvents() {
        fetch("/events/") // שליחת בקשה לשרת לקבלת נתוני אירועים
            .then(response => response.json()) // המרת התגובה לפורמט JSON
            .then(events => {
                historicalEvents = events; // שמירת האירועים במשתנה הגלובלי
                updateMap(timeline.value); // עדכון המפה לפי השנה שנבחרה בציר הזמן
            })
            .catch(error => console.error("Error loading events:", error)); // טיפול בשגיאות אם הבקשה נכשלה
    }

    // טעינת נתוני GeoJSON של גבולות מדינות ממקור חיצוני באמצעות Fetch
    fetch("https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json")
        .then(response => response.json()) // המרת התגובה לפורמט JSON
        .then(countries => {
            countriesGeoJSON = countries; // שמירת נתוני המדינות במשתנה הגלובלי
            addCountriesLayer(); // הוספת שכבת גבולות מדינות למפה
        })
        .catch(error => console.error("Error loading countries:", error)); // טיפול בשגיאות אם הבקשה נכשלה

    // פונקציה להוספת שכבת GeoJSON של גבולות מדינות למפה
    function addCountriesLayer() {
        geojsonLayer = L.geoJSON(countriesGeoJSON, {
            style: countryStyle, // הגדרת סגנון ויזואלי לגבולות המדינות
            onEachFeature: onEachCountryFeature // הגדרת אירועים (מעבר עכבר, קליק) לכל מדינה
        }).addTo(map); // הוספת השכבה למפה
    }

    // פונקציה להגדרת סגנון ברירת מחדל לגבולות מדינות
    function countryStyle() {
        return {
            fillColor: "transparent", // צבע מילוי שקוף (ללא מילוי)
            fillOpacity: 0, // אטימות מילוי (שקוף לחלוטין)
            color: "#718096", // צבע קווי הגבול (אפור כהה)
            weight: 1 // עובי קווי הגבול (דק)
        };
    }

    // פונקציה להגדרת אירועים (מעבר עכבר, קליק) עבור כל מדינה בשכבת GeoJSON
    function onEachCountryFeature(feature, layer) {
        layer.on({
            mouseover: (e) => highlightCountry(e.target), // הדגשת מדינה במעבר עכבר
            mouseout: (e) => resetCountryStyle(e.target), // איפוס סגנון המדינה כשיוצאים ממנה
            click: () => handleCountryClick(feature) // טיפול בקליק על מדינה (הצגת אירועים)
        });
    }

    // פונקציה להדגשת מדינה כאשר העכבר עובר מעליה
    function highlightCountry(layer) {
        layer.setStyle({
            fillColor: "transparent", // שמירה על מילוי שקוף
            fillOpacity: 0, // שמירה על אטימות שקופה
            color: "#e53e3e", // שינוי צבע הגבול לאדום
            weight: 2 // הגדלת עובי הגבול להדגשה
        });
    }

    // פונקציה לאיפוס הסגנון של מדינה לברירת המחדל כאשר העכבר יוצא ממנה
    function resetCountryStyle(layer) {
        geojsonLayer.resetStyle(layer); // החזרת הסגנון המקורי של המדינה
    }

    // פונקציה לטיפול בקליק על מדינה - מציגה אירועים היסטוריים עבור אותה מדינה ושנה
    function handleCountryClick(country) {
        const year = parseInt(timeline.value, 10); // קבלת השנה הנוכחית מציר הזמן
        const countryName = country.properties.name.trim().toLowerCase(); // שם המדינה (מנורמל לטיפול בשגיאות)
        const countryEvents = historicalEvents.filter(ev =>
            ev.date.startsWith(year.toString()) && // סינון אירועים שמתחילים בשנה הזו
            ev.country__name.trim().toLowerCase() === countryName // סינון לפי שם המדינה
        ); // מערך של אירועים רלוונטיים
        showCountryEventsModal(country.properties.name, year, countryEvents); // הצגת מודל עם האירועים
    }

    // פונקציה להצגת מודל (חלון קופץ) עם רשימת אירועים עבור מדינה מסוימת ושנה
    function showCountryEventsModal(countryName, year, events) {
        const modal = document.getElementById("eventModal"); // קבלת אלמנט המודל מה-DOM
        document.getElementById("eventTitle").textContent = `Events in ${countryName} - ${year}`; // עדכון כותרת המודל
        document.getElementById("eventDate").textContent = ""; // איפוס שדה התאריך במודל

        const content = events.length === 0
            ? "<p>No events found for this year</p>" // הודעה אם אין אירועים לשנה זו
            : events.map(ev => 
                // יצירת HTML לכל אירוע, כולל כותרת ותאריך, עם אפשרות קליק להצגת פרטים מלאים
                `<div class="country-event" onclick="showSingleEvent(this)" data-event="${encodeURIComponent(JSON.stringify(ev))}">
                    <h3>${ev.title}</h3>
                    <p>${ev.date}</p>
                </div>`
            ).join(""); // שילוב כל האירועים ל-HTML אחד

        document.getElementById("eventDescription").innerHTML = content; // עדכון תיאור האירועים במודל
        document.getElementById("eventImage").style.display = "none"; // הסתרת אלמנט התמונה
        document.getElementById("eventVideo").style.display = "none"; // הסתרת אלמנט הווידאו
        modal.style.display = "block"; // הצגת המודל על המסך
    }

    // פונקציה להצגת פרטים מלאים של אירוע בודד במודל (נקראת מקליק על אירוע ברשימה)
    window.showSingleEvent = function (element) {
        try {
            const event = JSON.parse(decodeURIComponent(element.getAttribute("data-event"))); // פענוח נתוני האירוע מה-HTML
            console.log("Received event:", event); // הדפסת נתוני האירוע לקונסולה לצורך דיבאגינג

            const modal = document.getElementById("eventModal"); // קבלת אלמנט המודל
            const modalContent = document.querySelector(".modal-content"); // קבלת תוכן המודל

            if (!modalContent) return; // אם תוכן המודל לא קיים, הפונקציה נעצרת

            if (event.lat && event.lng) { // אם יש קואורדינטות לאירוע
                currentMapView = map.getCenter(); // שמירת תצוגת המפה הנוכחית לפני שינוי
                map.setView([event.lat, event.lng], 6, { animate: true, duration: 0.5 }); // מעבר למיקום האירוע על המפה
            }

            const converter = new showdown.Converter(); // יצירת ממיר Markdown ל-HTML
            document.getElementById("eventTitle").textContent = event.title; // עדכון כותרת המודל
            document.getElementById("eventDate").textContent = `${event.date} - ${event.location}`; // עדכון תאריך ומיקום
            document.getElementById("eventDescription").innerHTML = converter.makeHtml(event.description); // המרת תיאור ה-Markdown ל-HTML

            const imgEl = document.getElementById("eventImage"); // קבלת אלמנט התמונה
            imgEl.src = event.image ? `/static/mapapp/images/${event.image}` : ""; // טעינת תמונה אם קיימת
            imgEl.style.display = event.image ? "block" : "none"; // הצגה/הסתרה של התמונה לפי קיום תמונה

            const videoEl = document.getElementById("eventVideo"); // קבלת אלמנט הווידאו
            videoEl.src = event.video || ""; // טעינת וידאו אם קיים
            videoEl.style.display = event.video ? "block" : "none"; // הצגה/הסתרה של הווידאו לפי קיום וידאו

            modalContent.classList.add("event-active"); // הוספת מחלקה לסגנון פעיל של המודל
            modal.style.display = "block"; // הצגת המודל על המסך

        } catch (error) {
            console.error("Error parsing event data:", error); // טיפול בשגיאות אם פענוח האירוע נכשל
        }
    };

    // פונקציה לסגירת המודל
    window.closeModal = function () {
        const modal = document.getElementById("eventModal"); // קבלת אלמנט המודל
        const modalContent = document.querySelector(".modal-content"); // קבלת תוכן המודל

        if (!modalContent) return; // אם תוכן המודל לא קיים, הפונקציה נעצרת

        if (currentMapView) { // אם יש תצוגת מפה שמורה
            map.setView(currentMapView, map.getZoom(), { animate: true, duration: 0.3 }); // חזרה לתצוגה הקודמת של המפה
        }

        modalContent.classList.remove("event-active"); // הסרת מחלקה פעילה מהמודל
        modal.style.display = "none"; // הסתרת המודל
        document.getElementById("eventImage").src = ""; // איפוס מקור התמונה
        document.getElementById("eventVideo").src = ""; // איפוס מקור הווידאו
    };

    // פונקציה לעדכון המפה לפי שנה נבחרת בציר הזמן
    function updateMap(year) {
        currentYear.textContent = year; // עדכון תצוגת השנה הנוכחית ב-DOM
        currentMapView = map.getCenter(); // שמירת תצוגת המפה הנוכחית

        map.eachLayer(layer => { // לולאה על כל השכבות במפה
            if (layer instanceof L.Marker) map.removeLayer(layer); // הסרת כל הסמנים הקיימים
        });

        historicalEvents
            .filter(ev => ev.year === parseInt(year)) // סינון אירועים לפי השנה שנבחרה
            .forEach(ev => {
                L.marker([ev.lat, ev.lng]) // הוספת סמן על המפה לכל אירוע
                    .addTo(map)
                    .bindPopup(`<h3>${ev.title}</h3><p>${ev.date}</p><p>${ev.description}</p>`); // חלונית מידע שמופיעה בלחיצה על הסמן
            });
    }

    // מאזין לשינוי ערך בציר הזמן - מעדכן את המפה לפי השנה שנבחרה
    timeline.addEventListener("input", (e) => updateMap(e.target.value));
    
    // מאזין לכפתור "שנה קודמת" - מפחית את השנה בציר הזמן ועדכן את המפה
    document.getElementById("prev-year").addEventListener("click", () => {
        timeline.value = Math.max(1939, timeline.valueAsNumber - 1); // הגבלה לשנת 1939 כמינימום
        updateMap(timeline.value); // עדכון המפה לשנה החדשה
    });
    
    // מאזין לכפתור "שנה הבאה" - מגדיל את השנה בציר הזמן ועדכן את המפה
    document.getElementById("next-year").addEventListener("click", () => {
        timeline.value = Math.min(1945, timeline.valueAsNumber + 1); // הגבלה לשנת 1945 כמקסימום
        updateMap(timeline.value); // עדכון המפה לשנה החדשה
    });

    // קריאה לפונקציה לטעינת האירועים בעת טעינת הדף
    loadEvents();
});