import requests
from bs4 import BeautifulSoup
from concurrent.futures import ThreadPoolExecutor, as_completed
from mapapp.models import Soldier

def fetch_and_update_image(soldier):
    url = f"https://www.jwmww2.org/soldier.aspx?id={soldier.customer_id}"
    try:
        response = requests.get(url, timeout=10)
        if response.status_code != 200:
            return f"⚠️ ID {soldier.customer_id}: שגיאת חיבור ({response.status_code})"

        soup = BeautifulSoup(response.text, 'html.parser')
        img_tag = soup.find("img", {"id": "mainContent_imgMainPic"})
        if img_tag and img_tag.get("src"):
            image_url = "https://www.jwmww2.org" + img_tag["src"]
            soldier.image_url = image_url
            soldier.save()
            return f"✅ ID {soldier.customer_id}: תמונה עודכנה"
        else:
            return f"⚠️ ID {soldier.customer_id}: אין תמונה באתר"

    except Exception as e:
        return f"❌ ID {soldier.customer_id}: שגיאה - {e}"

def update_image_urls_parallel(limit=None, max_workers=10):
    print("🚀 מתחיל לעדכן תמונות ב־ThreadPool...")

    qs = Soldier.objects.filter(image_url__isnull=True).order_by('customer_id')
    if limit:
        soldiers = list(qs[:limit])
        print(f"🔎 נטענו {limit} חיילים ראשונים ללא תמונה")
    else:
        soldiers = list(qs)
        print(f"🔎 נטענו {len(soldiers)} חיילים ללא תמונה")

    results = []
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_soldier = {executor.submit(fetch_and_update_image, soldier): soldier for soldier in soldiers}

        for i, future in enumerate(as_completed(future_to_soldier), start=1):
            result = future.result()
            print(result)
            results.append(result)

            if i % 50 == 0:
                print(f"🧩 טופלו {i} חיילים...")

    print(f"\n🎉 הסתיים! עודכנו {len([r for r in results if r.startswith('✅')])} תמונות מתוך {len(results)}")
