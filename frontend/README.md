# WW2 Map Frontend

This directory contains all frontend assets for the WW2 Map application.

## Structure

```
frontend/
├── static/
│   └── mapapp/
│       ├── css/           # Stylesheets
│       ├── js/            # JavaScript modules
│       └── images/        # Images and assets
├── templates/
│   └── mapapp/
│       └── *.html         # Django templates
├── package.json           # Frontend dependencies
└── README.md             # This file
```

## Features

- **Interactive Map**: MapLibre GL JS powered map interface
- **Timeline Component**: Interactive historical timeline
- **Responsive Design**: Mobile-optimized layouts
- **Modal System**: Country and soldier detail modals
- **AI Integration**: Gemini AI powered event descriptions
- **Search Functionality**: Country and soldier search
- **Internationalization**: Hebrew and English support

## Key Files

### JavaScript Modules
- `index.js` - Main application entry point
- `timeline.js` - Timeline functionality
- `modalHandler.js` - Modal management
- `eventDisplay.js` - Event display logic
- `soldierHandler.js` - Soldier management
- `map.js` - Map utilities
- `ai-config.js` - AI configuration

### CSS Files
- `styles.css` - Main application styles
- `modal.css` - Modal system styles

### Templates
- `map.html` - Main application template

## Development

The frontend is served through Django's static file handling. No build process is required for development.

### Running Linting (optional)
```bash
npm install
npm run lint:js
npm run lint:css
```

## Dependencies

- MapLibre GL JS 3.3.1
- Modern ES6+ JavaScript
- CSS3 with Grid and Flexbox
- Responsive design principles 