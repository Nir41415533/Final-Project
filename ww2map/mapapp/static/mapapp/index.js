document.addEventListener("DOMContentLoaded", () => {
    const MAPTILER_KEY = "a1se7rp3zc7WUUPq5C1F";
    const southWest = L.latLng(-89.981557, -180);
    const northEast = L.latLng(89.993461, 180);
    const maxBounds = L.latLngBounds(southWest, northEast);

    const mapElement = document.getElementById("map");
    if (!mapElement) {
        console.error("❌ שגיאה: אלמנט המפה לא נמצא!");
        return;
    }

    const map = L.map("map", {
        center: [52.2298, 21.0122], // ורשה, פולין
        zoom: 3,
        minZoom: 3,
        maxZoom: 8,
        maxBounds: maxBounds,
        maxBoundsViscosity: 1.0
    });

    L.tileLayer(`https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`, {
        attribution: '© MapTiler'
    }).addTo(map);

    let historicalEvents = [];
    let countriesGeoJSON;
    let geojsonLayer;
    let currentMapView = null;
    let currentEvents = [];
    let currentSoldiers = [];
    let currentIndex = 0;

    function loadEvents() {
        fetch("/events/")
            .then(response => response.json())
            .then(events => {
                historicalEvents = events;
            })
            .catch(error => console.error("Error loading events:", error));
    }

    fetch("https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json")
        .then(response => response.json())
        .then(countries => {
            countriesGeoJSON = countries;
            addCountriesLayer();
        })
        .catch(error => console.error("Error loading countries:", error));

    function addCountriesLayer() {
        geojsonLayer = L.geoJSON(countriesGeoJSON, {
            style: countryStyle,
            onEachFeature: onEachCountryFeature
        }).addTo(map);
    }

    function countryStyle() {
        return {
            fillColor: "transparent",
            fillOpacity: 0,
            color: "#718096",
            weight: 1
        };
    }

    function onEachCountryFeature(feature, layer) {
        layer.on({
            mouseover: (e) => highlightCountry(e.target),
            mouseout: (e) => resetCountryStyle(e.target),
            click: () => handleCountryClick(feature)
        });
    }

    function highlightCountry(layer) {
        layer.setStyle({
            fillColor: "transparent",
            fillOpacity: 0,
            color: "#e53e3e",
            weight: 2
        });
    }

    function resetCountryStyle(layer) {
        geojsonLayer.resetStyle(layer);
    }

    function handleCountryClick(country) {
        const countryName = country.properties.name.trim().toLowerCase(); // English name from GeoJSON
        console.log("🔍 מדינה שנבחרה מהמפה:", countryName);
    
        const countryCodeMapping = {
            "afghanistan": "af", "albania": "al", "algeria": "dz", "andorra": "ad",
            "angola": "ao", "argentina": "ar", "armenia": "am", "australia": "au",
            "austria": "at", "azerbaijan": "az", "bangladesh": "bd", "belarus": "by",
            "belgium": "be", "brazil": "br", "canada": "ca", "china": "cn",
            "colombia": "co", "croatia": "hr", "cuba": "cu", "czech republic": "cz",
            "denmark": "dk", "egypt": "eg", "finland": "fi", "france": "fr",
            "germany": "de", "greece": "gr", "hungary": "hu", "india": "in",
            "indonesia": "id", "iran": "ir", "iraq": "iq", "ireland": "ie",
            "israel": "il", "italy": "it", "japan": "jp", "jordan": "jo",
            "kazakhstan": "kz", "kenya": "ke", "latvia": "lv", "lebanon": "lb",
            "libya": "ly", "lithuania": "lt", "luxembourg": "lu", "malaysia": "my",
            "mexico": "mx", "morocco": "ma", "netherlands": "nl", "new zealand": "nz",
            "nigeria": "ng", "norway": "no", "pakistan": "pk", "palestine": "ps",
            "peru": "pe", "philippines": "ph", "poland": "pl", "portugal": "pt",
            "qatar": "qa", "romania": "ro", "russia": "ru", "saudi arabia": "sa",
            "serbia": "rs", "singapore": "sg", "slovakia": "sk", "south africa": "za",
            "south korea": "kr", "spain": "es", "sri lanka": "lk", "sudan": "sd",
            "sweden": "se", "switzerland": "ch", "syria": "sy", "thailand": "th",
            "tunisia": "tn", "turkey": "tr", "ukraine": "ua", "united arab emirates": "ae",
            "united kingdom": "gb", "united states": "us", "venezuela": "ve", "vietnam": "vn",
            "yemen": "ye", "zambia": "zm", "zimbabwe": "zw"
        };
    
        // קבלת קוד המדינה להצגת הדגל
        const countryCode = countryCodeMapping[countryName] || "";
        const mapPlaceholder = document.getElementById("insetMapPlaceholder");
        if (mapPlaceholder) {
            mapPlaceholder.innerHTML = countryCode
                ? `<img src="https://flagcdn.com/w320/${countryCode}.png" alt="דגל ${countryName}">`
                : "מפת הקרב";
        }
    
        // תרגום שמות מדינות מאנגלית לעברית (כי הנתונים של החיילים בעברית)
        const countryTranslations = {
            "poland": "פולין",
            "france": "צרפת",
            "belgium": "בלגיה",
            "india": "הודו",
            "netherlands": "הולנד",
            "ukraine": "אוקראינה",
            "russia": "רוסיה",
            "germany": "גרמניה"
        };
    
        // מצא את השם בעברית עבור המדינה שנבחרה
        const translatedCountry = countryTranslations[countryName] || countryName;
    
        // שליפת הנתונים עבור המדינה שנבחרה
        Promise.all([
            fetch("/events/").then(response => response.json()),
            fetch("/soldiers/").then(response => response.json())
        ])
        .then(([events, soldiers]) => {
            const countryEvents = events.filter(ev => {
                const eventCountry = ev.country__name ? ev.country__name.trim().toLowerCase() : "";
                return eventCountry === countryName || eventCountry === translatedCountry;
            });
    
            console.log("📋 כל החיילים מהשרת:", soldiers);
            const countrySoldiers = soldiers.filter(soldier => {
                const soldierCountry = soldier.country ? soldier.country.trim().toLowerCase() : "";
                console.log(`🔎 בודק חייל: ${soldier.name || 'אלמוני'}, מדינה: ${soldierCountry}`);
                return soldierCountry === translatedCountry || 
                       soldierCountry.includes(translatedCountry) || 
                       soldierCountry === countryName || 
                       soldierCountry.includes(countryName);
            });
    
            console.log("🟢 אירועים במדינה שנבחרה:", countryEvents);
            console.log("🟢 לוחמים במדינה שנבחרה:", countrySoldiers);
    
            currentEvents = countryEvents;
            currentSoldiers = countrySoldiers;
            currentIndex = 0;
            showCountryEventsModal(country.properties.name, countryEvents, countrySoldiers);
        })
        .catch(error => console.error("❌ Error loading data:", error));
    }

    function showCountryEventsModal(countryName, events, soldiers) {
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
    
        // בדיקת קיום האלמנטים
        console.log("🔍 בודק אלמנטים ב-DOM:");
        console.log("modal:", modal);
        console.log("eventTitle:", eventTitle);
        console.log("imageElement:", imageElement);
        console.log("videoElement:", videoElement);
        console.log("eventsTableBody:", eventsTableBody);
        console.log("soldiersContainer:", soldiersContainer);
        console.log("soldiersTitle:", soldiersTitle);
    
        if (!eventTitle || !imageElement || !videoElement || !eventsTableBody || !soldiersContainer || !soldiersTitle) {
            console.error("❌ שגיאה: אחד או יותר מהאלמנטים ב-DOM חסרים!");
            return;
        }
    
        eventTitle.textContent = `אירועים ולוחמים ב-${countryName}`;
        
        // ניקוי תוכן קודם
        eventsTableBody.innerHTML = "";
        imageElement.style.display = "none";
        videoElement.style.display = "none";
        soldiersContainer.innerHTML = "";
    
        // מילוי טבלת אירועים
        if (events.length === 0) {
            eventsTableBody.innerHTML = `
                <tr><td colspan="2">אין אירועים במדינה זו</td></tr>
            `;
        } else {
            displayEvent(currentIndex);
        }
    
        // הצגת לוחמים
        console.log("🔍 מספר הלוחמים שנמצאו:", soldiers.length);
        soldiersTitle.style.display = soldiers.length > 0 ? "block" : "none";
        soldiersContainer.style.display = soldiers.length > 0 ? "block" : "none";
    
        if (soldiers.length === 0) {
            soldiersContainer.innerHTML = "<p>לא נמצאו לוחמים למדינה זו</p>";
        } else {
            console.log("🔍 מוסיף לוחמים ל-DOM:", soldiers);
            soldiers.forEach(soldier => {
                const soldierDiv = document.createElement("div");
                soldierDiv.classList.add("soldier");
                soldierDiv.innerHTML = soldier.image
                    ? `<img src="${soldier.image}" alt="${soldier.name || 'שם לא ידוע'}">`
                    : `<div class="soldier-placeholder">לוחם</div>`;
                soldierDiv.innerHTML += `<p class="soldier-name">${soldier.name || 'שם לא ידוע'}</p>`;
                soldierDiv.onclick = () => showSoldierDetails(soldier);
                soldiersContainer.appendChild(soldierDiv);
            });
            // Force a reflow to ensure the DOM updates
            soldiersContainer.offsetHeight; // Trigger reflow
            console.log("🔍 תוכן ה-soldiersContainer לאחר הוספה:", soldiersContainer.innerHTML);
        }
    
        modal.style.display = "block";
        console.log("🔍 המודאל אמור להיות גלוי כעת");
    }
    function displayEvent(index) {
        const eventsTableBody = document.getElementById("eventsTableBody");
        const imageElement = document.getElementById("eventImage");
        const videoElement = document.getElementById("eventVideo");
        const event = currentEvents[index];
        const converter = new showdown.Converter();

        eventsTableBody.innerHTML = `
            <tr class="country-event" data-event="${encodeURIComponent(JSON.stringify(event))}">
                <td class="duration">
                    <p class="join">
                        <span class="startDate">${event.date}</span><br>
                        <small>···· עד ····</small><br>
                        <span class="endDate">${event.endDate || event.date}</span>
                    </p>
                </td>
                <td class="summary">${converter.makeHtml(event.description)}</td>
            </tr>
            <tr>
                <td class="signatures">
                    <p class="loggedBy join">
                        <div class="signature-placeholder">חתימה</div>
                        <small class="loggedByLabel">מתועד ע"י</small>
                    </p>
                    <p class="approvedBy">
                        <div class="signature-placeholder">חתימה</div>
                        <small class="approvedByLabel">מאושר ע"י</small>
                    </p>
                    <div class="approved">
                        <span>★ ★ ★</span>
                        <p>מאושר</p>
                        <span>★ ★ ★</span>
                    </div>
                </td>
                <td></td>
            </tr>
        `;

        imageElement.src = event.image || "";
        imageElement.style.display = event.image ? "block" : "none";
        videoElement.src = event.video || "";
        videoElement.style.display = event.video ? "block" : "none";
    }

    window.showSingleEvent = function (element) {
        try {
            const event = JSON.parse(decodeURIComponent(element.getAttribute("data-event")));
            const modal = document.getElementById("eventModal");
            const eventsTableBody = document.getElementById("eventsTableBody");
            const imageElement = document.getElementById("eventImage");
            const videoElement = document.getElementById("eventVideo");
            const soldiersTitle = document.getElementById("soldiersTitle");
            const soldiersContainer = document.getElementById("soldiersContainer");

            document.getElementById("eventTitle").textContent = event.title;
            const converter = new showdown.Converter();
            eventsTableBody.innerHTML = `
                <tr>
                    <td class="duration">
                        <p class="join">
                            <span class="startDate">${event.date}</span><br>
                            <small>···· עד ····</small><br>
                            <span class="endDate">${event.endDate || event.date}</span>
                        </p>
                    </td>
                    <td class="summary">${converter.makeHtml(event.description)}</td>
                </tr>
                <tr>
                    <td class="signatures">
                        <p class="loggedBy join">
                            <div class="signature-placeholder">חתימה</div>
                            <small class="loggedByLabel">מתועד ע"י</small>
                        </p>
                        <p class="approvedBy">
                            <div class="signature-placeholder">חתימה</div>
                            <small class="approvedByLabel">מאושר ע"י</small>
                        </p>
                        <div class="approved">
                            <span>★ ★ ★</span>
                            <p>מאושר</p>
                            <span>★ ★ ★</span>
                        </div>
                    </td>
                    <td></td>
                </tr>
            `;

            imageElement.src = event.image || "";
            imageElement.style.display = event.image ? "block" : "none";
            videoElement.src = event.video || "";
            videoElement.style.display = event.video ? "block" : "none";

            soldiersTitle.style.display = "none";
            soldiersContainer.style.display = "none";

            modal.style.display = "block";
        } catch (error) {
            console.error("❌ Error parsing event data:", error);
        }
    };

    function showSoldierDetails(soldier) {
        console.log("🔵 לוחם שנבחר:", soldier);
        // כאן תוכל להוסיף מודאל נפרד או להציג פרטים נוספים
    }

    window.closeModal = function () {
        const modal = document.getElementById("eventModal");
        if (!modal) return;

        if (currentMapView) {
            map.setView(currentMapView, map.getZoom(), { animate: true, duration: 0.3 });
        }

        modal.style.display = "none";
        document.getElementById("eventImage").src = "";
        document.getElementById("eventVideo").src = "";
    };

    loadEvents();
});