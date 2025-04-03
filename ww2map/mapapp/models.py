from django.db import models


class Country(models.Model):
    code = models.IntegerField(unique=True)  # קוד המדינה מתוך קובץ הקודים
    name_he = models.CharField(max_length=100)  # שם המדינה בעברית
    name_en = models.CharField(max_length=100)  # שם המדינה באנגלית

    def __str__(self):
        return self.name_he  # אפשר לשנות ל-name_en אם תעדיף ברירת מחדל באנגלית
    
class Event(models.Model):
    title = models.CharField(max_length=255)  # שם האירוע
    date = models.DateField()  # תאריך האירוע
    description = models.TextField()  # תיאור האירוע
    country = models.ForeignKey(Country, on_delete=models.CASCADE)  # שיוך למדינה
    image = models.CharField(max_length=255, blank=True, null=True)  # תמונה (לא חובה)
    video = models.CharField(max_length=255, blank=True, null=True)  # וידאו (לא חובה)

    
    def __str__(self):
        return f"{self.title} - {self.date} ({self.country.name})"
    
class Soldier(models.Model):
    customer_id = models.IntegerField(unique=True)

    # Names
    first_name_he = models.CharField(max_length=100)
    first_name_en = models.CharField(max_length=100, blank=True, null=True)
    last_name_he = models.CharField(max_length=100)
    last_name_en = models.CharField(max_length=100, blank=True, null=True)
    previous_last_name_he = models.CharField(max_length=100, blank=True, null=True)
    father_name = models.CharField(max_length=100, blank=True, null=True)
    mother_name = models.CharField(max_length=100, blank=True, null=True)
    nickname_he = models.CharField(max_length=100, blank=True, null=True)

    # Demographics
    gender = models.CharField(max_length=10, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    birth_city_he = models.CharField(max_length=100, blank=True, null=True)
    birth_city_en = models.CharField(max_length=100, blank=True, null=True)
    birth_country = models.ForeignKey(Country, on_delete=models.SET_NULL, null=True, related_name="soldiers")
    aliya_date = models.DateField(blank=True, null=True)

    # Military service
    army_he = models.CharField(max_length=200, blank=True, null=True)
    army_en = models.CharField(max_length=200, blank=True, null=True)
    army_role_he = models.CharField(max_length=200, blank=True, null=True)
    army_role_en = models.CharField(max_length=200, blank=True, null=True)
    rank = models.CharField(max_length=100, blank=True, null=True)
    participation_he = models.TextField(blank=True, null=True)
    participation_en = models.TextField(blank=True, null=True)
    decorations_he = models.TextField(blank=True, null=True)
    decorations_en = models.TextField(blank=True, null=True)
    other_fighting_context_he = models.TextField(blank=True, null=True)
    enlist_reason_he = models.TextField(blank=True, null=True)
    release_reason_he = models.TextField(blank=True, null=True)

    # Personal story
    biography_he = models.TextField(blank=True, null=True)
    biography_en = models.TextField(blank=True, null=True)
    fighting_description_he = models.TextField(blank=True, null=True)
    fighting_description_en = models.TextField(blank=True, null=True)
    getto_description_he = models.TextField(blank=True, null=True)
    getto_description_en = models.TextField(blank=True, null=True)
    wounds_he = models.TextField(blank=True, null=True)
    wounds_en = models.TextField(blank=True, null=True)

    # Death
    date_of_death = models.DateField(blank=True, null=True)
    place_of_death_he = models.CharField(max_length=100, blank=True, null=True)
    place_of_death_en = models.CharField(max_length=100, blank=True, null=True)
    death_details_he = models.TextField(blank=True, null=True)
    death_details_en = models.TextField(blank=True, null=True)

    # Media
    image_url = models.URLField(blank=True, null=True)
    video_url = models.URLField(blank=True, null=True)

    def __str__(self):
        return f"{self.first_name_he} {self.last_name_he}" if self.first_name_he else f"Soldier {self.customer_id}"
    
    


