import { createMap } from "./mapSetup.js";
import { addCountriesLayer } from "./countryLayer.js";
import { setupModalClose, showCountryEventsModal } from "./modalHandler.js";
import { countryCodeMapping } from "./countryCodeMapping.js";

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

// Search functionality
const countrySearch = document.getElementById('countrySearch');
const searchButton = document.getElementById('searchButton');
const searchResults = document.getElementById('searchResults');
const searchContainer = document.querySelector('.search-container');

// List of countries with their Hebrew names - using the most relevant countries from our countryCodeMapping
const countries = {
    'איראן': 'iran',
    'עיראק': 'iraq',
    'סוריה': 'syria',
    'לבנון': 'lebanon',
    'ירדן': 'jordan',
    'מצרים': 'egypt',
    'לוב': 'libya',
    'תוניסיה': 'tunisia',
    'אלג\'יריה': 'algeria',
    'מרוקו': 'morocco',
    'גרמניה': 'germany',
    'צרפת': 'france',
    'איטליה': 'italy',
    'בריטניה': 'united kingdom',
    'ארצות הברית': 'united states of america',
    'פולין': 'poland',
    'רוסיה': 'russia',
    'אוקראינה': 'ukraine',
    'רומניה': 'romania',
    'הונגריה': 'hungary',
    'יוון': 'greece',
    'צ\'כיה': 'czech republic',
    'סלובקיה': 'slovakia',
    'אוסטריה': 'austria',
    'בלגיה': 'belgium',
    'הולנד': 'netherlands',
    'נורבגיה': 'norway',
    'דנמרק': 'denmark',
    'שוודיה': 'sweden',
    'פינלנד': 'finland',
    'ספרד': 'spain',
    'פורטוגל': 'portugal',
    'שווייץ': 'switzerland',
    'יפן': 'japan',
    'סין': 'china',
    'אוסטרליה': 'australia',
    'קנדה': 'canada',
    'דרום אפריקה': 'south africa',
    'ישראל': 'israel',
    'טורקיה': 'turkey'
};

function performSearch() {
    const searchTerm = countrySearch.value.toLowerCase();
    if (searchTerm.length < 1) {
        searchResults.style.display = 'none';
        return;
    }
    
    const results = Object.keys(countries).filter(country => 
        country.toLowerCase().includes(searchTerm)
    );
    
    displayResults(results);
}

function displayResults(results) {
    searchResults.innerHTML = '';
    
    if (results.length === 0) {
        searchResults.style.display = 'none';
        return;
    }
    
    results.forEach(country => {
        const div = document.createElement('div');
        div.textContent = country;
        div.addEventListener('click', () => {
            selectCountry(country);
        });
        searchResults.appendChild(div);
    });
    
    searchResults.style.display = 'block';
}

function selectCountry(country) {
    const countryCode = countries[country];
    openCountryModal(countryCode, country);
    searchResults.style.display = 'none';
    countrySearch.value = country; // Set search input to selected country
    
    // Add animation
    const searchContainer = document.querySelector('.search-input-container');
    searchContainer.style.boxShadow = '0 0 0 2px #4285F4';
    setTimeout(() => {
        searchContainer.style.boxShadow = '';
    }, 800);
}

// Event listeners
if (countrySearch) {
    // Show results when input receives focus
    countrySearch.addEventListener('focus', () => {
        if (countrySearch.value.length > 0) {
            performSearch();
        }
    });
    
    // Perform search as user types
    countrySearch.addEventListener('input', performSearch);
    
    // Handle keyboard navigation
    countrySearch.addEventListener('keydown', (e) => {
        const resultItems = searchResults.querySelectorAll('div');
        const currentActiveIndex = [...resultItems].findIndex(item => item.classList.contains('active'));
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                if (resultItems.length > 0) {
                    const nextIndex = currentActiveIndex >= 0 && currentActiveIndex < resultItems.length - 1 ? 
                        currentActiveIndex + 1 : 0;
                    
                    resultItems.forEach(item => item.classList.remove('active'));
                    resultItems[nextIndex].classList.add('active');
                    resultItems[nextIndex].scrollIntoView({ block: 'nearest' });
                }
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                if (resultItems.length > 0) {
                    const prevIndex = currentActiveIndex > 0 ? 
                        currentActiveIndex - 1 : resultItems.length - 1;
                    
                    resultItems.forEach(item => item.classList.remove('active'));
                    resultItems[prevIndex].classList.add('active');
                    resultItems[prevIndex].scrollIntoView({ block: 'nearest' });
                }
                break;
                
            case 'Enter':
                if (currentActiveIndex >= 0) {
                    e.preventDefault();
                    const countryName = resultItems[currentActiveIndex].textContent;
                    selectCountry(countryName);
                } else if (resultItems.length > 0) {
                    e.preventDefault();
                    const countryName = resultItems[0].textContent;
                    selectCountry(countryName);
                }
                break;
                
            case 'Escape':
                e.preventDefault();
                searchResults.style.display = 'none';
                break;
        }
    });
}

// If button still exists in the DOM, keep this listener
if (searchButton) {
    searchButton.addEventListener('click', performSearch);
}

// Close search results when clicking outside
document.addEventListener('click', (e) => {
    if (searchContainer && searchResults && !searchContainer.contains(e.target)) {
        searchResults.style.display = 'none';
    }
});

// Function to open country modal
function openCountryModal(countryCode, countryNameHeb) {
    console.log(`Opening modal for country: ${countryCode}`);
    
    // Get the proper flag code
    const flagCode = getFlagCode(countryCode);
    
    // Get events and soldiers for this country
    Promise.all([
        fetch("/events/").then(res => res.json()),
        fetch("/soldiers/").then(res => res.json())
    ])
    .then(([events, soldiers]) => {
        // Filter events and soldiers for this country
        const englishName = countryCode;
        const countryEvents = events.filter(ev => {
            const eventCountry = (ev.country__name || "").trim().toLowerCase();
            return eventCountry === englishName;
        });
        
        const countrySoldiers = soldiers.filter(soldier => {
            const soldierCountry = (soldier.country || "").toLowerCase().trim();
            return soldierCountry === englishName;
        });
        
        console.log(`Found ${countryEvents.length} events and ${countrySoldiers.length} soldiers for ${countryNameHeb}`);
        
        // Set up globals
        window.currentEvents = countryEvents;
        window.currentSoldiers = countrySoldiers;
        window.currentIndex = 0;
        
        // Update flag in the modal
        const mapPlaceholder = document.getElementById("insetMapPlaceholder");
        if (mapPlaceholder) {
            mapPlaceholder.innerHTML = flagCode
                ? `<img id="countryFlag" src="https://flagcdn.com/w320/${flagCode}.png" alt="דגל ${countryNameHeb}">`
                : "מפת הקרב";
        }
        
        // Show the modal with the country events
        showCountryEventsModal(countryNameHeb, countryEvents, countrySoldiers);
    })
    .catch(error => {
        console.error("Error loading country data:", error);
    });
}

// Function to get the correct flag code
function getFlagCode(countryCode) {
    // Special cases for our search (convert search term to proper country name)
    const searchToCountry = {
        'united kingdom': 'united kingdom',
        'united states of america': 'united states of america',
        'usa': 'united states of america',
        'uk': 'united kingdom',
        'czech republic': 'czech republic'
    };
    
    // First convert our search term to actual country name if needed
    const countryName = searchToCountry[countryCode] || countryCode;
    
    // Then use the countryCodeMapping to get the flag code
    return countryCodeMapping[countryName] || countryCode;
}
