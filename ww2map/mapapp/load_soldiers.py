import pandas as pd
from mapapp.models import Soldier, Country
from datetime import datetime

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

def load_soldiers_from_excel(filepath):
    df = pd.read_excel(filepath, sheet_name="גיליון2")
    df = df.iloc[48999:50000]  # טווח נתונים רלוונטי

    for _, row in df.iterrows():
        try:
            country_instance = Country.objects.get(code=int(row["BirthCountry"]))
        except Exception:
            country_instance = None

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

    print(f"✅ Loaded {len(df)} soldiers from rows 49000 to 50000.")
