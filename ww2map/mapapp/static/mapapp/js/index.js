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

// List of countries with their Hebrew names - using all countries from countryCodeMapping
const countries = {
    'אפגניסטן': 'afghanistan',
    'אלבניה': 'albania',
    'אלג\'יריה': 'algeria',
    'סמואה האמריקנית': 'american samoa',
    'אנדורה': 'andorra',
    'אנגולה': 'angola',
    'אנגווילה': 'anguilla',
    'אנטארקטיקה': 'antarctica',
    'אנטיגואה וברבודה': 'antigua and barbuda',
    'ארגנטינה': 'argentina',
    'ארמניה': 'armenia',
    'ארובה': 'aruba',
    'אוסטרליה': 'australia',
    'אוסטריה': 'austria',
    'אזרבייג\'אן': 'azerbaijan',
    'בהאמה': 'bahamas',
    'בחריין': 'bahrain',
    'בנגלדש': 'bangladesh',
    'ברבדוס': 'barbados',
    'בלארוס': 'belarus',
    'בלגיה': 'belgium',
    'בליז': 'belize',
    'בנין': 'benin',
    'ברמודה': 'bermuda',
    'בהוטן': 'bhutan',
    'בוליביה': 'bolivia',
    'בוסניה והרצגובינה': 'bosnia and herzegovina',
    'בוטסואנה': 'botswana',
    'אי בובה': 'bouvet island',
    'ברזיל': 'brazil',
    'טריטוריה בריטית באוקיינוס ההודי': 'british indian ocean territory',
    'ברוניי': 'brunei darussalam',
    'בולגריה': 'bulgaria',
    'בורקינה פאסו': 'burkina faso',
    'בורונדי': 'burundi',
    'קמבודיה': 'cambodia',
    'קמרון': 'cameroon',
    'קנדה': 'canada',
    'כף ורדה': 'cape verde',
    'איי קיימן': 'cayman islands',
    'הרפובליקה המרכז-אפריקאית': 'central african republic',
    'צ\'אד': 'chad',
    'צ\'ילה': 'chile',
    'סין': 'china',
    'אי חג המולד': 'christmas island',
    'איי קוקוס (קילינג)': 'cocos (keeling) islands',
    'קולומביה': 'colombia',
    'קומורו': 'comoros',
    'קונגו': 'democratic republic of the congo',
    'הרפובליקה הדמוקרטית של קונגו': 'congo, the democratic republic of the',
    'איי קוק': 'cook islands',
    'קוסטה ריקה': 'costa rica',
    'קרואטיה': 'croatia',
    'קובה': 'cuba',
    'קוראסאו': 'curaçao',
    'קפריסין': 'cyprus',
    'צ\'כיה': 'czech republic',
    'חוף השנהב': 'côte d\'ivoire',
    'דנמרק': 'denmark',
    'ג\'יבוטי': 'djibouti',
    'דומיניקה': 'dominica',
    'הרפובליקה הדומיניקנית': 'dominican republic',
    'אקוודור': 'ecuador',
    'מצרים': 'egypt',
    'אל סלבדור': 'el salvador',
    'גינאה המשוונית': 'equatorial guinea',
    'אריתריאה': 'eritrea',
    'אסטוניה': 'estonia',
    'אסוואטיני': 'eswatini',
    'אתיופיה': 'ethiopia',
    'איי פוקלנד': 'falkland islands',
    'איי פארו': 'faroe islands',
    'פיג\'י': 'fiji',
    'פינלנד': 'finland',
    'צרפת': 'france',
    'גיאנה הצרפתית': 'french guiana',
    'פולינזיה הצרפתית': 'french polynesia',
    'הטריטוריות הדרומיות של צרפת': 'french southern territories',
    'גבון': 'gabon',
    'גמביה': 'gambia',
    'גאורגיה': 'georgia',
    'גרמניה': 'germany',
    'גאנה': 'ghana',
    'גיברלטר': 'gibraltar',
    'יוון': 'greece',
    'גרינלנד': 'greenland',
    'גרנדה': 'grenada',
    'גוואדלופ': 'guadeloupe',
    'גואם': 'guam',
    'גרנזי': 'guernsey',
    'גואטמלה': 'guatemala',
    'גינאה': 'guinea',
    'גינאה-ביסאו': 'guinea-bissau',
    'גיאנה': 'guyana',
    'האיטי': 'haiti',
    'אי הרד ואיי מקדונלד': 'heard island and mcdonald islands',
    'הכס הקדוש': 'holy see',
    'הונדורס': 'honduras',
    'הונג קונג': 'hong kong',
    'הונגריה': 'hungary',
    'איסלנד': 'iceland',
    'הודו': 'india',
    'אינדונזיה': 'indonesia',
    'איראן': 'iran',
    'עיראק': 'iraq',
    'אירלנד': 'ireland',
    'אי מאן': 'isle of man',
    'ישראל': 'israel',
    'איטליה': 'italy',
    'ג\'מייקה': 'jamaica',
    'יפן': 'japan',
    'ג\'רזי': 'jersey',
    'ירדן': 'jordan',
    'קזחסטן': 'kazakhstan',
    'קניה': 'kenya',
    'קיריבטי': 'kiribati',
    'קוריאה הצפונית': 'korea, democratic people\'s republic of',
    'קוריאה הדרומית': 'south korea',
    'כווית': 'kuwait',
    'קירגיזסטן': 'kyrgyzstan',
    'לאוס': 'lao people\'s democratic republic',
    'לטביה': 'latvia',
    'לבנון': 'lebanon',
    'לסוטו': 'lesotho',
    'ליבריה': 'liberia',
    'לוב': 'libya',
    'ליכטנשטיין': 'liechtenstein',
    'ליטא': 'lithuania',
    'לוקסמבורג': 'luxembourg',
    'מקאו': 'macao',
    'מדגסקר': 'madagascar',
    'מלאווי': 'malawi',
    'מלזיה': 'malaysia',
    'מלדיביים': 'maldives',
    'מאלי': 'mali',
    'מלטה': 'malta',
    'איי מרשל': 'marshall islands',
    'מרטיניק': 'martinique',
    'מאוריטניה': 'mauritania',
    'מאוריציוס': 'mauritius',
    'מאיוט': 'mayotte',
    'מקסיקו': 'mexico',
    'מיקרונזיה': 'micronesia, federated states of',
    'מולדובה': 'moldova',
    'מונקו': 'monaco',
    'מונגוליה': 'mongolia',
    'מונטנגרו': 'montenegro',
    'מונטסראט': 'montserrat',
    'מרוקו': 'morocco',
    'מוזמביק': 'mozambique',
    'מיאנמר': 'myanmar',
    'נמיביה': 'namibia',
    'נאורו': 'nauru',
    'נפאל': 'nepal',
    'הולנד': 'netherlands',
    'קלדוניה החדשה': 'new caledonia',
    'ניו זילנד': 'new zealand',
    'ניקרגואה': 'nicaragua',
    'ניז\'ר': 'niger',
    'ניגריה': 'nigeria',
    'ניואה': 'niue',
    'אי נורפוק': 'norfolk island',
    'מקדוניה הצפונית': 'north macedonia',
    'איי מריאנה הצפוניים': 'northern mariana islands',
    'נורבגיה': 'norway',
    'עומאן': 'oman',
    'פקיסטן': 'pakistan',
    'פלאו': 'palau',
    'פלסטין': 'palestine',
    'פנמה': 'panama',
    'פפואה גינאה החדשה': 'papua new guinea',
    'פרגוואי': 'paraguay',
    'פרו': 'peru',
    'פיליפינים': 'philippines',
    'פיטקרן': 'pitcairn',
    'פולין': 'poland',
    'פורטוגל': 'portugal',
    'פוארטו ריקו': 'puerto rico',
    'קטאר': 'qatar',
    'ראוניון': 'reunion',
    'רומניה': 'romania',
    'רוסיה': 'russia',
    'רואנדה': 'rwanda',
    'סנט ברתלמי': 'saint barthelemy',
    'סנט הלנה': 'saint helena, ascension and tristan da cunha',
    'סנט קיטס ונוויס': 'saint kitts and nevis',
    'סנט לוסיה': 'saint lucia',
    'סנט מרטין': 'saint martin',
    'סנט פייר ומיקלון': 'saint pierre and miquelon',
    'סנט וינסנט והגרנדינים': 'saint vincent and the grenadines',
    'סמואה': 'samoa',
    'סן מרינו': 'san marino',
    'סאו טומה ופרינסיפה': 'sao tome and principe',
    'ערב הסעודית': 'saudi arabia',
    'סנגל': 'senegal',
    'סרביה': 'serbia',
    'סיישל': 'seychelles',
    'סיירה ליאונה': 'sierra leone',
    'סינגפור': 'singapore',
    'סינט מארטן': 'sint maarten',
    'סלובקיה': 'slovakia',
    'סלובניה': 'slovenia',
    'איי שלמה': 'solomon islands',
    'סומליה': 'somalia',
    'דרום אפריקה': 'south africa',
    'ג\'ורג\'יה הדרומית ואיי סנדוויץ\' הדרומיים': 'south georgia and the south sandwich islands',
    'ספרד': 'spain',
    'סרי לנקה': 'sri lanka',
    'סודאן': 'sudan',
    'סורינאם': 'suriname',
    'סוואלברד ויאן מאיין': 'svalbard and jan mayen',
    'שוודיה': 'sweden',
    'שווייץ': 'switzerland',
    'סוריה': 'syria',
    'טאיוואן': 'taiwan',
    'טג\'יקיסטן': 'tajikistan',
    'טנזניה': 'tanzania',
    'הרפובליקה המאוחדת של טנזניה': 'united republic of tanzania',
    'תאילנד': 'thailand',
    'טימור-לסטה': 'timor-leste',
    'טוגו': 'togo',
    'טוקלאו': 'tokelau',
    'טונגה': 'tonga',
    'טרינידד וטובגו': 'trinidad and tobago',
    'תוניסיה': 'tunisia',
    'טורקיה': 'turkey',
    'טורקמניסטן': 'turkmenistan',
    'איי טורקס וקאיקוס': 'turks and caicos islands',
    'טובאלו': 'tuvalu',
    'אוגנדה': 'uganda',
    'אוקראינה': 'ukraine',
    'איחוד האמירויות': 'united arab emirates',
    'בריטניה': 'united kingdom',
    'ארצות הברית': 'united states of america',
    'איי הבתולה הבריטיים': 'virgin islands, british',
    'איי הבתולה האמריקניים': 'virgin islands, u.s.',
    'אורוגוואי': 'uruguay',
    'אוזבקיסטן': 'uzbekistan',
    'ונואטו': 'vanuatu',
    'ונצואלה': 'venezuela',
    'וייטנאם': 'vietnam',
    'ווליס ופוטונה': 'wallis and futuna',
    'סהרה המערבית': 'western sahara',
    'תימן': 'yemen',
    'זמביה': 'zambia',
    'זימבבואה': 'zimbabwe'
};

