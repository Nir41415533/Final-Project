import { createMap } from "./mapSetup.js";
import { addCountriesLayer } from "./countryLayer.js";
import { setupModalClose } from "./modalHandler.js";

// מפתח MapTiler שלך
const MAPTILER_KEY = "id6E01naKP3UCWgW7hY1";

// טוען אירועים
function loadEvents() {
    fetch("/events/")
        .then(response => response.json())
        .then(events => {
            window.historicalEvents = events;
        })
        .catch(error => console.error("❌ שגיאה בטעינת אירועים:", error));
}

// טוען מדינות
function loadCountries(map) {
    fetch("https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson")
        .then(response => response.json())
        .then(countries => {
            window.geojsonLayer = addCountriesLayer(map, countries);
        })
        .catch(error => console.error("❌ שגיאה בטעינת מדינות:", error));
}

window.addEventListener("load", () => {
    const map = createMap(MAPTILER_KEY);
    if (!map) return;

    window.map = map;

    map.on("load", () => {
        console.log("✅ המפה מוכנה, טוען שכבות...");
        loadEvents();
        loadCountries(map);  // ✅ תמתין עד שהמפה מוכנה לפני שאתה מוסיף שכבת מדינות
        setupModalClose(map);
    });
});
