from django.shortcuts import render, redirect
from django.views import View
from .models import Soldier
from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.http import JsonResponse
from .models import Event, Country
from .forms import DateRangeForm
import csv
import os 
from django.http import JsonResponse
from django.conf import settings
from django.db.models import Count
from django.db.models import Q

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
            "title", "date", "description", 
            "country__name_en", "country__name_he", 
            "country__latitude", "country__longitude",
            "image", "video"
        )
        
        # Debug information
        print("🔍 כל האירועים:", list(events))
        print("🔍 מדינות ייחודיות:", set(ev["country__name_en"] for ev in events if ev["country__name_en"]))

        results = []
        for event in events:
            event["country__name"] = event.pop("country__name_en")
            event["country__name_he"] = event.pop("country__name_he")
            # Add country coordinates to the event data
            event["country"] = {
                "name": event["country__name"],
                "name_he": event["country__name_he"],
                "latitude": event.pop("country__latitude"),
                "longitude": event.pop("country__longitude")
            }
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

@api_view(['GET'])
def paginated_soldiers(request):
    """
    API endpoint לטעינה הדרגתית של חיילים עם אפשרות לפילטור לפי מדינה
    """
    page = int(request.GET.get('page', 1))
    limit = int(request.GET.get('limit', 50))
    country = request.GET.get('country', '').strip()
    search = request.GET.get('search', '').strip()
    
    # Advanced filters
    gender = request.GET.get('gender', '')
    rank = request.GET.get('rank', '')
    year_from = request.GET.get('year_from', '')
    year_to = request.GET.get('year_to', '')
    sort_by = request.GET.get('sort_by', 'name')
    
    # Start with all soldiers
    soldiers_query = Soldier.objects.select_related('birth_country')
    
    # Apply country filter if provided
    if country:
        # התאמה לשמות מדינות שונים - במיוחד עבור ארה"ב
        if country.lower() in ['united states', 'usa', 'america', 'united states of america']:
            # חיפוש של כל הווריאציות של ארה"ב
            soldiers_query = soldiers_query.filter(
                Q(birth_country__name_en__icontains='USA') |
                Q(birth_country__name_en__icontains='United States') |
                Q(birth_country__name_en__icontains='America') |
                Q(birth_country__name_he__icontains='ארצות הברית')
            )
        else:
            # חיפוש רגיל לפי שם המדינה
            soldiers_query = soldiers_query.filter(
                Q(birth_country__name_en__icontains=country) |
                Q(birth_country__name_he__icontains=country)
            )
    
    # Apply search filter if provided
    if search:
        soldiers_query = soldiers_query.filter(
            Q(first_name_he__icontains=search) | 
            Q(last_name_he__icontains=search)
        )
    
    # Apply advanced filters
    if gender:
        soldiers_query = soldiers_query.filter(gender=gender)
    
    if rank:
        soldiers_query = soldiers_query.filter(rank__icontains=rank)
    
    if year_from:
        try:
            # Convert year to date range for filtering
            from_date = f"{year_from}-01-01"
            soldiers_query = soldiers_query.filter(date_of_birth__gte=from_date)
        except (ValueError, TypeError):
            pass
    
    if year_to:
        try:
            # Convert year to date range for filtering
            to_date = f"{year_to}-12-31"
            soldiers_query = soldiers_query.filter(date_of_birth__lte=to_date)
        except (ValueError, TypeError):
            pass
    
    # Apply sorting
    if sort_by == 'name':
        soldiers_query = soldiers_query.order_by('first_name_he', 'last_name_he')
    elif sort_by == 'birth_date':
        soldiers_query = soldiers_query.order_by('date_of_birth')
    elif sort_by == 'rank':
        soldiers_query = soldiers_query.order_by('rank')
    elif sort_by == 'aliya_date':
        soldiers_query = soldiers_query.order_by('aliya_date')
    
    # Calculate total count for pagination info
    total_count = soldiers_query.count()
    
    # Calculate pagination
    offset = (page - 1) * limit
    soldiers = soldiers_query[offset:offset + limit]
    
    # Prepare data
    data = []
    for soldier in soldiers:
        data.append({
            "id": soldier.customer_id,
            "name": f"{soldier.first_name_he} {soldier.last_name_he}",
            "image": soldier.image_url,
            "gender": soldier.gender,
            "country": soldier.birth_country.name_en if soldier.birth_country else "",
        })
    
    # Return data with pagination info
    return JsonResponse({
        'soldiers': data,
        'pagination': {
            'total': total_count,
            'page': page,
            'limit': limit,
            'pages': (total_count + limit - 1) // limit  # Ceiling division
        }
    })

