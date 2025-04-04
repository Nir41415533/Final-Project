// js/countryLayer.js
import { handleCountryClick } from "./countryClickHandler.js";

export function addCountriesLayer(map, countriesGeoJSON) {
    const geojsonLayer = L.geoJSON(countriesGeoJSON, {
        style: countryStyle,
        onEachFeature: onEachCountryFeature
    }).addTo(map);

    function onEachCountryFeature(feature, layer) {
        layer.on({
            mouseover: (e) => highlightCountry(e.target),
            mouseout: (e) => geojsonLayer.resetStyle(e.target),
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

    function countryStyle() {
        return {
            fillColor: "transparent",
            fillOpacity: 0,
            color: "#718096",
            weight: 1
        };
    }

    return geojsonLayer;
}
