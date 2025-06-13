import pandas as pd
from mapapp.models import Soldier, Country
from datetime import datetime
from django.db import models

def parse_date(value):
    if isinstance(value, str) and "####" in value:
        return None
    if pd.isna(value):
        return None
    if isinstance(value, datetime):
        return value.date()
    try:
        return pd.to_datetime(value).date()
    except:
        return None

def is_valid_name(name):
    if pd.isna(name):
        return False
    if isinstance(name, str) and name.strip() == '':
        return False
    if isinstance(name, str) and name.lower() == 'nan':
        return False
    return True

def check_us_country_and_soldiers():
    """
    בודק את מדינת ארה"ב ואת מספר החיילים המשויכים אליה
    """
    # בדיקת כל המדינות שייתכן שהן ארה"ב
    us_countries = Country.objects.filter(
        models.Q(name_en__icontains='United States') | 
        models.Q(name_en__icontains='USA') |
        models.Q(name_en__icontains='America') |
        models.Q(name_he__icontains='ארצות הברית')
    )
    
    print("\n🔍 מדינות שקשורות לארה"ב במסד הנתונים:")
    print("-" * 50)
    
    if not us_countries.exists():
        print("לא נמצאו מדינות שקשורות לארה"ב")
    else:
        for country in us_countries:
            # ספירת חיילים למדינה זו
            soldiers_count = Soldier.objects.filter(birth_country=country).count()
            
            print(f"קוד: {country.code}")
            print(f"שם באנגלית: '{country.name_en}'")
            print(f"שם בעברית: '{country.name_he}'")
            print(f"מספר חיילים: {soldiers_count}")
            print("-" * 50)
    
    # בדיקת החיילים שמשויכים למדינות אלו
    if us_countries.exists():
        soldiers = Soldier.objects.filter(birth_country__in=us_countries)
        
        print(f"\n🔍 פרטי {soldiers.count()} חיילים מארה"ב:")
        print("-" * 50)
        
        for soldier in soldiers:
            print(f"ID: {soldier.customer_id}")
            print(f"שם: {soldier.first_name_he} {soldier.last_name_he}")
            print(f"עיר לידה: {soldier.birth_city_he}")
            print(f"תאריך לידה: {soldier.date_of_birth}")
            print(f"מדינת לידה: {soldier.birth_country.name_en} ({soldier.birth_country.code})")
            print("-" * 50)

def check_soldiers_without_country():
    """
    בודק לוחמים ללא מדינה ידועה ומציג את המידע שלהם
    """
    # מוצא לוחמים ללא מדינה
    soldiers_without_country = Soldier.objects.filter(birth_country__isnull=True)
    total_count = soldiers_without_country.count()
    
    print(f"\n🔍 נמצאו {total_count} לוחמים ללא מדינה ידועה:")
    print("-" * 50)
    
    # מציג את המידע של כל לוחם
    for soldier in soldiers_without_country:
        print(f"ID: {soldier.customer_id}")
        print(f"שם: {soldier.first_name_he} {soldier.last_name_he}")
        print(f"עיר לידה: {soldier.birth_city_he}")
        print(f"תאריך לידה: {soldier.date_of_birth}")
        print("-" * 50)
    
    return total_count

def clean_invalid_soldiers():
    """
    מוחק לוחמים עם שמות לא תקינים (NaN או ריקים)
    """
    deleted_count = 0
    total_count = Soldier.objects.count()
    
    # מוצא את כל הלוחמים עם שמות לא תקינים
    invalid_soldiers = Soldier.objects.filter(
        models.Q(first_name_he__isnull=True) |
        models.Q(last_name_he__isnull=True) |
        models.Q(first_name_he='') |
        models.Q(last_name_he='') |
        models.Q(first_name_he__iexact='nan') |
        models.Q(last_name_he__iexact='nan')
    )
    
    # מוחק אותם
    deleted_count = invalid_soldiers.count()
    invalid_soldiers.delete()
    
    print(f"✅ נמחקו {deleted_count} לוחמים עם שמות לא תקינים")
    print(f"📊 נשארו {total_count - deleted_count} לוחמים במערכת")

def load_soldiers_from_excel(filepath):
    df = pd.read_excel(filepath, sheet_name="גיליון2")
    df = df.iloc[48999:50000]  # טווח נתונים רלוונטי
    
    loaded_count = 0
    skipped_count = 0

    for _, row in df.iterrows():
        # בדיקה ששם פרטי ושם משפחה קיימים ולא NaN
        if not (is_valid_name(row.get("FName")) and is_valid_name(row.get("LName"))):
            print(f"⚠️ דילוג על שורה {row.name + 49000}: חסרים שמות")
            skipped_count += 1
            continue

        try:
            country_instance = Country.objects.get(code=int(row["BirthCountry"]))
        except Exception:
            country_instance = None

        try:
            Soldier.objects.update_or_create(
                customer_id=int(row["CustomerID"]),
                defaults={
                    "first_name_he": row.get("FName"),
                    "first_name_en": row.get("FNameEn"),
                    "last_name_he": row.get("LName"),
                    "last_name_en": row.get("LNameEn"),
                    "previous_last_name_he": row.get("PreviousLName"),
                    "father_name": row.get("FatherName"),
                    "mother_name": row.get("MotherName"),
                    "nickname_he": row.get("CalledBy"),

                    "gender": row.get("Gender"),
                    "date_of_birth": parse_date(row.get("DOB")),
                    "birth_city_he": row.get("BirthCity"),
                    "birth_city_en": row.get("BirthCityEn"),
                    "birth_country": country_instance,
                    "aliya_date": parse_date(row.get("AliyaDate")),

                    "army_he": row.get("OtherArmy"),
                    "army_en": row.get("armyTitleEn"),
                    "army_role_he": row.get("armyRole"),
                    "army_role_en": row.get("armyRoleEn"),
                    "rank": row.get("OtherRank"),
                    "participation_he": row.get("OtherParticipation"),
                    "participation_en": row.get("OtherParticipation"),
                    "decorations_he": row.get("OtherDecoration"),
                    "decorations_en": row.get("OtherDecorationEN"),
                    "other_fighting_context_he": row.get("OtherFightingContext"),
                    "enlist_reason_he": row.get("enlistReason"),
                    "release_reason_he": row.get("releaseReason"),

                    "biography_he": row.get("Biography"),
                    "biography_en": row.get("BiographyEn"),
                    "fighting_description_he": row.get("FightingDesc"),
                    "fighting_description_en": row.get("FightingDescEn"),
                    "getto_description_he": row.get("gettoDesc"),
                    "getto_description_en": row.get("gettoDescEn"),
                    "wounds_he": row.get("woundDetails"),
                    "wounds_en": row.get("woundDetailsEn"),

                    "date_of_death": parse_date(row.get("DOD")),
                    "place_of_death_he": row.get("PlaceOfDeath"),
                    "place_of_death_en": row.get("PlaceOfDeathEn"),
                    "death_details_he": row.get("DeathDetails"),
                    "death_details_en": row.get("DeathDetailsEn"),

                    "image_url": None,
                    "video_url": None,
                }
            )
            loaded_count += 1
        except Exception as e:
            print(f"❌ שגיאה בטעינת שורה {row.name + 49000}: {str(e)}")
            skipped_count += 1

    print(f"✅ נטענו {loaded_count} לוחמים בהצלחה")
    print(f"⚠️ דולגו {skipped_count} לוחמים")