@api_view(['GET'])
def soldier_detail(request, soldier_id):
    """
    API endpoint לקבלת מידע מפורט על לוחם ספציפי
    """
    try:
        # Fetch the soldier by customer_id with related country
        soldier = Soldier.objects.select_related('birth_country').get(customer_id=soldier_id)
        
        # Prepare the detailed response
        data = {
            "id": soldier.customer_id,
            "first_name_he": soldier.first_name_he,
            "last_name_he": soldier.last_name_he,
            "first_name_en": soldier.first_name_en,
            "last_name_en": soldier.last_name_en,
            "previous_last_name_he": soldier.previous_last_name_he,
            "nickname_he": soldier.nickname_he,
            "name": f"{soldier.first_name_he} {soldier.last_name_he}",
            "father_name": soldier.father_name,
            "mother_name": soldier.mother_name,
            "gender": soldier.gender,
            "date_of_birth": soldier.date_of_birth.isoformat() if soldier.date_of_birth else None,
            "birth_city_he": soldier.birth_city_he,
            "birth_city_en": soldier.birth_city_en,
            "birth_country": {
                "name_he": soldier.birth_country.name_he if soldier.birth_country else None,
                "name_en": soldier.birth_country.name_en if soldier.birth_country else None,
                "code": soldier.birth_country.code if soldier.birth_country else None
            } if soldier.birth_country else None,
            "aliya_date": soldier.aliya_date.isoformat() if soldier.aliya_date else None,
            "army_he": soldier.army_he,
            "army_en": soldier.army_en,
            "army_role_he": soldier.army_role_he,
            "army_role_en": soldier.army_role_en,
            "rank": soldier.rank,
            "participation_he": soldier.participation_he,
            "participation_en": soldier.participation_en,
            "decorations_he": soldier.decorations_he,
            "decorations_en": soldier.decorations_en,
            "other_fighting_context_he": soldier.other_fighting_context_he,
            "enlist_reason_he": soldier.enlist_reason_he,
            "release_reason_he": soldier.release_reason_he,
            "biography_he": soldier.biography_he,
            "biography_en": soldier.biography_en,
            "fighting_description_he": soldier.fighting_description_he,
            "fighting_description_en": soldier.fighting_description_en,
            "getto_description_he": soldier.getto_description_he,
            "getto_description_en": soldier.getto_description_en,
            "wounds_he": soldier.wounds_he,
            "wounds_en": soldier.wounds_en,
            "date_of_death": soldier.date_of_death.isoformat() if soldier.date_of_death else None,
            "place_of_death_he": soldier.place_of_death_he,
            "place_of_death_en": soldier.place_of_death_en,
            "death_details_he": soldier.death_details_he,
            "death_details_en": soldier.death_details_en,
            "image_url": soldier.image_url,
            "video_url": soldier.video_url
        }
        
        # Filter out any 'nan' or empty values
        filtered_data = {}
        for key, value in data.items():
            # Skip empty, None, or 'nan' string values
            if value is None:
                continue
                
            if isinstance(value, str):
                if value.lower() == 'nan' or value.strip() == '':
                    continue
                    
            if isinstance(value, dict):
                # For nested objects like birth_country, filter their values too
                nested_filtered = {}
                for k, v in value.items():
                    if v is not None and not (isinstance(v, str) and (v.lower() == 'nan' or v.strip() == '')):
                        nested_filtered[k] = v
                
                # Only add the nested object if it has any valid fields
                if nested_filtered:
                    filtered_data[key] = nested_filtered
            else:
                filtered_data[key] = value
        
        return JsonResponse(filtered_data)
        
    except Soldier.DoesNotExist:
        return JsonResponse({"error": f"לוחם עם מזהה {soldier_id} לא נמצא"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

def dashboard_view(request):
    """
    View for the dashboard page with statistics and graphs
    """
    # Get statistics for soldiers by country
    soldiers_by_country = Soldier.objects.values('birth_country__name_he').annotate(
        count=Count('id')
    ).order_by('-count')[:10]  # Top 10 countries
    
    # Get statistics for soldiers by gender
    soldiers_by_gender = Soldier.objects.values('gender').annotate(
        count=Count('id')
    ).order_by('-count')
    
    # Get statistics for events by country
    events_by_country = Event.objects.values('country__name_he').annotate(
        count=Count('id')
    ).order_by('-count')[:10]  # Top 10 countries
    
    # Get statistics for soldiers by army
    soldiers_by_army = Soldier.objects.exclude(army_he__isnull=True).exclude(army_he='').values(
        'army_he'
    ).annotate(count=Count('id')).order_by('-count')[:10]  # Top 10 armies
    
    # Context data to pass to the template
    context = {
        'soldiers_by_country': list(soldiers_by_country),
        'soldiers_by_gender': list(soldiers_by_gender),
        'events_by_country': list(events_by_country),
        'soldiers_by_army': list(soldiers_by_army),
        'total_soldiers': Soldier.objects.count(),
        'total_events': Event.objects.count(),
        'total_countries': Country.objects.count(),
    }
    
    return render(request, 'mapapp/dashboard.html', context)


@api_view(['GET'])
def dashboard_data(request):
    """
    API endpoint to get dashboard data in JSON format
    """
    # Get statistics for soldiers by country
    soldiers_by_country = Soldier.objects.values('birth_country__name_he').annotate(
        count=Count('id')
    ).order_by('-count')[:10]
    
    # Get statistics for soldiers by gender
    soldiers_by_gender = Soldier.objects.values('gender').annotate(
        count=Count('id')
    ).order_by('-count')
    
    # Get statistics for events by country
    events_by_country = Event.objects.values('country__name_he').annotate(
        count=Count('id')
    ).order_by('-count')[:10]
    
    # Get statistics for soldiers by army
    soldiers_by_army = Soldier.objects.exclude(army_he__isnull=True).exclude(army_he='').values(
        'army_he'
    ).annotate(count=Count('id')).order_by('-count')[:10]
    
    data = {
        'soldiers_by_country': list(soldiers_by_country),
        'soldiers_by_gender': list(soldiers_by_gender),
        'events_by_country': list(events_by_country), 
        'soldiers_by_army': list(soldiers_by_army),
        'total_soldiers': Soldier.objects.count(),
        'total_events': Event.objects.count(),
        'total_countries': Country.objects.count(),
    }
    
    return JsonResponse(data)