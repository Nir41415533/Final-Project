from django.contrib import admin
from django.urls import path, include
from django.conf.urls.i18n import i18n_patterns  # תמיכה בריבוי שפות

urlpatterns = i18n_patterns(
    path('admin/', admin.site.urls),
    path('', include('mapapp.urls')),  # דף הבית וה-API
)

# הוספת נתיב להחלפת שפה
urlpatterns += [
    path('i18n/', include('django.conf.urls.i18n')),  # תמיכה בהחלפת שפה
]
