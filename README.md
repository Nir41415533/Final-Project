cat << 'EOF' > README.md
# 🌍 WWII Historical Map & Timeline 📜

[![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Django](https://img.shields.io/badge/Django-4.2-092E20?style=for-the-badge&logo=django&logoColor=white)](https://www.djangoproject.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Award](https://img.shields.io/badge/Award-Dean's%20Honor-gold?style=for-the-badge&logo=google-scholar&logoColor=white)](#)

An immersive, interactive web application developed for the **Jewish Soldier Museum**. This platform allows users to explore the complex geography and chronology of World War II through a data-driven map, detailed soldier biographies, and AI-powered historical insights.

---

### 📺 **Project Demo**
> **[Watch the Video Presentation](https://drive.google.com/drive/home)** 🎥

---

## ✨ Key Features

| Feature | Description |
| :--- | :--- |
| 🗺️ **Interactive Map** | Deep-dive into global events using **MapLibre GL JS** with custom vector tiles. |
| 📅 **Dynamic Timeline** | Navigate through the war's progression chronologically with a synced UI. |
| 👥 **Soldier Biographies** | Detailed profiles and service records of those who served. |
| 🤖 **Gemini AI Integration** | Smart historical context and event summaries powered by Google's Gemini AI. |
| 🌐 **Bi-Directional UI** | Full support for **Hebrew (RTL)** and **English (LTR)**. |
| 📱 **Adaptive Design** | Fully responsive interface optimized for both desktop and mobile devices. |
| 🏴 **Flag Display** | Automated flag mapping for all historical events and country modals. |

---

## 🛠️ Technology Stack

### **Backend (The Engine)**
* **Django 4.2.16:** Robust MVC architecture and admin management.
* **Django REST Framework:** For a clean, scalable API layer.
* **PostgreSQL:** Relational database for complex historical data mapping.
* **Python-dotenv:** Secure environment configuration management.

### **Frontend (The Experience)**
* **Vanilla JavaScript:** High-performance logic without heavy framework overhead.
* **MapLibre GL JS:** High-performance rendering of interactive maps and layers.
* **Modern CSS3:** Leveraging Grid and Flexbox for pixel-perfect layouts.
* **API Integrations:** MapTiler (Mapping Data) & Google Gemini (AI Context).

---

## 📂 Project Structure

```bash
Final-Project/
├── 📁 backend/              # Django Core
│   └── 📁 ww2map/           # Project settings & Logic
│       ├── 📁 mapapp/       # Main API, Data Models & Views
│       ├── requirements.txt # Python Dependencies
│       └── manage.py        # Project CLI
├── 📁 frontend/             # Client-side files
│   ├── 📁 static/           # UI Assets (CSS, JS, Images)
│   └── 📁 templates/        # HTML Structure
├── .env                     # Secrets & Configuration (Hidden)
├── SETUP_FOR_PARTNER.md     # Collaborative Developer Guide
└── README.md                # Project Documentation
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
