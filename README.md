# WW2 Historical Map Application

An interactive web application for exploring World War II historical events, soldier profiles, and geographical information.

## Project Structure

```
ww2map-project/
├── backend/              # Django backend API
│   └── ww2map/          # Django project
├── frontend/            # Static assets and templates
│   ├── static/          # CSS, JS, images
│   └── templates/       # HTML templates
├── ww2map/             # Original development structure (legacy)
└── README.md           # This file
```

## Features

🗺️ **Interactive Map**: Explore WW2 events on an interactive map  
📅 **Timeline**: Navigate through historical events chronologically  
👥 **Soldier Profiles**: Browse detailed soldier biographies and service records  
🔍 **Search**: Find specific soldiers, events, or countries  
🤖 **AI Integration**: Get additional insights with Gemini AI  
🌐 **Multilingual**: Support for Hebrew and English  
📱 **Responsive**: Mobile-optimized interface  

## Technology Stack

### Backend
- **Django 4.x** - Web framework
- **Django REST Framework** - API development
- **SQLite/PostgreSQL** - Database
- **Python 3.8+** - Programming language

### Frontend
- **Vanilla JavaScript** - No framework dependencies
- **MapLibre GL JS** - Interactive mapping
- **CSS3** - Modern styling with Grid and Flexbox
- **HTML5** - Semantic markup

## Quick Start

### 1. Environment Setup
Create a `.env` file in the project root:
```bash
cp env.example .env
```

Edit `.env` with your API keys and database credentials:
```bash
# Django Configuration
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database Configuration
DB_NAME=your-database-name
DB_USER=your-database-user
DB_PASSWORD=your-database-password

# API Keys
MAPTILER_API_KEY=your-maptiler-api-key-here
GEMINI_API_KEY=your-gemini-api-key-here
```

### 2. Backend Setup
```bash
cd backend/ww2map
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### 3. Frontend Development
The frontend files are served by Django. API keys are loaded from environment variables.

Access the application at: `http://localhost:8000`

### 4. Required API Keys
- **MapTiler API Key**: Get from [MapTiler](https://www.maptiler.com/)
- **Gemini AI API Key**: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)

## Development Workflow

1. **Backend Development**: Work in `backend/ww2map/`
2. **Frontend Development**: Work in `frontend/`
3. **Django Settings**: Configure static files to point to `frontend/`

## Key Improvements Made

✅ **Mobile Responsiveness**: Enhanced mobile layouts and touch interactions  
✅ **Timeline UX**: Improved timeline navigation and event display  
✅ **Modal System**: Better modal management and user experience  
✅ **AI Integration**: Seamless Gemini AI integration for event details  
✅ **Flag Display**: Fixed flag display issues across all modal types  
✅ **Code Organization**: Separated frontend and backend concerns  

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes in the appropriate `frontend/` or `backend/` directory
4. Test your changes
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For questions or issues, please create an issue in the project repository. 