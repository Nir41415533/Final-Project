import pandas as pd
from mapapp.models import Country

def load_countries_from_excel(filepath):
    df = pd.read_excel(filepath, sheet_name="countries_codes")

    for _, row in df.iterrows():
        code = int(row["ID"])
        name_he = str(row["Title"]).strip()
        name_en = str(row["TitleEN"]).strip()

        Country.objects.update_or_create(
            code=code,
            defaults={"name_he": name_he, "name_en": name_en}
        )

    print("✅ Countries loaded successfully.")
