from django.urls import path
from .views import Home, ww2map_view, event_list

urlpatterns = [
    path('', Home.as_view(), name='home'),  # דף הבית
    path('ww2map/', ww2map_view, name='ww2map'),  # דף המפה הישנה
    path('events/', event_list, name='event_list'),  # API לשליפת אירועים
]
