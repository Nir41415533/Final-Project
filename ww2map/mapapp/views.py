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
import re
from collections import Counter

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
        # print("🔍 כל האירועים:", list(events))
        # print("🔍 מדינות ייחודיות:", set(ev["country__name_en"] for ev in events if ev["country__name_en"]))

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
    # סינון חיילים עם מגדר תקין ושמות תקינים בלבד
    valid_name_regex = r'^[A-Za-zא-ת\s\-]+$'
    soldiers = Soldier.objects.select_related('birth_country') \
        .exclude(gender__isnull=True).exclude(gender__exact='') \
        .filter(first_name_he__regex=valid_name_regex, last_name_he__regex=valid_name_regex)[:1000]

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
    valid_name_regex = r'^[A-Za-zא-ת\s\-]+$'
    page = int(request.GET.get('page', 1))
    limit = int(request.GET.get('limit', 50))
    country = request.GET.get('country', '').strip()
    search = request.GET.get('search', '').strip()
    gender = request.GET.get('gender', '')
    rank = request.GET.get('rank', '')
    year_from = request.GET.get('year_from', '')
    year_to = request.GET.get('year_to', '')
    sort_by = request.GET.get('sort_by', 'name')

    soldiers_query = Soldier.objects.select_related('birth_country') \
        .exclude(gender__isnull=True).exclude(gender__exact='') \
        .filter(first_name_he__regex=valid_name_regex, last_name_he__regex=valid_name_regex)

    # Apply country filter if provided
    if country:
        if country.lower() in ['united states', 'usa', 'america', 'united states of america']:
            soldiers_query = soldiers_query.filter(
                Q(birth_country__name_en__icontains='USA') |
                Q(birth_country__name_en__icontains='United States') |
                Q(birth_country__name_en__icontains='America') |
                Q(birth_country__name_he__icontains='ארצות הברית')
            )
        else:
            soldiers_query = soldiers_query.filter(
                Q(birth_country__name_en__icontains=country) |
                Q(birth_country__name_he__icontains=country)
            )
    if search:
        soldiers_query = soldiers_query.filter(
            Q(first_name_he__icontains=search) | 
            Q(last_name_he__icontains=search)
        )
    if gender:
        # Convert gender string to numeric value
        if gender == 'זכר':
            soldiers_query = soldiers_query.filter(gender__in=['1', '1.0'])
        elif gender == 'נקבה':
            soldiers_query = soldiers_query.filter(gender__in=['0', '0.0'])
    if rank:
        soldiers_query = soldiers_query.filter(rank__icontains=rank)
    if year_from:
        try:
            from_date = f"{year_from}-01-01"
            soldiers_query = soldiers_query.filter(date_of_birth__gte=from_date)
        except (ValueError, TypeError):
            pass
    if year_to:
        try:
            to_date = f"{year_to}-12-31"
            soldiers_query = soldiers_query.filter(date_of_birth__lte=to_date)
        except (ValueError, TypeError):
            pass
    if sort_by == 'name':
        soldiers_query = soldiers_query.order_by('first_name_he', 'last_name_he')
    elif sort_by == 'birth_date':
        soldiers_query = soldiers_query.order_by('date_of_birth')
    elif sort_by == 'rank':
        soldiers_query = soldiers_query.order_by('rank')
    elif sort_by == 'aliya_date':
        soldiers_query = soldiers_query.order_by('aliya_date')
    total_count = soldiers_query.count()
    offset = (page - 1) * limit
    soldiers = soldiers_query[offset:offset + limit]
    data = []
    for soldier in soldiers:
        data.append({
            "id": soldier.customer_id,
            "name": f"{soldier.first_name_he} {soldier.last_name_he}",
            "image": soldier.image_url,
            "gender": soldier.gender,
            "country": soldier.birth_country.name_en if soldier.birth_country else "",
        })
    return JsonResponse({
        'soldiers': data,
        'pagination': {
            'total': total_count,
            'page': page,
            'limit': limit,
            'pages': (total_count + limit - 1) // limit
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
        
        # Helper function to clean text values
        def clean_text(text):
            if not text:
                return None
            if isinstance(text, str):
                cleaned = text.strip()
                # Only filter out obvious empty values
                if cleaned.lower() == 'nan' or cleaned == '':
                    return None
                return cleaned
            return text
        
        # Helper function to clean and format dates
        def clean_date(date_field):
            return date_field.isoformat() if date_field else None
        
        # Prepare the detailed response
        data = {
            "id": soldier.customer_id,
            "first_name_he": clean_text(soldier.first_name_he),
            "last_name_he": clean_text(soldier.last_name_he),
            "name": f"{clean_text(soldier.first_name_he) or ''} {clean_text(soldier.last_name_he) or ''}".strip(),
            "previous_last_name_he": clean_text(soldier.previous_last_name_he),
            "nickname_he": clean_text(soldier.nickname_he),
            "father_name": clean_text(soldier.father_name),
            "mother_name": clean_text(soldier.mother_name),
            "gender": clean_text(soldier.gender),
            "date_of_birth": clean_date(soldier.date_of_birth),
            "birth_city_he": clean_text(soldier.birth_city_he),
            "birth_country": {
                "name_he": clean_text(soldier.birth_country.name_he) if soldier.birth_country else None,
                "code": soldier.birth_country.code if soldier.birth_country else None
            } if soldier.birth_country else None,
            "aliya_date": clean_date(soldier.aliya_date),
            "army_he": clean_text(soldier.army_he),
            "army_role_he": clean_text(soldier.army_role_he),
            "rank": clean_text(soldier.rank),
            "participation_he": clean_text(soldier.participation_he),
            "decorations_he": clean_text(soldier.decorations_he),
            "biography_he": clean_text(soldier.biography_he),
            "fighting_description_he": clean_text(soldier.fighting_description_he),
            "getto_description_he": clean_text(soldier.getto_description_he),
            "wounds_he": clean_text(soldier.wounds_he),
            "date_of_death": clean_date(soldier.date_of_death),
            "place_of_death_he": clean_text(soldier.place_of_death_he),
            "death_details_he": clean_text(soldier.death_details_he),
            "image_url": soldier.image_url if soldier.image_url and soldier.image_url.strip() else None,
            "video_url": soldier.video_url if soldier.video_url and soldier.video_url.strip() else None
        }
        
        # Return data - only remove None values, keep everything else
        filtered_data = {k: v for k, v in data.items() if v is not None}
        
        return JsonResponse(filtered_data)
        
    except Soldier.DoesNotExist:
        return JsonResponse({"error": "לוחם לא נמצא"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

def dashboard_view(request):
    """
    View for the dashboard page with statistics and graphs
    """
    # Helper function to validate name using regex (same as in other endpoints)
    def is_valid_name(name):
        if not name:
            return False
        # Allow Hebrew letters, Latin letters, spaces, hyphens, and single quotes
        pattern = r'^[\u0590-\u05FF\u0600-\u06FFa-zA-Z\s\-\']+$'
        return bool(re.match(pattern, name))
    
    # Filter soldiers with valid data (same filtering as other endpoints)
    valid_soldiers = Soldier.objects.exclude(
        Q(gender__isnull=True) | Q(gender='')
    ).filter(
        Q(first_name_he__isnull=False) & ~Q(first_name_he='') &
        Q(last_name_he__isnull=False) & ~Q(last_name_he='')
    )
    
    # Further filter by name validity
    valid_soldier_ids = []
    for soldier in valid_soldiers:
        if (is_valid_name(soldier.first_name_he) and is_valid_name(soldier.last_name_he)):
            valid_soldier_ids.append(soldier.id)
    
    # Apply the filtered soldier IDs to all queries
    filtered_soldiers = Soldier.objects.filter(id__in=valid_soldier_ids)
    
    # Get statistics for soldiers by country
    soldiers_by_country = filtered_soldiers.values('birth_country__name_he').annotate(
        count=Count('id')
    ).order_by('-count')
    
    # Get statistics for soldiers by gender - only valid gender values  
    soldiers_by_gender = filtered_soldiers.filter(
        Q(gender='1') | Q(gender='1.0') | Q(gender='0') | Q(gender='0.0')
    ).values('gender').annotate(
        count=Count('id')
    ).order_by('-count')
    
    # Get statistics for events by country
    events_by_country = Event.objects.values('country__name_he').annotate(
        count=Count('id')
    ).order_by('-count')[:10]  # Top 10 countries
    
    # Image distribution - soldiers with and without images
    soldiers_with_images = filtered_soldiers.exclude(
        Q(image_url__isnull=True) | Q(image_url='') | Q(image_url__exact=' ')
    ).exclude(image_url__regex=r'^\s*$')
    
    with_images = soldiers_with_images.count()
    without_images = len(valid_soldier_ids) - with_images
    
    image_distribution = [
        {'image_status': 'עם תמונה', 'count': with_images},
        {'image_status': 'ללא תמונה', 'count': without_images}
    ]
    
    # Age distribution (calculate from date_of_birth if available)
    age_distribution = []
    current_year = 1945  # Using 1945 as reference year for WWII
    soldiers_with_birth_date = filtered_soldiers.exclude(date_of_birth__isnull=True)
    
    for soldier in soldiers_with_birth_date:
        age_at_war = current_year - soldier.date_of_birth.year
        
        # Create meaningful age groups
        if age_at_war < 18:
            age_group = "מתחת לגיל 18"
        elif age_at_war < 25:
            age_group = "18-24"
        elif age_at_war < 35:
            age_group = "25-34"  
        elif age_at_war < 45:
            age_group = "35-44"
        elif age_at_war < 55:
            age_group = "45-54"
        else:
            age_group = "55 ומעלה"
            
        age_distribution.append(age_group)
    
    # Count age groups
    age_counts = Counter(age_distribution)
    
    # Sort age groups in logical order
    age_order = ["מתחת לגיל 18", "18-24", "25-34", "35-44", "45-54", "55 ומעלה"]
    age_distribution_data = [{'age_group': group, 'count': age_counts.get(group, 0)} 
                           for group in age_order if age_counts.get(group, 0) > 0]
    
    # Decorations distribution - analyze real decorations data
    soldiers_with_decorations = filtered_soldiers.filter(
        Q(decorations_he__isnull=False) & 
        ~Q(decorations_he='') & 
        ~Q(decorations_he__iexact='nan') &
        ~Q(decorations_he__iexact='null') &
        ~Q(decorations_he__exact=' ')
    ).exclude(decorations_he__regex=r'^\s*$')  # Exclude strings that are only whitespace
    
    # Count soldiers with and without decorations
    with_decorations = soldiers_with_decorations.count()
    without_decorations = len(valid_soldier_ids) - with_decorations  # Use filtered count here too
    
    decorations_distribution = [
        {'decoration_status': 'בעלי עיטורים', 'count': with_decorations},
        {'decoration_status': 'ללא עיטורים', 'count': without_decorations}
    ]
    
    # Army roles distribution
    army_roles_distribution = filtered_soldiers.exclude(
        Q(army_role_he__isnull=True) | Q(army_role_he='') | 
        Q(army_role_he__iexact='nan') | Q(army_role_he__iexact='null')
    ).exclude(army_role_he__regex=r'^\s*$').values(
        'army_role_he'
    ).annotate(count=Count('id')).order_by('-count')
    
    # Cities distribution (using birth_city_he field)
    cities_distribution = filtered_soldiers.exclude(birth_city_he__isnull=True).exclude(birth_city_he='').values(
        'birth_city_he'
    ).annotate(count=Count('id')).order_by('-count')
    
    # Timeline data - events by year
    timeline_data = Event.objects.exclude(date__isnull=True).extra(
        select={'year': "strftime('%%Y', date)"}
    ).values('year').annotate(count=Count('id')).order_by('year')
    
    # Context data to pass to the template
    context = {
        'soldiers_by_country': list(soldiers_by_country),
        'soldiers_by_gender': list(soldiers_by_gender),
        'events_by_country': list(events_by_country),
        'image_distribution': image_distribution,
        'decorations_distribution': decorations_distribution,
        'army_roles_distribution': list(army_roles_distribution),
        'cities_distribution': list(cities_distribution),
        'timeline_data': list(timeline_data),
        'total_soldiers': len(valid_soldier_ids),  # Use the actual filtered count
        'total_events': Event.objects.count(),
        'total_countries': Country.objects.count(),
        'total_decorations': with_decorations,
        'age_distribution': age_distribution_data,
    }
    
    return render(request, 'mapapp/dashboard.html', context)

def get_region_for_country(country_name):
    """Helper function to map countries to regions"""
    region_mapping = {
        'אירופה המזרחית': ['פולין', 'רוסיה', 'אוקראינה', 'בלארוס', 'ליטא', 'לטביה', 'אסטוניה', 'רומניה', 'בולגריה', 'יוגוסלביה', 'צ\'כוסלובקיה', 'הונגריה'],
        'אירופה המערבית': ['בריטניה', 'צרפת', 'גרמניה', 'איטליה', 'הולנד', 'בלגיה', 'לוקסמבורג', 'שוויץ', 'אוסטריה', 'ספרד', 'פורטוגל'],
        'צפון אפריקה': ['מרוקו', 'אלג\'יריה', 'תוניסיה', 'לוב', 'מצרים'],
        'מזרח התיכון': ['ישראל', 'לבנון', 'סוריה', 'עיראק', 'איראן', 'טורקיה', 'ירדן'],
        'אמריקה': ['ארצות הברית', 'קנדה', 'מקסיקו', 'ארגנטינה', 'ברזיל', 'צ\'ילה', 'קולומביה', 'פרו']
    }
    
    for region, countries in region_mapping.items():
        if country_name in countries:
            return region
    return 'אחר'

@api_view(['GET'])
def dashboard_data(request):
    """
    API endpoint to get dashboard data in JSON format
    """
    
    # Helper function to validate name using regex (same as in other endpoints)
    def is_valid_name(name):
        if not name:
            return False
        # Allow Hebrew letters, Latin letters, spaces, hyphens, and single quotes
        pattern = r'^[\u0590-\u05FF\u0600-\u06FFa-zA-Z\s\-\']+$'
        return bool(re.match(pattern, name))
    
    # Filter soldiers with valid data (same filtering as other endpoints)
    valid_soldiers = Soldier.objects.exclude(
        Q(gender__isnull=True) | Q(gender='')
    ).filter(
        Q(first_name_he__isnull=False) & ~Q(first_name_he='') &
        Q(last_name_he__isnull=False) & ~Q(last_name_he='')
    )
    
    # Further filter by name validity
    valid_soldier_ids = []
    for soldier in valid_soldiers:
        if (is_valid_name(soldier.first_name_he) and is_valid_name(soldier.last_name_he)):
            valid_soldier_ids.append(soldier.id)
    
    # Apply the filtered soldier IDs to all queries
    filtered_soldiers = Soldier.objects.filter(id__in=valid_soldier_ids)
    
    # Get statistics for soldiers by country
    soldiers_by_country = filtered_soldiers.values('birth_country__name_he').annotate(
        count=Count('id')
    ).order_by('-count')
    
    # Group countries into regions
    region_counts = {}
    for item in soldiers_by_country:
        country_name = item['birth_country__name_he'] or 'לא ידוע'
        region = get_region_for_country(country_name)
        region_counts[region] = region_counts.get(region, 0) + item['count']
    
    # Convert to list format
    region_distribution = [{'region': region, 'count': count} 
                         for region, count in region_counts.items()]
    
    # Sort regions by count
    region_distribution.sort(key=lambda x: x['count'], reverse=True)
    
    # Get statistics for soldiers by gender - only valid gender values
    soldiers_by_gender = filtered_soldiers.filter(
        Q(gender='1') | Q(gender='1.0') | Q(gender='0') | Q(gender='0.0')
    ).values('gender').annotate(
        count=Count('id')
    ).order_by('-count')
    
    # Get statistics for events by country
    events_by_country = Event.objects.values('country__name_he').annotate(
        count=Count('id')
    ).order_by('-count')[:10]
    
    # Image distribution - soldiers with and without images
    soldiers_with_images = filtered_soldiers.exclude(
        Q(image_url__isnull=True) | Q(image_url='') | Q(image_url__exact=' ')
    ).exclude(image_url__regex=r'^\s*$')
    
    with_images = soldiers_with_images.count()
    without_images = len(valid_soldier_ids) - with_images
    
    image_distribution = [
        {'image_status': 'עם תמונה', 'count': with_images},
        {'image_status': 'ללא תמונה', 'count': without_images}
    ]
    
    # Age distribution (calculate from date_of_birth if available)
    age_distribution = []
    current_year = 1945  # Using 1945 as reference year for WWII
    soldiers_with_birth_date = filtered_soldiers.exclude(date_of_birth__isnull=True)
    
    for soldier in soldiers_with_birth_date:
        age_at_war = current_year - soldier.date_of_birth.year
        
        # Create meaningful age groups
        if age_at_war < 18:
            age_group = "מתחת לגיל 18"
        elif age_at_war < 25:
            age_group = "18-24"
        elif age_at_war < 35:
            age_group = "25-34"  
        elif age_at_war < 45:
            age_group = "35-44"
        elif age_at_war < 55:
            age_group = "45-54"
        else:
            age_group = "55 ומעלה"
            
        age_distribution.append(age_group)
    
    # Count age groups
    age_counts = Counter(age_distribution)
    
    # Sort age groups in logical order
    age_order = ["מתחת לגיל 18", "18-24", "25-34", "35-44", "45-54", "55 ומעלה"]
    age_distribution_data = [{'age_group': group, 'count': age_counts.get(group, 0)} 
                           for group in age_order if age_counts.get(group, 0) > 0]
    
    # Decorations distribution - analyze real decorations data
    soldiers_with_decorations = filtered_soldiers.filter(
        Q(decorations_he__isnull=False) & 
        ~Q(decorations_he='') & 
        ~Q(decorations_he__iexact='nan') &
        ~Q(decorations_he__iexact='null') &
        ~Q(decorations_he__exact=' ')
    ).exclude(decorations_he__regex=r'^\s*$')  # Exclude strings that are only whitespace
    
    # Count soldiers with and without decorations
    with_decorations = soldiers_with_decorations.count()
    without_decorations = len(valid_soldier_ids) - with_decorations  # Use filtered count here too
    
    decorations_distribution = [
        {'decoration_status': 'בעלי עיטורים', 'count': with_decorations},
        {'decoration_status': 'ללא עיטורים', 'count': without_decorations}
    ]
    
    # Army roles distribution
    army_roles_distribution = filtered_soldiers.exclude(
        Q(army_role_he__isnull=True) | Q(army_role_he='') | 
        Q(army_role_he__iexact='nan') | Q(army_role_he__iexact='null')
    ).exclude(army_role_he__regex=r'^\s*$').values(
        'army_role_he'
    ).annotate(count=Count('id')).order_by('-count')
    
    # Cities distribution (using birth_city_he field)
    cities_distribution = filtered_soldiers.exclude(birth_city_he__isnull=True).exclude(birth_city_he='').values(
        'birth_city_he'
    ).annotate(count=Count('id')).order_by('-count')
    
    # Timeline data
    timeline_data = Event.objects.exclude(date__isnull=True).extra(
        select={'year': "strftime('%%Y', date)"}
    ).values('year').annotate(count=Count('id')).order_by('year')
    
    data = {
        'soldiers_by_country': list(soldiers_by_country),
        'soldiers_by_gender': list(soldiers_by_gender),
        'events_by_country': list(events_by_country), 
        'image_distribution': image_distribution,
        'decorations_distribution': decorations_distribution,
        'army_roles_distribution': list(army_roles_distribution),
        'cities_distribution': list(cities_distribution),
        'timeline_data': list(timeline_data),
        'region_distribution': region_distribution,
        'total_soldiers': len(valid_soldier_ids),  # Use the actual filtered count
        'total_events': Event.objects.count(),
        'total_countries': Country.objects.count(),
        'total_decorations': with_decorations,
        'age_distribution': age_distribution_data,
    }
    
    
    return JsonResponse(data)

@api_view(['GET'])
def search_soldiers(request):
    """
    API endpoint לחיפוש לוחמים על פי שם
    """
    query = request.GET.get('q', '').strip()
    limit = int(request.GET.get('limit', 10))
    
    if not query or len(query) < 2:
        return JsonResponse({'soldiers': []})
    
    # Filter soldiers with valid names and data
    valid_name_regex = r'^[A-Za-zא-ת\s\-]+$'
    soldiers_query = Soldier.objects.select_related('birth_country') \
        .exclude(gender__isnull=True).exclude(gender__exact='') \
        .filter(first_name_he__regex=valid_name_regex, last_name_he__regex=valid_name_regex)
    
    # Search in first name or last name
    soldiers_query = soldiers_query.filter(
        Q(first_name_he__icontains=query) | 
        Q(last_name_he__icontains=query)
    ).order_by('first_name_he', 'last_name_he')[:limit]
    
    soldiers = []
    for soldier in soldiers_query:
        soldiers.append({
            "id": soldier.customer_id,
            "name": f"{soldier.first_name_he} {soldier.last_name_he}",
            "country": soldier.birth_country.name_he if soldier.birth_country else "לא ידוע",
            "image": soldier.image_url if soldier.image_url else None
        })
    
    return JsonResponse({'soldiers': soldiers})