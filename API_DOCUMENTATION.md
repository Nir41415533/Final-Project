# WW2 Map API Documentation

## סקירה כללית

API זה מספק גישה למידע היסטורי על מלחמת העולם השנייה, כולל:
- אירועים היסטוריים עם מיקום גיאוגרפי
- פרופילי לוחמים מפורטים
- נתוני מדינות ואזורים
- נתונים סטטיסטיים ודשבורד

## Base URL
```
http://localhost:8000/
```

## תמיכה רב-לשונית
כל ה-API endpoints תומכים בעברית ואנגלית. השפה נקבעת על ידי:
- פרמטר `lang` ב-URL (he/en)
- Session variable `language`
- ברירת מחדל: אנגלית

---

## Events API

### GET /events/
קבלת רשימת כל האירועים ההיסטוריים

**פרמטרים:**
| פרמטר | סוג | תיאור |
|-------|-----|-------|
| lang | string (optional) | שפה: he/en |

**תגובה מדוגמה:**
```json
[
  {
    "title": "D-Day Landing",
    "date": "1944-06-06",
    "description": "The Allied invasion of Normandy",
    "image": "path/to/image.jpg",
    "video": "path/to/video.mp4",
    "country": {
      "name": "France",
      "latitude": 49.5,
      "longitude": 0.1
    }
  }
]
```

**שגיאות אפשריות:**
- 500: Server Error

---

## Soldiers API

### GET /soldiers/
קבלת רשימה בסיסית של לוחמים (מוגבל ל-1000 רשומות)

**פרמטרים:**
| פרמטר | סוג | תיאור |
|-------|-----|-------|
| lang | string (optional) | שפה: he/en |

**תגובה מדוגמה:**
```json
[
  {
    "id": 12345,
    "name": "יוסף כהן",
    "image": "https://example.com/photo.jpg",
    "gender": "1",
    "country": "פולין"
  }
]
```

### GET /soldiers/paginated/
קבלת לוחמים עם דפדוף וסינון מתקדם

**פרמטרים:**
| פרמטר | סוג | תיאור |
|-------|-----|-------|
| page | integer | מספר העמוד (ברירת מחדל: 1) |
| limit | integer | מספר רשומות בעמוד (ברירת מחדל: 50) |
| country | string | סינון לפי מדינה |
| search | string | חיפוש בשם |
| gender | string | סינון לפי מגדר (זכר/נקבה) |
| rank | string | סינון לפי דרגה |
| year_from | integer | שנת לידה מ- |
| year_to | integer | שנת לידה עד |
| sort_by | string | מיון: name/birth_date/rank/aliya_date |
| lang | string | שפה: he/en |

**תגובה מדוגמה:**
```json
{
  "soldiers": [
    {
      "id": 12345,
      "name": "יוסף כהן",
      "image": "https://example.com/photo.jpg",
      "gender": "1",
      "country": "פולין"
    }
  ],
  "pagination": {
    "total": 1500,
    "page": 1,
    "limit": 50,
    "pages": 30
  }
}
```

### GET /soldier/{soldier_id}/
קבלת מידע מפורט על לוחם ספציפי

**פרמטרים של הנתיב:**
| פרמטר | סוג | תיאור |
|-------|-----|-------|
| soldier_id | integer | מזהה הלוחם |

**פרמטרי שאילתה:**
| פרמטר | סוג | תיאור |
|-------|-----|-------|
| lang | string | שפה: he/en |

**תגובה מדוגמה:**
```json
{
  "id": 12345,
  "name": "יוסף כהן",
  "first_name": "יוסף",
  "last_name": "כהן",
  "nickname": "יוסי",
  "father_name": "משה",
  "mother_name": "רחל",
  "gender": "1",
  "date_of_birth": "1920-05-15",
  "birth_city": "וורשה",
  "birth_country": {
    "name": "פולין",
    "code": 48
  },
  "aliya_date": "1935-03-20",
  "army": "הצבא הבריטי",
  "army_role": "חייל רגלים",
  "rank": "סמל",
  "participation": "השתתף בקרבות צפון אפריקה",
  "decorations": "מדליית גבורה",
  "biography": "סיפור חייו של הלוחם...",
  "fighting_description": "תיאור הקרבות בהם השתתף",
  "wounds": "נפצע בקרב אל עלמיין",
  "date_of_death": "1942-10-23",
  "place_of_death": "מצרים",
  "death_details": "נהרג בקרב",
  "image_url": "https://example.com/photo.jpg",
  "video_url": "https://example.com/video.mp4"
}
```

**שגיאות אפשriות:**
- 404: לוחם לא נמצא
- 500: Server Error

### GET /soldiers/search/
חיפוש לוחמים לפי שם

**פרמטרים:**
| פרמטר | סוג | תיאור |
|-------|-----|-------|
| q | string | מחרוזת חיפוש |
| lang | string | שפה: he/en |

**תגובה מדוגמה:**
```json
{
  "soldiers": [
    {
      "id": 12345,
      "name": "יוסף כהן",
      "country": "פולין",
      "image": "https://example.com/photo.jpg"
    }
  ]
}
```

---

## Dashboard API

### GET /dashboard/
דף הדשבורד (HTML view)

### GET /dashboard/data/
קבלת נתונים סטטיסטיים לדשבורד

