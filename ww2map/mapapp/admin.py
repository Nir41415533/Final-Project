from django.contrib import admin
from .models import Country, Event, Soldier

class CountryAdmin(admin.ModelAdmin):
    search_fields = ['name_he', 'name_en']  # 🔹 מאפשר חיפוש לפי שם המדינה בעברית ובאנגלית

class EventAdmin(admin.ModelAdmin):
    list_filter = ['country', 'date']  # 🔹 סינון לפי מדינה ושנה
    search_fields = ['title', 'title_en', 'description', 'description_en', 'country__name_he', 'country__name_en']  # 🔹 חיפוש לפי כותרת, תיאור ומדינה
    list_display = ('title', 'title_en', 'country', 'date')  # 🔹 תצוגת האירועים עם תאריך
    fields = ('title', 'title_en', 'description', 'description_en', 'date', 'country', 'image', 'video')

class SoldierAdmin(admin.ModelAdmin):
    search_fields = ['first_name_he', 'last_name_he', 'first_name_en', 'last_name_en']

admin.site.register(Country, CountryAdmin)  # 🔹 רישום טבלת מדינות
admin.site.register(Event, EventAdmin)  # 🔹 רישום טבלת אירועים
admin.site.register(Soldier, SoldierAdmin)  # 🔹 רישום טבלת לוחמים
