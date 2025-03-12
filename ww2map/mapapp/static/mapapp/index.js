// מאזין לאירוע טעינת הדף - הקוד ירוץ רק לאחר שה-DOM נטען במלואו
document.addEventListener("DOMContentLoaded", () => {

    // הגדרת מפתח API לשירות MapTiler כדי לגשת לשכבות מפה (כמו רחובות)
    const MAPTILER_KEY = "a1se7rp3zc7WUUPq5C1F";

    // הגדרת גבולות גיאוגרפיים למפה כדי למנוע גלילה לאזורים לא רלוונטיים
    const southWest = L.latLng(-89.981557, -180); 
    const northEast = L.latLng(89.993461, 180);
    const maxBounds = L.latLngBounds(southWest, northEast); 

    // בדיקה אם אלמנט המפה קיים לפני יצירת המפה
    const mapElement = document.getElementById("map");
    if (!mapElement) {
        console.error("❌ שגיאה: אלמנט המפה לא נמצא!");
        return;
    }

    // יצירת המפה עם הגדרות בסיסיות
    const map = L.map("map", {
        center: [52.2298, 21.0122], // ורשה, פולין
        zoom: 3,
        minZoom: 3,
        maxZoom: 8,
        maxBounds: maxBounds,
        maxBoundsViscosity: 1.0
    });

    // הוספת שכבת מפת רקע של MapTiler
    L.tileLayer(`https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`, {
        attribution: '© MapTiler'
    }).addTo(map);

    // משתני מצב
    let historicalEvents = []; 
    let countriesGeoJSON; 
    let geojsonLayer; 
    let currentMapView = null; 

    // טעינת אירועים היסטוריים מהשרת
    function loadEvents() {
        fetch("/events/") 
            .then(response => response.json())
            .then(events => {
                historicalEvents = events;
            })
            .catch(error => console.error("Error loading events:", error));
    }

    // טעינת נתוני GeoJSON של גבולות מדינות
    fetch("https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json")
        .then(response => response.json())
        .then(countries => {
            countriesGeoJSON = countries;
            addCountriesLayer();
        })
        .catch(error => console.error("Error loading countries:", error));

    // הוספת שכבת GeoJSON של גבולות מדינות למפה
    function addCountriesLayer() {
        geojsonLayer = L.geoJSON(countriesGeoJSON, {
            style: countryStyle,
            onEachFeature: onEachCountryFeature
        }).addTo(map);
    }

    // סגנון ברירת מחדל לגבולות מדינות
    function countryStyle() {
        return {
            fillColor: "transparent",
            fillOpacity: 0,
            color: "#718096",
            weight: 1
        };
    }

    // הוספת אירועים לכל מדינה
    function onEachCountryFeature(feature, layer) {
        layer.on({
            mouseover: (e) => highlightCountry(e.target),
            mouseout: (e) => resetCountryStyle(e.target),
            click: () => handleCountryClick(feature)
        });
    }

    // הדגשת מדינה במעבר עכבר
    function highlightCountry(layer) {
        layer.setStyle({
            fillColor: "transparent",
            fillOpacity: 0,
            color: "#e53e3e",
            weight: 2
        });
    }

    // איפוס הסגנון של מדינה
    function resetCountryStyle(layer) {
        geojsonLayer.resetStyle(layer);
    }

    // טיפול בקליק על מדינה - הצגת אירועים ולוחמים
    function handleCountryClick(country) {
        const countryName = country.properties.name.trim().toLowerCase();
        console.log("🔍 מדינה שנבחרה מהמפה:", countryName);
    
        const countryTranslations = {
            "פולין": "poland",
            "צרפת": "france",
            "בלגיה": "belgium",
            "הודו": "india",
            "אמסטרדם": "netherlands",
            "נמירוב": "ukraine",
            "יקטרינוסלב": "russia",
            "ליבק": "germany"
        };
    
        const translatedCountry = Object.keys(countryTranslations).find(
            key => countryTranslations[key] === countryName
        ) || countryName;
    
        // ✅ טעינת האירועים + הלוחמים במקביל
        Promise.all([
            fetch("/events/").then(response => response.json()),
            fetch("/soldiers/").then(response => response.json())
        ])
        .then(([events, soldiers]) => {
            console.log("🔵 כל האירועים מהשרת:", events);
            console.log("🔵 כל הלוחמים מהשרת:", soldiers);
    
            const countryEvents = events.filter(ev =>
                ev.country__name.trim().toLowerCase() === countryName
            );
    
            const countrySoldiers = soldiers.filter(soldier => {
                let soldierCountry = soldier.country ? soldier.country.trim().toLowerCase() : "";
                return soldierCountry === translatedCountry || soldierCountry.includes(translatedCountry);
            });
    
            console.log("🟢 אירועים במדינה שנבחרה:", countryEvents);
            console.log("🟢 לוחמים במדינה שנבחרה:", countrySoldiers);
    
            showCountryEventsModal(country.properties.name, countryEvents, countrySoldiers);
        })
        .catch(error => console.error("❌ Error loading data:", error));
    }

    // הצגת מודל עם אירועים במדינה שנבחרה
    function showCountryEventsModal(countryName, events, soldiers) {
        const modal = document.getElementById("eventModal");
        document.getElementById("eventTitle").textContent = `אירועים ולוחמים ב-${countryName}`;
        document.getElementById("eventDate").textContent = "";

        // ✅ הצגת האירועים
        const eventsContent = events.length === 0
            ? "<p>אין אירועים במדינה זו</p>"
            : events.map(ev => 
                `<div class="country-event" onclick="showSingleEvent(this)" 
                    data-event="${encodeURIComponent(JSON.stringify(ev))}">
                    <h3>${ev.title}</h3>
                    <p>${ev.date}</p>
                </div>`).join("");

        document.getElementById("eventDescription").innerHTML = eventsContent;
        document.getElementById("eventImage").style.display = "none";
        document.getElementById("eventVideo").style.display = "none";

        // ✅ הצגת הלוחמים
        const soldiersContainer = document.getElementById("soldiersContainer");
        const soldiersTitle = document.getElementById("soldiersTitle"); // הכותרת

        soldiersContainer.innerHTML = ""; // מנקים כדי שלא תהיה כפילות
        soldiersContainer.style.display = soldiers.length > 0 ? "block" : "none"; // ✅ אם אין לוחמים - מסתירים

        if (soldiersTitle) {
            soldiersTitle.style.display = soldiers.length > 0 ? "block" : "none"; // ✅ הסתרת הכותרת אם אין לוחמים
        }

        // ✅ קריאה לפונקציה שמציגה את הלוחמים, כולל השמות
        displaySoldiersForCountry(soldiers);

        modal.style.display = "block";
    }

    // הצגת הלוחמים עם שמות מתחת לתמונות
    function displaySoldiersForCountry(soldiers) {
        const container = document.getElementById("soldiersContainer");
        container.innerHTML = "";

        if (soldiers.length === 0) {
            container.innerHTML = "<p>לא נמצאו לוחמים למדינה זו</p>";
            return;
        }

        soldiers.forEach(soldier => {
            console.log("🟢 לוחם שנוסף:", soldier.name, "| מדינה:", soldier.country); // ✅ בדיקה בקונסול

            const soldierDiv = document.createElement("div");
            soldierDiv.classList.add("soldier");

            // יצירת תמונה
            const img = document.createElement("img");
            img.src = soldier.image;
            img.alt = soldier.name;

            // יצירת שם הלוחם
            const nameParagraph = document.createElement("p");
            nameParagraph.classList.add("soldier-name");
            nameParagraph.textContent = soldier.name ? soldier.name : "שם לא ידוע"; // ✅ הצגת שם

            console.log("📌 שם הלוחם שנוסף:", nameParagraph.textContent); // ✅ בדיקה בקונסול

            // הוספת האלמנטים ללוחם
            soldierDiv.appendChild(img);
            soldierDiv.appendChild(nameParagraph); // ✅ הוספת שם מתחת לתמונה

            soldierDiv.onclick = () => showSoldierDetails(soldier);
            container.appendChild(soldierDiv);
        });
    }

    // הצגת פרטי לוחם (פונקציה ריקה כרגע - תצטרך למלא אותה לפי הצורך)
    function showSoldierDetails(soldier) {
        console.log("🔵 לוחם שנבחר:", soldier);
        // כאן תוכל להוסיף קוד להצגת פרטי הלוחם, למשל במודאל נפרד
    }

    // הצגת אירוע בודד
    window.showSingleEvent = function (element) {
        try {
            const event = JSON.parse(decodeURIComponent(element.getAttribute("data-event")));
            console.log("🔵 אירוע שנבחר:", event); // 🔥 בדיקה בקונסול

            const modal = document.getElementById("eventModal");

            document.getElementById("eventTitle").textContent = event.title;
            document.getElementById("eventDate").textContent = event.date;

            const converter = new showdown.Converter();
            document.getElementById("eventDescription").innerHTML = converter.makeHtml(event.description);

            const imgEl = document.getElementById("eventImage");
            imgEl.src = event.image ? event.image : "";
            imgEl.style.display = event.image ? "block" : "none";

            const videoEl = document.getElementById("eventVideo");
            videoEl.src = event.video || "";
            videoEl.style.display = event.video ? "block" : "none";

            // ❌ הסתרת הכותרת של הלוחמים במודאל של האירוע
            const soldiersTitle = document.getElementById("soldiersTitle");
            const soldiersContainer = document.getElementById("soldiersContainer");

            if (soldiersTitle) {
                soldiersTitle.style.display = "none"; // ✅ מחביאים את הכותרת
            }
            if (soldiersContainer) {
                soldiersContainer.style.display = "none"; // ✅ מחביאים גם את הרשימה
            }

            modal.style.display = "block";
        } catch (error) {
            console.error("❌ Error parsing event data:", error);
        }
    };

    // סגירת המודל
    window.closeModal = function () {
        const modal = document.getElementById("eventModal");
        const modalContent = document.querySelector(".modal-content");

        if (!modalContent) return;

        if (currentMapView) {
            map.setView(currentMapView, map.getZoom(), { animate: true, duration: 0.3 });
        }

        modalContent.classList.remove("event-active");
        modal.style.display = "none";
        document.getElementById("eventImage").src = "";
        document.getElementById("eventVideo").src = "";
    };

    // קריאה לטעינת האירועים בעת טעינת הדף
    loadEvents();
});