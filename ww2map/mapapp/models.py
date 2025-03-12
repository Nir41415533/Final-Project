from django.db import models

class Country(models.Model):
    """ טבלת מדינות עם שם ייחודי """
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

class Event(models.Model):
    """ טבלת אירועים שמשויכת למדינה מסוימת """
    title = models.CharField(max_length=255)  # שם האירוע
    date = models.DateField()  # תאריך האירוע
    description = models.TextField()  # תיאור האירוע
    country = models.ForeignKey(Country, on_delete=models.CASCADE)  # שיוך למדינה
    image = models.CharField(max_length=255, blank=True, null=True)  # תמונה (לא חובה)
    video = models.CharField(max_length=255, blank=True, null=True)  # וידאו (לא חובה)

    def __str__(self):
        return f"{self.title} - {self.date} ({self.country.name})"
