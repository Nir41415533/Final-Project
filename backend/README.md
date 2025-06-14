# WW2 Map Backend

This directory contains the Django backend for the WW2 Map application.

## Structure

```
backend/
├── ww2map/                # Django project
│   ├── ww2map/           # Project settings
│   │   ├── settings.py   # Django settings (uses environment variables)
│   │   ├── urls.py       # URL configuration
│   │   └── wsgi.py       # WSGI configuration
│   ├── mapapp/           # Main Django app
│   │   ├── models.py     # Database models
│   │   ├── views.py      # API views
│   │   ├── urls.py       # App URLs
│   │   ├── serializers.py# DRF serializers
│   │   ├── admin.py      # Django admin
│   │   ├── forms.py      # Django forms
│   │   ├── data/         # Data files
│   │   ├── migrations/   # Database migrations
│   │   ├── management/   # Custom management commands
│   │   └── locale/       # Internationalization
│   ├── locale/           # Project-level i18n
│   ├── requirements.txt  # Python dependencies
│   ├── manage.py         # Django management
│   └── *.json           # Data files
└── README.md            # This file
```

## Features

- **REST API**: Django REST Framework powered API
- **Database Models**: Historical events, soldiers, countries
- **Authentication**: User management system
- **Internationalization**: Hebrew and English support
- **Admin Interface**: Django admin for data management
- **Data Import**: Management commands for importing historical data
- **Search API**: Full-text search for soldiers and events
- **Environment Configuration**: All settings externalized to `.env`
- **Flag Support**: API endpoint for Hebrew to English country name translation

## Key Models

- **Event**: Historical WW2 events with multilingual support
- **Soldier**: Individual soldier profiles with detailed information
- **Country**: Country information with Hebrew and English names
- **User**: User authentication and management

## API Endpoints

### Public Endpoints
- `/` - Main application (serves frontend)
- `/config/` - Frontend configuration (API keys)
- `/api/events/` - Historical events
- `/api/soldiers/` - Soldier information
- `/api/countries/` - Country data
- `/soldiers/search/` - Soldier search
- `/events/` - Events by language and country
- `/country/english-name/<country_name>/` - Get English country name for flags

### Admin Endpoints
- `/admin/` - Django admin interface

## Setup

### Prerequisites
- Python 3.9+
- PostgreSQL
- Virtual environment

### 1. Create virtual environment
```bash
cd backend/ww2map
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install dependencies
```bash
pip install -r requirements.txt
```

### 3. Environment setup
Create a `.env` file in the project root (not in backend/) with:
```bash
# Django Configuration
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database Configuration
DB_ENGINE=django.db.backends.postgresql
DB_NAME=ww2map
DB_USER=ww2user
DB_PASSWORD=your-password
DB_HOST=localhost
DB_PORT=5432

# API Keys
MAPTILER_API_KEY=your-maptiler-key
GEMINI_API_KEY=your-gemini-key

# Static Files
STATIC_URL=/static/
MEDIA_URL=/media/
```

### 4. Database setup
```bash
# Create PostgreSQL database first
createdb ww2map
createuser ww2user

# Run Django migrations
python manage.py migrate
python manage.py createsuperuser
```

### 5. Load initial data (if available)
```bash
python manage.py loaddata backup_data.json
```

### 6. Run development server
```bash
python manage.py runserver
```

## Key Features

### Environment Variable Integration
- All configuration is externalized to `.env`
- Settings automatically load from environment variables
- No hardcoded secrets in the codebase

### Static Files Configuration
- Django serves frontend files from `../../frontend/static/`
- Custom static files configuration for frontend/backend separation

### API Configuration Endpoint
- `/config/` endpoint provides frontend with necessary API keys
- Secure way to pass configuration to frontend without exposing in HTML

### Internationalization
- Hebrew and English language support
- Country name translation for flag display
- Localized content throughout the application

## Dependencies

### Core Dependencies
- **Django 4.2.16** - Web framework
- **djangorestframework** - REST API framework
- **python-dotenv** - Environment variable management
- **psycopg2-binary** - PostgreSQL adapter

### Development Dependencies
- **django-cors-headers** - CORS handling
- **django-extensions** - Development utilities

## Development Commands

```bash
# Create new migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Collect static files (if needed)
python manage.py collectstatic

# Run development server
python manage.py runserver

# Django shell
python manage.py shell

# Database shell
python manage.py dbshell
```

## Troubleshooting

### Database Connection Issues
1. Ensure PostgreSQL is running
2. Check database credentials in `.env`
3. Verify database and user exist

### Import Errors
1. Ensure virtual environment is activated
2. Install requirements: `pip install -r requirements.txt`
3. Check Python version (3.9+ required)

### Static Files Issues
1. Check `STATIC_URL` and `STATICFILES_DIRS` in settings
2. Ensure frontend files exist in `../../frontend/static/`

### Environment Variable Issues
1. Ensure `.env` file exists in project root
2. Check variable names match those in `settings.py`
3. Restart Django server after changing `.env` 