**תגובה מדוגמה:**
```json
{
  "soldiers_by_country": [
    {
      "birth_country__name_he": "פולין",
      "count": 450
    }
  ],
  "soldiers_by_gender": [
    {
      "gender": "1",
      "count": 800
    }
  ],
  "events_by_country": [
    {
      "country__name_he": "גרמניה",
      "count": 25
    }
  ],
  "image_distribution": {
    "with_images": 600,
    "without_images": 400
  },
  "decorations_distribution": {
    "with_decorations": 300,
    "without_decorations": 700
  },
  "army_roles_distribution": [
    {
      "army_role_he": "חייל רגלים",
      "count": 200
    }
  ],
  "cities_distribution": [
    {
      "birth_city_he": "וורשה",
      "count": 50
    }
  ],
  "timeline_data": [
    {
      "year": 1940,
      "count": 15
    }
  ],
  "region_distribution": {
    "Eastern Europe": 500,
    "Western Europe": 300
  },
  "age_distribution": [
    {
      "age_group": "20-25",
      "count": 150
    }
  ],
  "total_soldiers": 1000,
  "total_events": 100,
  "total_countries": 45,
  "total_decorations": 300
}
```

---

## Countries API

### GET /country/name/
קבלת שם מדינה בשפה המבוקשת

**פרמטרים:**
| פרמטר | סוג | תיאור |
|-------|-----|-------|
| country | string | מזהה המדינה (שם או קוד) |
| lang | string | שפה: he/en |

**תגובה מדוגמה:**
```json
{
  "name": "פולין",
  "name_he": "פולין",
  "name_en": "Poland"
}
```

### GET /country/english-name/
קבלת שם מדינה באנגלית (לצורך דגלים)

**פרמטרים:**
| פרמטר | סוג | תיאור |
|-------|-----|-------|
| country | string | מזהה המדינה |

**תגובה מדוגמה:**
```json
{
  "english_name": "poland"
}
```

---

## Configuration API

### GET /config/
קבלת הגדרות frontend

**⚠️ אבטחה:** מפתחות API נחשפים רק במצב פיתוח (DEBUG=True)

**תגובה במצב פיתוח (DEBUG=True):**
```json
{
  "MAPTILER_API_KEY": "your-api-key",
  "GEMINI_API_KEY": "your-gemini-key",
  "DEBUG": true,
  "APP_NAME": "WW2 Map",
  "VERSION": "1.0.0",
  "SUPPORTED_LANGUAGES": ["he", "en"]
}
```

**תגובה במצב ייצור (DEBUG=False):**
```json
{
  "DEBUG": false,
  "APP_NAME": "WW2 Map",
  "VERSION": "1.0.0",
  "SUPPORTED_LANGUAGES": ["he", "en"]
}
```

### 🔐 הערת אבטחה
- במצב פיתוח: מפתחות API נחשפים לצורך פיתוח מקומי
- במצב ייצור: מפתחות API לא נחשפים מסיבות אבטחה

---

## מבני נתונים עיקריים

### Country
```json
{
  "code": 48,
  "name_he": "פולין",
  "name_en": "Poland",
  "latitude": 52.0,
  "longitude": 20.0
}
```

### Event
```json
{
  "title": "כיבוש פולין",
  "title_en": "Invasion of Poland",
  "date": "1939-09-01",
  "description": "תחילת מלחמת העולם השנייה",
  "description_en": "Start of World War II",
  "country": {...},
  "image": "path/to/image.jpg",
  "video": "path/to/video.mp4"
}
```

### Soldier
המבנה כולל שדות רבים בעברית ואנגלית:
- פרטים אישיים (שם, תאריך לידה, הורים)
- פרטים גיאוגרפיים (עיר לידה, מדינה, תאריך עלייה)
- פרטי שירות צבאי (צבא, תפקיד, דרגה, השתתפות)
- סיפור אישי (ביוגרפיה, תיאור קרבות, פציעות)
- פרטי מוות (תאריך, מקום, פרטים)
- מדיה (תמונה, וידאו)

---

## הערות טכניות

1. **אבטחה**: כל ה-endpoints פתוחים (ללא authentication)
2. **קודדד**: UTF-8 עבור תמיכה בעברית
3. **Content-Type**: application/json
4. **HTTP Methods**: רק GET
5. **Rate Limiting**: אין הגבלות נוכחיות
6. **CORS**: מוגדר בהגדרות Django

---

## שגיאות נפוצות

| קוד | תיאור |
|-----|-------|
| 400 | Bad Request - פרמטרים חסרים או לא תקינים |
| 404 | Not Found - משאב לא נמצא |
| 500 | Internal Server Error - שגיאת שרת |

---

## דוגמאות שימוש

### JavaScript/Fetch
```javascript
// קבלת אירועים
fetch('/events/?lang=he')
  .then(response => response.json())
  .then(data => console.log(data));

// חיפוש לוחמים
fetch('/soldiers/search/?q=כהן&lang=he')
  .then(response => response.json())
  .then(data => console.log(data.soldiers));

// קבלת פרטי לוחם
fetch('/soldier/12345/?lang=he')
  .then(response => response.json())
  .then(data => console.log(data));
```

### cURL
```bash
# קבלת אירועים
curl "http://localhost:8000/events/?lang=he"

# חיפוש לוחמים
curl "http://localhost:8000/soldiers/search/?q=cohen&lang=en"

# נתוני דשבורד
curl "http://localhost:8000/dashboard/data/"
```

---

## מידע נוסף

- הפרויקט תומך ב-i18n עם Django
- כל הנתונים מאוחסנים ב-PostgreSQL
- הפרויקט כולל integration עם Gemini AI
- המפות מופעלות על ידי MapTiler
- הפרויקט מותאם למכשירים ניידים 