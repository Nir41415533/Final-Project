// js/mapSetup.js
export function createMap(MAPTILER_KEY) {
    const southWest = L.latLng(-89.981557, -180);
    const northEast = L.latLng(89.993461, 180);
    const maxBounds = L.latLngBounds(southWest, northEast);

    const mapElement = document.getElementById("map");
    if (!mapElement) {
        console.error("❌ שגיאה: אלמנט המפה לא נמצא!");
        return null;
    }

    const map = L.map("map", {
        center: [52.2298, 21.0122],
        zoom: 3,
        minZoom: 3,
        maxZoom: 8,
        maxBounds: maxBounds,
        maxBoundsViscosity: 1.0
    });

    L.tileLayer(`https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`, {
        attribution: '© MapTiler'
    }).addTo(map);

    return map;
}
