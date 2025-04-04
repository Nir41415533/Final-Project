// static/js/index.js

import { createMap } from "./mapSetup.js";
import { addCountriesLayer } from "./countryLayer.js";
import { setupModalClose } from "./modalHandler.js";


// מפתח MapTiler שלך
const MAPTILER_KEY = "a1se7rp3zc7WUUPq5C1F";

// טעינת אירועים כלליים (נשמרים ב־window לצורך שימוש עתידי)
function loadEvents() {
    fetch("/events/")
        .then(response => response.json())
        .then(events => {
            window.historicalEvents = events;
        })
        .catch(error => console.error("❌ שגיאה בטעינת אירועים:", error));
}

// קריאה לקובץ GeoJSON עם גבולות המדינות
function loadCountries(map) {
    fetch("https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json")
        .then(response => response.json())
        .then(countries => {
            window.geojsonLayer = addCountriesLayer(map, countries);
        })
        .catch(error => console.error("❌ שגיאה בטעינת מדינות:", error));
}

// הטענת המפה כשהמסמך מוכן
document.addEventListener("DOMContentLoaded", () => {
    const map = createMap(MAPTILER_KEY);
    if (!map) return;

    window.map = map; // נשמר למקרה שצריך בעתיד
    loadEvents();
    loadCountries(map);
    setupModalClose(map);
});
