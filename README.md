# WW2 Historical Map Application

An interactive web application for exploring World War II historical events, soldier profiles, and geographical information.

## Project Structure

```
Final-Project/
├── backend/              # Django backend API
│   └── ww2map/          # Django project
│       ├── ww2map/      # Django settings
│       ├── mapapp/      # Main Django app
│       ├── requirements.txt
│       └── manage.py
├── frontend/            # Static assets and templates
│   ├── static/          # CSS, JS, images
│   └── templates/       # HTML templates
├── .env                 # Environment variables (create from env.example)
├── env.example          # Environment template
├── .gitignore          # Git ignore rules
├── SETUP_FOR_PARTNER.md # Partner setup guide
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
🏴 **Flag Display**: Country flags in all modals and events

## Technology Stack

### Backend
- **Django 4.2.16** - Web framework
- **Django REST Framework** - API development
- **PostgreSQL** - Database
- **Python 3.9+** - Programming language
- **python-dotenv** - Environment variable management

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

Edit `.env` with your configuration:
```bash
# Django Configuration
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database Configuration (PostgreSQL)
DB_ENGINE=django.db.backends.postgresql
DB_NAME=ww2map
DB_USER=ww2user
DB_PASSWORD=your-password
DB_HOST=localhost
DB_PORT=5432

# API Keys
MAPTILER_API_KEY=your-maptiler-api-key-here
GEMINI_API_KEY=your-gemini-api-key-here

# Static Files
STATIC_URL=/static/
MEDIA_URL=/media/
```

### 2. Backend Setup
```bash
cd backend/ww2map
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### 3. Database Setup
Make sure PostgreSQL is installed and create the database:
```sql
CREATE DATABASE ww2map;
CREATE USER ww2user WITH PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE ww2map TO ww2user;
```

### 4. Access the Application
Open your browser and go to: `http://localhost:8000`

### 5. Required API Keys
- **MapTiler API Key**: Get from [MapTiler](https://www.maptiler.com/)
- **Gemini AI API Key**: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)

## Development Workflow

1. **Backend Development**: Work in `backend/ww2map/`
2. **Frontend Development**: Work in `frontend/`
3. **Environment Variables**: All configuration is externalized to `.env`
4. **Static Files**: Django serves frontend files from `frontend/static/`

## Key Features Implemented

✅ **Environment Variables**: Complete externalization of all secrets and configuration  
✅ **Mobile Responsiveness**: Enhanced mobile layouts and touch interactions  
✅ **Timeline UX**: Improved timeline navigation and event display  
✅ **Modal System**: Better modal management and user experience  
✅ **AI Integration**: Seamless Gemini AI integration for event details  
✅ **Flag Display**: Fixed flag display issues with Hebrew country names  
✅ **Code Organization**: Clean separation of frontend and backend concerns  
✅ **Partner Collaboration**: Ready for shared development with proper setup docs

## API Endpoints

- `/api/events/` - Historical events
- `/api/soldiers/` - Soldier information
- `/api/countries/` - Country data
- `/config/` - Frontend configuration (API keys)
- `/country/english-name/<country_name>/` - Get English country name for flags

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes in the appropriate `frontend/` or `backend/` directory
4. Test your changes
5. Submit a pull request

## Partner Setup

If you're setting up this project as a partner, see `SETUP_FOR_PARTNER.md` for detailed instructions with actual credentials for shared development.

## License

This project is licensed under the MIT License.

## Support

For questions or issues, please create an issue in the project repository. 