from django.contrib import admin
from .models import Country, Event, Soldier

class CountryAdmin(admin.ModelAdmin):
    search_fields = ['name_he', 'name_en']  # 🔹 מאפשר חיפוש לפי שם המדינה בעברית ובאנגלית

class EventAdmin(admin.ModelAdmin):
    list_filter = ['country', 'date']  # 🔹 סינון לפי מדינה ושנה
    search_fields = ['title', 'description', 'country__name']  # 🔹 חיפוש לפי כותרת, תיאור ומדינה
    list_display = ('title', 'country', 'date')  # 🔹 תצוגת האירועים עם תאריך

class SoldierAdmin(admin.ModelAdmin):
    list_display = ('first_name_he', 'last_name_he', 'birth_country', 'rank', 'date_of_birth', 'gender')  # 🔹 תצוגה של הלוחמים
    search_fields = ['first_name_he', 'last_name_he', 'birth_country__name_he', 'rank']  # 🔹 חיפוש לפי שם, מדינה ודרגה
    list_filter = ['birth_country', 'gender', 'rank']  # 🔹 סינון לפי מדינה, מגדר ודרגה

admin.site.register(Country, CountryAdmin)  # 🔹 רישום טבלת מדינות
admin.site.register(Event, EventAdmin)  # 🔹 רישום טבלת אירועים
admin.site.register(Soldier, SoldierAdmin)  # 🔹 רישום טבלת לוחמים
