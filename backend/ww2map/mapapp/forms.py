from django import forms
from django.core.exceptions import ValidationError
from datetime import date

class DateRangeForm(forms.Form):
    start_date = forms.DateField(
        label="Start Date",
        widget=forms.DateInput(attrs={'type': 'date'}),
        required=True
    )
    end_date = forms.DateField(
        label="End Date",
        widget=forms.DateInput(attrs={'type': 'date'}),
        required=True
    )

    def clean(self):
        cleaned_data = super().clean()
        start_date = cleaned_data.get('start_date')
        end_date = cleaned_data.get('end_date')

        # תאריכים מוגדרים כטווח מוגבל
        start_limit = date(1939, 9, 1)
        end_limit = date(1945, 5, 8)

        # ולידציה: בדיקה אם התאריכים הם בטווח הנדרש
        if start_date and (start_date < start_limit or start_date > end_limit):
            raise ValidationError(f"Start date must be between {start_limit} and {end_limit}.")
        if end_date and (end_date < start_limit or end_date > end_limit):
            raise ValidationError(f"End date must be between {start_limit} and {end_limit}.")

        # ולידציה: בדיקה אם התאריך ההתחלתי אחרי התאריך הסופי
        if start_date and end_date and start_date > end_date:
            raise ValidationError("Start date cannot be after end date.")

        return cleaned_data