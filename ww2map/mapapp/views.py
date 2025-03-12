from django.shortcuts import render, redirect
from django.views import View
from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.http import JsonResponse
from .models import Event
from .forms import DateRangeForm  # ✅ זה מה שהיה חסר!

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
    year = request.GET.get('year')
    if year:
        events = Event.objects.filter(date__year=year).values(
            "title", "date", "description", "country__name", "image", "video"
        )
    else:
        events = Event.objects.all().values(
            "title", "date", "description", "country__name", "image", "video"
        )

    return JsonResponse(list(events), safe=False)