// חשיפה של מיפוי המדינות למרחב הגלובלי
window.countries = countries;

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
    
    // Load events only (soldiers will be loaded by modalHandler via API)
    fetch("/events/")
        .then(res => res.json())
        .then(events => {
            // Filter events for this country
            const englishName = countryCode;
            const countryEvents = events.filter(ev => {
                const eventCountry = (ev.country__name || "").trim().toLowerCase();
                return eventCountry === englishName;
            });
            
            console.log(`Found ${countryEvents.length} events for ${countryNameHeb}`);
            
            // Set up events global
            window.currentEvents = countryEvents;
            window.currentIndex = 0;
            
            // Update flag in the modal
            const mapPlaceholder = document.getElementById("insetMapPlaceholder");
            if (mapPlaceholder) {
                mapPlaceholder.innerHTML = flagCode
                    ? `<img id="countryFlag" src="https://flagcdn.com/w320/${flagCode}.png" alt="דגל ${countryNameHeb}">`
                    : "מפת הקרב";
            }
            
            // Show the modal with the country events
            // Pass an empty array for soldiers as they will be loaded by the modal
            showCountryEventsModal(countryNameHeb, countryEvents, []);
        })
        .catch(error => {
            console.error("Error loading events data:", error);
        });
}

// חשיפה של פונקציית openCountryModal כפונקציה גלובלית
window.openCountryModal = openCountryModal;

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
