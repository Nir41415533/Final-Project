import { handleCountryClick } from "./countryClickHandler.js";

export function addCountriesLayer(map, countriesGeoJSON) {
    map.addSource("countries", {
        type: "geojson",
        data: countriesGeoJSON
    });

    map.addLayer({
        id: "countries-fill",
        type: "fill",
        source: "countries",
        paint: {
            "fill-color": "#ffffff",
            "fill-opacity": 0
        }
    });

    map.addLayer({
        id: "countries-outline",
        type: "line",
        source: "countries",
        paint: {
            "line-color": "#718096",
            "line-width": 1
        }
    });

    map.addSource("highlighted-country", {
        type: "geojson",
        data: {
            type: "FeatureCollection",
            features: []
        }
    });

    map.addLayer({
        id: "highlight-fill",
        type: "fill",
        source: "highlighted-country",
        paint: {
            "fill-color": "#e53e3e",
            "fill-opacity": 0.2
        }
    });

    map.addLayer({
        id: "highlight-outline",
        type: "line",
        source: "highlighted-country",
        paint: {
            "line-color": "#e53e3e",
            "line-width": 2
        }
    });

    let currentHighlightedId = null;

    map.on("mousemove", "countries-fill", (e) => {
        const feature = e.features?.[0];
        if (feature) {
            const countryName = feature.properties?.name;
            if (!countryName || currentHighlightedId === countryName) return;

            currentHighlightedId = countryName;
            map.getCanvas().style.cursor = "pointer";

            const sameCountryFeatures = countriesGeoJSON.features.filter(f =>
                f.properties?.name === countryName
            );

            map.getSource("highlighted-country").setData({
                type: "FeatureCollection",
                features: sameCountryFeatures
            });
        }
    });

    map.on("mouseleave", "countries-fill", () => {
        map.getCanvas().style.cursor = "";
        currentHighlightedId = null;
        map.getSource("highlighted-country").setData({
            type: "FeatureCollection",
            features: []
        });
    });

    map.on("click", "countries-fill", (e) => {
        const feature = e.features?.[0];
        if (feature) {
            const countryName = feature.properties?.name;

            const sameCountryFeatures = countriesGeoJSON.features.filter(f =>
                f.properties?.name === countryName
            );

            const mainFeature = sameCountryFeatures.find(f => f.properties?.name);

            if (mainFeature) {
                console.log("🟢 שולח ל־handleCountryClick:", mainFeature.properties);
                handleCountryClick(mainFeature);
            } else {
                console.warn("⚠️ לא נמצא פיצ'ר עם name:", sameCountryFeatures);
            }
        }
    });
}
