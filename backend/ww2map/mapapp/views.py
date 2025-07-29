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
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods

class Home(View):
    template_name_en = 'mapapp/home.html'
    template_name_he = 'mapapp/home_he.html'

    def get(self, request):
        language = request.session.get('language', 'en')
        template_name = self.template_name_he if language == 'he' else self.template_name_en

        context = {
            'form': None,
            'show_date_range_form': False,
            'success': None,
            'MAPTILER_API_KEY': os.getenv('MAPTILER_API_KEY', ''),
            'GEMINI_API_KEY': os.getenv('GEMINI_API_KEY', ''),
            'DEBUG': settings.DEBUG
        }
        return render(request, template_name, context)

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

        context = {
            'form': None,
            'show_date_range_form': False,
            'success': None,
            'MAPTILER_API_KEY': os.getenv('MAPTILER_API_KEY', ''),
            'GEMINI_API_KEY': os.getenv('GEMINI_API_KEY', ''),
            'DEBUG': settings.DEBUG
        }
        return render(request, template_name, context)


def ww2map_view(request):
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        logger.info("🗺️ Starting ww2map_view")
        
        context = {
            'MAPTILER_API_KEY': os.getenv('MAPTILER_API_KEY', ''),
            'GEMINI_API_KEY': os.getenv('GEMINI_API_KEY', ''),
            'DEBUG': settings.DEBUG
        }
        
        logger.info(f"📋 Context prepared - MAPTILER: {bool(context['MAPTILER_API_KEY'])}, GEMINI: {bool(context['GEMINI_API_KEY'])}")
        
        result = render(request, 'mapapp/map.html', context)
        logger.info("✅ Map template rendered successfully")
        return result
        
    except Exception as e:
        logger.error(f"❌ Error in ww2map_view: {str(e)}", exc_info=True)
        from django.http import HttpResponse
        return HttpResponse(f"<h1>Map Error</h1><p>Error details: {str(e)}</p><p>Check server logs for more details.</p>", status=500)


@api_view(['GET'])
def event_list(request):
    try:
        # Get language from session or URL parameter
        language = request.session.get('language', 'en')
        if 'lang' in request.GET:
            language = request.GET.get('lang', 'en')
        
        events = Event.objects.all().values(
            "title", "title_en", "date", "description", "description_en", 
            "country__name_en", "country__name_he", 
            "country__latitude", "country__longitude",
            "image", "video"
        )
        
        results = []
        for event in events:
            # Helper function to get field value based on language
            def get_field_by_language(he_field, en_field):
                if language == 'he':
                    return he_field if he_field else en_field
                else:
                    return en_field if en_field else he_field
            
            # Choose event title and description based on language
            event_title = get_field_by_language(event["title"], event["title_en"])
            event_description = get_field_by_language(event["description"], event["description_en"])
            
            # Choose country name based on language (keeping existing logic)
            country_name = event["country__name_he"] if language == 'he' else event["country__name_en"]
            if not country_name:  # fallback to other language if empty
                country_name = event["country__name_en"] if language == 'he' else event["country__name_he"]
            
            event_data = {
                "title": event_title,
                "date": event["date"],
                "description": event_description,
                "image": event["image"],
                "video": event["video"],
                "country": {
                    "name": country_name,
                    "latitude": event["country__latitude"],
                    "longitude": event["country__longitude"]
                }
            }
            results.append(event_data)
            
        return JsonResponse(results, safe=False)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@api_view(['GET'])
def soldiers_list(request):
    # Get language from session or URL parameter
    language = request.session.get('language', 'en')
    if 'lang' in request.GET:
        language = request.GET.get('lang', 'en')
    
    # סינון חיילים עם מגדר תקין ושמות תקינים בלבד - מוגבל ל-100 עבור performance
    valid_name_regex = r'^[A-Za-zא-ת\s\-]+$'
    soldiers = Soldier.objects.select_related('birth_country') \
        .exclude(gender__isnull=True).exclude(gender__exact='') \
        .filter(first_name_he__regex=valid_name_regex, last_name_he__regex=valid_name_regex)[:100]

    data = []
    for soldier in soldiers:
        # Helper function to get field value based on language
        def get_field_by_language(he_field, en_field):
            if language == 'he':
                return he_field
            else:
                return en_field
        
        # Get names and country based on language
        first_name = get_field_by_language(soldier.first_name_he, soldier.first_name_en)
        last_name = get_field_by_language(soldier.last_name_he, soldier.last_name_en)
        country_name = get_field_by_language(
            soldier.birth_country.name_he if soldier.birth_country else "",
            soldier.birth_country.name_en if soldier.birth_country else ""
        )
        
        data.append({
            "id": soldier.customer_id,
            "name": f"{first_name} {last_name}",
            "image": soldier.image_url,
            "gender": soldier.gender,
            "country": country_name,
        })

    return JsonResponse(data, safe=False)

