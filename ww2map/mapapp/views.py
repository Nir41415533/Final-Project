from django.shortcuts import render, redirect
from django.views import View
from .models import Soldier
from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.http import JsonResponse
from .models import Event
from .forms import DateRangeForm
import csv
import os 
from django.http import JsonResponse
from django.conf import settings

class Home(View):
    template_name_en = 'mapapp/home.html'
    template_name_he = 'mapapp/home_he.html'

    def get(self, request):
        language = request.session.get('language', 'en')
        template_name = self.template_name_he if language == 'he' else self.template_name_en

        return render(request, template_name, {
            'form': None,
            'show_date_range_form': False,
            'success': None
        })

    def post(self, request):
        action = request.POST.get('action', '')
        language = request.session.get('language', 'en')
        template_name = self.template_name_he if language == 'he' else self.template_name_en

        if action == 'change_language':
            new_language = request.POST.get('language', 'en')
            request.session['language'] = new_language
            return redirect('home')

        elif action == 'website':
            return redirect('https://www.jwmww2.org/')

        elif action == 'select_time_range':
            form = DateRangeForm(request.POST)
            if form.is_valid():
                start_date = form.cleaned_data['start_date']
                end_date = form.cleaned_data['end_date']
                return render(request, template_name, {
                    'form': None,
                    'show_date_range_form': True,
                    'success': f'Time range selected: {start_date} to {end_date}.' if language == 'en' else f'טווח תאריכים נבחר: {start_date} עד {end_date}.'
                })
            else:
                return render(request, template_name, {
                    'form': form,
                    'show_date_range_form': True,
                    'success': None
                })

        elif action == 'explore_map':
            return redirect('ww2map')  # הפניה לדף המפה הישנה

        return render(request, template_name, {
            'form': None,
            'show_date_range_form': False,
            'success': None
        })


def ww2map_view(request):
    return render(request, 'mapapp/map.html')


@api_view(['GET'])
def event_list(request):
    try:
        events = Event.objects.all().values(
            "title", "date", "description", "country__name_en", "image", "video"
        )

        results = []
        for event in events:
            event["country__name"] = event.pop("country__name_en")
        return JsonResponse(list(events), safe=False)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@api_view(['GET'])
def soldiers_list(request):
    soldiers = Soldier.objects.select_related('birth_country')[:1000]

    data = []
    for soldier in soldiers:
        data.append({
            "id": soldier.customer_id,
            "name": f"{soldier.first_name_he} {soldier.last_name_he}",
            "image": soldier.image_url,
            "gender":soldier.gender,
            "country": soldier.birth_country.name_en if soldier.birth_country else "",
        })

    return JsonResponse(data, safe=False)