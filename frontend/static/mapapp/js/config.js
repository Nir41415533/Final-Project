// Frontend configuration that fetches API keys from backend
let CONFIG = {
    MAPTILER_API_KEY: '',
    GEMINI_API_KEY: '',
    DEBUG: false,
    loaded: false
};

// Function to load configuration from backend
async function loadConfig() {
    if (CONFIG.loaded) {
        return CONFIG;
    }
    
    try {
        const response = await fetch('/config/');
        if (response.ok) {
            const config = await response.json();
            CONFIG.MAPTILER_API_KEY = config.MAPTILER_API_KEY;
            CONFIG.GEMINI_API_KEY = config.GEMINI_API_KEY;
            CONFIG.DEBUG = config.DEBUG;
            CONFIG.loaded = true;
            console.log('✅ Configuration loaded successfully');
        } else {
            console.error('❌ Failed to load configuration from backend');
        }
    } catch (error) {
        console.error('❌ Error loading configuration:', error);
    }
    
    return CONFIG;
}

// Export for use in other modules
export { CONFIG, loadConfig }; 