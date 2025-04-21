import { showCountryEventsModal } from "./modalHandler.js";
import { countryCodeMapping } from "./countryCodeMapping.js"; // אם אתה עדיין משתמש בזה


//מטפל בלחיצות על מדינות במפה
//מקבל את שם המדינה וקוד המדינה
//מעדכן את המודאל עם המידע הרלוונטי
export function handleCountryClick(country) {
    //מטפל בלחיצות על מדינות במפה
    const name = country.properties?.name;
    //אם אין שם מדינה או שהוא לא מחרוזת, מדגים שגיאה
    if (!name || typeof name !== "string") {
        console.warn("⚠️ לא נמצא שם מדינה תקף בפיצ'ר:", country.properties);
        return;
    }

    const countryName = name.trim().toLowerCase();
    console.log("🔍 מדינה שנבחרה מהמפה:", countryName);

 
    const countryCode = countryCodeMapping[countryName] || "";
  
    const mapPlaceholder = document.getElementById("insetMapPlaceholder");
    //אם יש דגל, מציג את הדגל
    if (mapPlaceholder) {
        mapPlaceholder.innerHTML = countryCode
            ? `<img src="https://flagcdn.com/w320/${countryCode}.png" alt="flag of ${name}">`
            : "מפת הקרב";
    }
    //send request to get events and soldiers from the server 
    Promise.all([
        fetch("/events/").then(res => res.json()),
        fetch("/soldiers/").then(res => res.json())
    ])
    .then(([events, soldiers]) => {
        //filter events by country name
        const countryEvents = events.filter(ev => {
            const eventCountry = (ev.country__name || "").trim().toLowerCase();
            const countryName = name.toLowerCase();
            // בדיקה מדויקת של שם המדינה
            return eventCountry === countryName;
        });
        //filter soldiers by country name
        const countrySoldiers = soldiers.filter(soldier => {
            const soldierCountry = (soldier.country || "").toLowerCase().trim();
            return soldierCountry === countryName;
        });

        console.log("🟢 אירועים שנמצאו:", countryEvents);
        console.log("🟢 חיילים שנמצאו:", countrySoldiers);

        //set the events and soldiers to the modal
        window.currentEvents = countryEvents;
        window.currentSoldiers = countrySoldiers;
        window.currentIndex = 0;

        //show the modal
        showCountryEventsModal(name, countryEvents, countrySoldiers);
    })
    .catch(error => {
        //if there is an error, show the error
        console.error("❌ שגיאה בטעינת נתונים:", error);
    });
}
