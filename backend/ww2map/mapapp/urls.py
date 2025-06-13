from django.urls import path
from .views import Home, ww2map_view, event_list
from .views import soldiers_list, dashboard_view, dashboard_data, paginated_soldiers, soldier_detail, search_soldiers, country_name, country_english_name, frontend_config

urlpatterns = [
    path('', Home.as_view(), name='home'),  # דף הבית
    path('ww2map/', ww2map_view, name='ww2map'),  # דף המפה הישנה
    path('events/', event_list, name='event_list'),  # API לשליפת אירועים
    
    path("soldiers/", soldiers_list, name="soldiers"),
    path("soldiers/search/", search_soldiers, name="search_soldiers"),  # API לחיפוש לוחמים
    path("soldiers/paginated/", paginated_soldiers, name="paginated_soldiers"),  # API לטעינה הדרגתית של חיילים
    path("soldier/<int:soldier_id>/", soldier_detail, name="soldier_detail"),  # API לפרטי לוחם בודד
    path("dashboard/", dashboard_view, name="dashboard"),  # דף הגרפים והנתונים
    path("dashboard/data/", dashboard_data, name="dashboard_data"),  # API לנתוני הדשבורד
    path("country/name/", country_name, name="country_name"),  # API לקבלת שם מדינה בשפה הנכונה
    path("country/english-name/", country_english_name, name="country_english_name"),  # API לקבלת שם מדינה באנגלית לדגלים
    path("config/", frontend_config, name="frontend_config"),  # API לקבלת הגדרות frontend
]
