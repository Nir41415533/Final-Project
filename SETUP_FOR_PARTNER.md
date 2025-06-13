# WW2 Map Project - Partner Setup Guide

## Quick Setup Instructions

Follow these steps to get the project running on your machine:

### 1. Clone the Repository
```bash
git clone [repository-url]
cd Final-Project
```

### 2. Create Environment File
Create a `.env` file in the project root with these exact values:

```bash
# Django Configuration
SECRET_KEY=django-insecure-7e7adw78s-bso+#b!rp!+*hxismb#z&tis!ixyxuk+m^qr&u6x
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database Configuration
DB_ENGINE=django.db.backends.postgresql
DB_NAME=ww2map
DB_USER=ww2user
DB_PASSWORD=41415533
DB_HOST=localhost
DB_PORT=5432

# API Keys
MAPTILER_API_KEY=id6E01naKP3UCWgW7hY1
GEMINI_API_KEY=AIzaSyASiWy14ObnspkGaEN8v8JOnpvVjcbzs0o

# Static Files
STATIC_URL=/static/
MEDIA_URL=/media/
```

### 3. Set Up Backend
```bash
cd backend/ww2map
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 4. Database Setup
Make sure you have PostgreSQL installed and create the database:
```sql
CREATE DATABASE ww2map;
CREATE USER ww2user WITH PASSWORD '41415533';
GRANT ALL PRIVILEGES ON DATABASE ww2map TO ww2user;
```

### 5. Run Migrations
```bash
python manage.py migrate
```

### 6. Start the Server
```bash
python manage.py runserver
```

### 7. Access the Application
Open your browser and go to: `http://localhost:8000`

## Project Structure
```
Final-Project/
├── backend/              # Django backend
│   └── ww2map/          # Django project
├── frontend/            # Static assets and templates
│   ├── static/          # CSS, JS, images
│   └── templates/       # HTML templates
├── .env                 # Environment variables (create this)
└── README.md           # Main documentation
```

## Features
- 🗺️ Interactive WW2 map
- 📅 Timeline navigation
- 👥 Soldier profiles
- 🔍 Search functionality
- 🤖 AI integration with Gemini
- 🌐 Hebrew/English support
- 📱 Mobile responsive

## Troubleshooting

### If you get "command not found: python"
Use `python3` instead:
```bash
python3 manage.py runserver
```

### If you get Django import errors
Make sure the virtual environment is activated:
```bash
source venv/bin/activate
```

### If the database connection fails
1. Make sure PostgreSQL is running
2. Check that the database and user exist
3. Verify the credentials in `.env` match your PostgreSQL setup

## API Keys Information
- **MapTiler**: Used for map tiles and styling
- **Gemini AI**: Used for additional event information and AI features

## Need Help?
Contact [your-name] if you run into any issues! 