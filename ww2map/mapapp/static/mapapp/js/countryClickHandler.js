// js/countryClickHandler.js
import { countryCodeMapping } from "./countryCodeMapping.js";
import { showCountryEventsModal } from "./modalHandler.js";

export function handleCountryClick(country) {
    const countryName = country.properties.name.trim().toLowerCase();

    // אם יש תיקון לשם – השתמש בו
    const nameFixes = {
        "united states of america": "usa"
    };
    const fixedCountryName = nameFixes[countryName] || countryName;

    console.log("🔍 מדינה שנבחרה מהמפה:", countryName);

    // דגל
    const countryCode = countryCodeMapping[countryName] || "";
    const mapPlaceholder = document.getElementById("insetMapPlaceholder");
    if (mapPlaceholder) {
        mapPlaceholder.innerHTML = countryCode
            ? `<img src="https://flagcdn.com/w320/${countryCode}.png" alt="דגל ${countryName}">`
            : "מפת הקרב";
    }

    Promise.all([
        fetch("/events/").then(res => res.json()),
        fetch("/soldiers/").then(res => res.json())
    ])
    .then(([events, soldiers]) => {
        const countryEvents = events.filter(ev => {
            const eventCountry = ev.country__name?.trim().toLowerCase() || "";
            return eventCountry === fixedCountryName;
        });

        const countrySoldiers = soldiers.filter(soldier => {
            const soldierCountry = soldier.country?.trim().toLowerCase() || "";
            return soldierCountry === fixedCountryName || soldierCountry.includes(fixedCountryName);
        });

        console.log("🟢 אירועים במדינה שנבחרה:", countryEvents);
        console.log("🟢 לוחמים במדינה שנבחרה:", countrySoldiers);

        window.currentEvents = countryEvents;
        window.currentSoldiers = countrySoldiers;
        window.currentIndex = 0;

        showCountryEventsModal(country.properties.name, countryEvents, countrySoldiers);
    })
    .catch(error => console.error("❌ שגיאה בטעינת נתונים:", error));
}
