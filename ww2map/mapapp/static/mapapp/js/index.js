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

// Loading screen elements
const loadingScreen = document.getElementById('loadingScreen');
const progressBar = document.getElementById('progressBar');
const loadingText = document.getElementById('loadingText');

// Loading progress tracking
let loadingProgress = 0;
const loadingSteps = [
    { weight: 30, message: 'טוען נתוני מפה...' },
    { weight: 20, message: 'מכין שכבות...' },
    { weight: 30, message: 'טוען אירועים...' },
    { weight: 20, message: 'מסיים טעינה...' }
];

function updateLoadingProgress(step, progress) {
    const stepIndex = loadingSteps.findIndex((s, i) => i === step);
    if (stepIndex === -1) return;

    const previousProgress = loadingSteps
        .slice(0, stepIndex)
        .reduce((sum, step) => sum + step.weight, 0);
    
    const stepProgress = (progress / 100) * loadingSteps[stepIndex].weight;
    loadingProgress = previousProgress + stepProgress;

    // Update UI
    progressBar.style.width = `${loadingProgress}%`;
    loadingText.textContent = loadingSteps[stepIndex].message;
}

function hideLoadingScreen() {
    loadingScreen.classList.add('fade-out');
    setTimeout(() => {
        loadingScreen.style.display = 'none';
    }, 500);
}

// Initialize map with loading screen
function initializeMap() {
    updateLoadingProgress(0, 0);
    
    // Initialize map with original configuration
    const map = new maplibregl.Map({
        container: 'map',
        style: 'https://api.maptiler.com/maps/66aaf810-42b4-405e-b738-f7b427aa3adc/style.json?key=id6E01naKP3UCWgW7hY1',
        center: [31.0461, 34.8516],
        zoom: 3,
        interactive: true,
        maxBounds: [
            [-170, -60],
            [170, 85]
        ]
    });

    // Track map loading progress
    map.on('styledata', () => updateLoadingProgress(0, 100));
    map.on('sourcedataloading', () => updateLoadingProgress(1, 50));
    map.on('sourcedata', () => updateLoadingProgress(1, 100));
    map.on('dataloading', () => updateLoadingProgress(2, 50));
    map.on('data', () => updateLoadingProgress(2, 100));
    
    map.on('load', () => {
        updateLoadingProgress(3, 100);
        setTimeout(hideLoadingScreen, 500);
        
        console.log("✅ המפה מוכנה, טוען שכבות...");
        loadEvents();
        loadCountries(map);
        setupModalClose(map);
    });

    // Add error handling
    map.on('error', (e) => {
        loadingText.textContent = 'שגיאה בטעינת המפה';
        loadingText.style.color = '#e74c3c';
        console.error('Map loading error:', e);
    });
}

// Start initialization when document is ready
document.addEventListener('DOMContentLoaded', initializeMap);