@api_view(['GET'])
def paginated_soldiers(request):
    """
    API endpoint לטעינה הדרגתית של חיילים עם אפשרות לפילטור לפי מדינה
    """
    # Get language from session or URL parameter
    language = request.session.get('language', 'en')
    if 'lang' in request.GET:
        language = request.GET.get('lang', 'en')
    
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
            Q(last_name_he__icontains=search) |
            Q(first_name_en__icontains=search) | 
            Q(last_name_en__icontains=search)
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
        # Helper function to get field value based on language
        def get_field_by_language(he_field, en_field):
            if language == 'he':
                return he_field
            else:
                return en_field
        
        # Get names based on language
        first_name = get_field_by_language(soldier.first_name_he, soldier.first_name_en)
        last_name = get_field_by_language(soldier.last_name_he, soldier.last_name_en)
        country_name = get_field_by_language(
            soldier.birth_country.name_he if soldier.birth_country else "",
            soldier.birth_country.name_en if soldier.birth_country else ""
        )
        
        data.append({
            "id": soldier.customer_id,
            "name": f"{first_name} {last_name}",
            "image": soldier.image_url,
            "gender": soldier.gender,
            "country": country_name,
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
        # Get language from session or URL parameter
        language = request.session.get('language', 'en')
        if 'lang' in request.GET:
            language = request.GET.get('lang', 'en')
        
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
        
        # Helper function to get field value based on language
        def get_field_by_language(he_field, en_field):
            if language == 'he':
                return clean_text(he_field)
            else:
                return clean_text(en_field)
        
        # Prepare the detailed response based on language
        data = {
            "id": soldier.customer_id,
            "first_name": get_field_by_language(soldier.first_name_he, soldier.first_name_en),
            "last_name": get_field_by_language(soldier.last_name_he, soldier.last_name_en),
            "previous_last_name": clean_text(soldier.previous_last_name_he),
            "nickname": clean_text(soldier.nickname_he),
            "father_name": clean_text(soldier.father_name),
            "mother_name": clean_text(soldier.mother_name),
            "gender": clean_text(soldier.gender),
            "date_of_birth": clean_date(soldier.date_of_birth),
            "birth_city": get_field_by_language(soldier.birth_city_he, soldier.birth_city_en),
            "birth_country": {
                "name": get_field_by_language(
                    soldier.birth_country.name_he, 
                    soldier.birth_country.name_en
                ) if soldier.birth_country else None,
                "code": soldier.birth_country.code if soldier.birth_country else None
            } if soldier.birth_country else None,
            "aliya_date": clean_date(soldier.aliya_date),
            "army": get_field_by_language(soldier.army_he, soldier.army_en),
            "army_role": get_field_by_language(soldier.army_role_he, soldier.army_role_en),
            "rank": clean_text(soldier.rank),
            "participation": get_field_by_language(soldier.participation_he, soldier.participation_en),
            "decorations": get_field_by_language(soldier.decorations_he, soldier.decorations_en),
            "biography": get_field_by_language(soldier.biography_he, soldier.biography_en),
            "fighting_description": get_field_by_language(soldier.fighting_description_he, soldier.fighting_description_en),
            "getto_description": get_field_by_language(soldier.getto_description_he, soldier.getto_description_en),
            "wounds": get_field_by_language(soldier.wounds_he, soldier.wounds_en),
            "date_of_death": clean_date(soldier.date_of_death),
            "place_of_death": get_field_by_language(soldier.place_of_death_he, soldier.place_of_death_en),
            "death_details": get_field_by_language(soldier.death_details_he, soldier.death_details_en),
            "image_url": soldier.image_url if soldier.image_url and soldier.image_url.strip() else None,
            "video_url": soldier.video_url if soldier.video_url and soldier.video_url.strip() else None
        }
        
        # Add full name
        first_name = data.get("first_name", "")
        last_name = data.get("last_name", "")
        data["name"] = f"{first_name} {last_name}".strip()
        
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
    
    # Timeline data - events by year (PostgreSQL compatible)
    timeline_data = Event.objects.exclude(date__isnull=True).extra(
        select={'year': "EXTRACT(year FROM date)"}
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
    
    try:
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
        
        # Apply the filtered soldier IDs to all queries (limit for performance)
        filtered_soldiers = Soldier.objects.filter(id__in=valid_soldier_ids[:5000])  # Limit to 5000 for performance
        
        # Get statistics for soldiers by country (limit results)
        soldiers_by_country = filtered_soldiers.values('birth_country__name_he').annotate(
            count=Count('id')
        ).order_by('-count')[:20]  # Top 20 countries only
        
        # Group countries into regions with error handling
        region_counts = {}
        try:
            for item in soldiers_by_country:
                country_name = item['birth_country__name_he'] or 'לא ידוע'
                region = get_region_for_country(country_name)
                region_counts[region] = region_counts.get(region, 0) + item['count']
        except Exception as e:
            # Fallback if region grouping fails
            region_counts = {'לא ידוע': len(valid_soldier_ids)}
        
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
        ).order_by('-count')[:10]  # Top 10 countries
        
        # Image distribution - soldiers with and without images (use count queries)
        with_images = filtered_soldiers.exclude(
            Q(image_url__isnull=True) | Q(image_url='') | Q(image_url__exact=' ')
        ).exclude(image_url__regex=r'^\s*$').count()
        
        without_images = filtered_soldiers.count() - with_images
        
        image_distribution = [
            {'image_status': 'עם תמונה', 'count': with_images},
            {'image_status': 'ללא תמונה', 'count': without_images}
        ]
        
        # Age distribution (calculate from date_of_birth if available) - sample only
        soldiers_with_birth_date = filtered_soldiers.exclude(date_of_birth__isnull=True)[:1000]  # Sample 1000 for performance
        
        age_counts = {}
        age_order = ["מתחת לגיל 18", "18-25", "26-35", "36-45", "מעל 45"]
        
        for soldier in soldiers_with_birth_date:
            try:
                age_at_war = 1945 - soldier.date_of_birth.year  # Using 1945 as reference year
                
                # Create meaningful age groups
                if age_at_war < 18:
                    age_group = "מתחת לגיל 18"
                elif age_at_war < 25:
                    age_group = "18-25"
                elif age_at_war < 35:
                    age_group = "26-35"
                elif age_at_war < 45:
                    age_group = "36-45"
                else:
                    age_group = "מעל 45"
                
                age_counts[age_group] = age_counts.get(age_group, 0) + 1
            except:
                # Skip invalid dates
                continue
        
        age_distribution_data = [{'age_group': group, 'count': age_counts.get(group, 0)} 
                               for group in age_order if age_counts.get(group, 0) > 0]
        
        # Decorations distribution - use count queries
        with_decorations = filtered_soldiers.filter(
            Q(decorations_he__isnull=False) & 
            ~Q(decorations_he='') & 
            ~Q(decorations_he__iexact='nan') &
            ~Q(decorations_he__iexact='null') &
            ~Q(decorations_he__exact=' ')
        ).exclude(decorations_he__regex=r'^\s*$').count()
        
        without_decorations = filtered_soldiers.count() - with_decorations
        
        decorations_distribution = [
            {'decoration_status': 'בעלי עיטורים', 'count': with_decorations},
            {'decoration_status': 'ללא עיטורים', 'count': without_decorations}
        ]
        
        # Army roles distribution (limit results)
        army_roles_distribution = filtered_soldiers.exclude(
            Q(army_role_he__isnull=True) | Q(army_role_he='') | 
            Q(army_role_he__iexact='nan') | Q(army_role_he__iexact='null')
        ).exclude(army_role_he__regex=r'^\s*$').values(
            'army_role_he'
        ).annotate(count=Count('id')).order_by('-count')[:15]  # Top 15 roles only
        
        # Cities distribution (limit results)
        cities_distribution = filtered_soldiers.exclude(
            birth_city_he__isnull=True
        ).exclude(birth_city_he='').values(
            'birth_city_he'
        ).annotate(count=Count('id')).order_by('-count')[:20]  # Top 20 cities only
        
        # Timeline data - PostgreSQL compatible
        timeline_data = Event.objects.exclude(date__isnull=True).extra(
            select={'year': "EXTRACT(year FROM date)"}
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
        
    except Exception as e:
        # Log the error for debugging
        print(f"Dashboard data error: {str(e)}")
        return JsonResponse({
            'error': 'Unable to load dashboard data',
            'details': str(e)
        }, status=500)

@api_view(['GET'])
def search_soldiers(request):
    """
    API endpoint לחיפוש לוחמים לפי שם
    """
    # Get language from session or URL parameter
    language = request.session.get('language', 'en')
    if 'lang' in request.GET:
        language = request.GET.get('lang', 'en')
    
    search_query = request.GET.get('q', '').strip()
    if not search_query:
        return JsonResponse({'soldiers': []})
    
    valid_name_regex = r'^[A-Za-zא-ת\s\-]+$'
    
    def get_field_by_language(he_field, en_field):
        if language == 'he':
            return he_field
        else:
            return en_field
    
    # חיפוש לוחמים לפי שם פרטי או משפחה
    soldiers_query = Soldier.objects.select_related('birth_country') \
        .exclude(gender__isnull=True).exclude(gender__exact='') \
        .filter(first_name_he__regex=valid_name_regex, last_name_he__regex=valid_name_regex) \
        .filter(
            Q(first_name_he__icontains=search_query) | 
            Q(last_name_he__icontains=search_query) |
            Q(first_name_en__icontains=search_query) | 
            Q(last_name_en__icontains=search_query)
        )[:20]  # מגביל ל-20 תוצאות
    
    soldiers = []
    for soldier in soldiers_query:
        first_name = get_field_by_language(soldier.first_name_he, soldier.first_name_en)
        last_name = get_field_by_language(soldier.last_name_he, soldier.last_name_en)
        country_name = get_field_by_language(
            soldier.birth_country.name_he if soldier.birth_country else "",
            soldier.birth_country.name_en if soldier.birth_country else ""
        ) or "לא ידוע"
        
        soldiers.append({
            "id": soldier.customer_id,
            "name": f"{first_name} {last_name}",
            "country": country_name,
            "image": soldier.image_url if soldier.image_url else None
        })
    
    return JsonResponse({'soldiers': soldiers})

@api_view(['GET'])
def country_name(request):
    """
    API endpoint לקבלת שם מדינה בשפה הנכונה
    """
    try:
        # Get language from session or URL parameter
        language = request.session.get('language', 'en')
        if 'lang' in request.GET:
            language = request.GET.get('lang', 'en')
        
        # Get country identifier (can be English name, Hebrew name, or code)
        country_id = request.GET.get('country', '').strip()
        if not country_id:
            return JsonResponse({"error": "Country parameter is required"}, status=400)
        
        # Try to find the country by various fields
        country = None
        
        # First try by exact English name match
        try:
            country = Country.objects.get(name_en__iexact=country_id)
        except Country.DoesNotExist:
            pass
        
        # Then try by exact Hebrew name match
        if not country:
            try:
                country = Country.objects.get(name_he__iexact=country_id)
            except Country.DoesNotExist:
                pass
        
        # Then try by partial English name match
        if not country:
            try:
                country = Country.objects.filter(name_en__icontains=country_id).first()
            except:
                pass
        
        # Then try by partial Hebrew name match
        if not country:
            try:
                country = Country.objects.filter(name_he__icontains=country_id).first()
            except:
                pass
        
        if not country:
            return JsonResponse({"error": "Country not found"}, status=404)
        
        # Return the appropriate language name
        country_name = country.name_he if language == 'he' else country.name_en
        if not country_name:  # fallback to other language if empty
            country_name = country.name_en if language == 'he' else country.name_he
        
        return JsonResponse({
            "name": country_name,
            "name_he": country.name_he,
            "name_en": country.name_en
        })
        
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@api_view(['GET'])
def country_english_name(request):
    """
    API endpoint לקבלת שם מדינה באנגלית (לצורך דגלים)
    """
    try:
        # Get country identifier (can be English name, Hebrew name, or code)
        country_id = request.GET.get('country', '').strip()
        if not country_id:
            return JsonResponse({"error": "Country parameter is required"}, status=400)
        
        # Try to find the country by various fields
        country = None
        
        # First try by exact English name match
        try:
            country = Country.objects.get(name_en__iexact=country_id)
        except Country.DoesNotExist:
            pass
        
        # Then try by exact Hebrew name match
        if not country:
            try:
                country = Country.objects.get(name_he__iexact=country_id)
            except Country.DoesNotExist:
                pass
        
        # Then try by partial English name match
        if not country:
            try:
                country = Country.objects.filter(name_en__icontains=country_id).first()
            except:
                pass
        
        # Then try by partial Hebrew name match
        if not country:
            try:
                country = Country.objects.filter(name_he__icontains=country_id).first()
            except:
                pass
        
        if not country:
            return JsonResponse({"error": "Country not found"}, status=404)
        
        # Always return English name for flag purposes
        english_name = country.name_en
        if not english_name:
            return JsonResponse({"error": "English name not available"}, status=404)
        
        return JsonResponse({
            "english_name": english_name.lower()  # Return lowercase for flag mapping
        })
        
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)