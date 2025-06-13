# WW2 Map Backend

This directory contains the Django backend for the WW2 Map application.

## Structure

```
backend/
├── ww2map/                # Django project
│   ├── ww2map/           # Project settings
│   │   ├── settings.py   # Django settings
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

## Key Models

- **Event**: Historical WW2 events
- **Soldier**: Individual soldier profiles
- **Country**: Country information
- **User**: User authentication

## API Endpoints

- `/api/events/` - Historical events
- `/api/soldiers/` - Soldier information
- `/api/countries/` - Country data
- `/soldiers/search/` - Soldier search
- `/events/` - Events by language and country

## Setup

1. **Create virtual environment**:
   ```bash
   cd backend/ww2map
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Database setup**:
   ```bash
   python manage.py migrate
   python manage.py createsuperuser
   ```

4. **Load initial data**:
   ```bash
   python manage.py loaddata backup_data.json
   ```

5. **Run development server**:
   ```bash
   python manage.py runserver
   ```

## Environment Variables

Create a `.env` file with:
```
SECRET_KEY=your-secret-key
DEBUG=True
GEMINI_API_KEY=your-gemini-api-key
```

## Dependencies

- Django 4.x
- Django REST Framework
- Python 3.8+
- SQLite (development) / PostgreSQL (production) 