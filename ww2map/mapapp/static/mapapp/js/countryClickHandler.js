import { showCountryEventsModal } from "./modalHandler.js";
import { countryCodeMapping } from "./countryCodeMapping.js"; // אם אתה עדיין משתמש בזה

export function handleCountryClick(country) {
    const name = country.properties?.name;

    if (!name || typeof name !== "string") {
        console.warn("⚠️ לא נמצא שם מדינה תקף בפיצ'ר:", country.properties);
        return;
    }

    const countryName = name.trim().toLowerCase();

    console.log("🔍 מדינה שנבחרה מהמפה:", countryName);

    // דגל לפי השם באנגלית
    const countryCode = countryCodeMapping[countryName] || "";
    const mapPlaceholder = document.getElementById("insetMapPlaceholder");
    if (mapPlaceholder) {
        mapPlaceholder.innerHTML = countryCode
            ? `<img src="https://flagcdn.com/w320/${countryCode}.png" alt="דגל ${name}">`
            : "מפת הקרב";
    }

    Promise.all([
        fetch("/events/").then(res => res.json()),
        fetch("/soldiers/").then(res => res.json())
    ])
    .then(([events, soldiers]) => {
        const countryEvents = events.filter(ev => {
            const eventCountry = ev.country__name_en?.trim().toLowerCase() || "";
            return eventCountry === countryName;
        });

        const countrySoldiers = soldiers.filter(soldier => {
            const soldierCountry = soldier.country?.toLowerCase().trim() || "";
            return soldierCountry === countryName;
        });

        console.log("🟢 חיילים שנמצאו:", countrySoldiers);
        console.log("🟢 אירועים במדינה:", countryEvents);
        console.log("🟢 לוחמים במדינה:", countrySoldiers);

        window.currentEvents = countryEvents;
        window.currentSoldiers = countrySoldiers;
        window.currentIndex = 0;

        showCountryEventsModal(name, countryEvents, countrySoldiers);
    })
    .catch(error => {
        console.error("❌ שגיאה בטעינת נתונים:", error);
    });
}
