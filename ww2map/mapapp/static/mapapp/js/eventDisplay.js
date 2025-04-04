// js/eventDisplay.js

export function displayEvent(index) {
    const eventsTableBody = document.getElementById("eventsTableBody");
    const imageElement = document.getElementById("eventImage");
    const videoElement = document.getElementById("eventVideo");
    const event = window.currentEvents[index]; // חשוב שיהיה window.currentEvents

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
