from django.contrib import admin
from .models import Country, Event

class CountryAdmin(admin.ModelAdmin):
    search_fields = ['name']  # 🔹 מאפשר חיפוש לפי שם המדינה

class EventAdmin(admin.ModelAdmin):
    list_filter = ['country', 'date']  # 🔹 סינון לפי מדינה ושנה
    search_fields = ['title', 'description', 'country__name']  # 🔹 חיפוש לפי כותרת, תיאור ומדינה
    list_display = ('title', 'country', 'date')  # 🔹 תצוגת האירועים עם תאריך

admin.site.register(Country, CountryAdmin)  # 🔹 רישום טבלת מדינות
admin.site.register(Event, EventAdmin)  # 🔹 רישום טבלת אירועים
