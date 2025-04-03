import requests
from bs4 import BeautifulSoup
from mapapp.models import Soldier

def update_image_urls_for_first_soldiers(limit=10):
    soldiers = Soldier.objects.filter(image_url__isnull=True).order_by('customer_id')[:limit]
    updated = 0

    for soldier in soldiers:
        url = f"https://www.jwmww2.org/soldier.aspx?id={soldier.customer_id}"
        try:
            response = requests.get(url, timeout=10)
            if response.status_code != 200:
                print(f"⚠️ Failed to fetch Soldier {soldier.customer_id} (Status {response.status_code})")
                continue

            soup = BeautifulSoup(response.text, 'html.parser')
            img_tag = soup.find("img", {"id": "mainContent_imgMainPic"})
            if img_tag and img_tag.get("src"):
                image_url = "https://www.jwmww2.org" + img_tag["src"]
                soldier.image_url = image_url
                soldier.save()
                updated += 1
                print(f"✅ Updated Soldier {soldier.customer_id} with image: {image_url}")
            else:
                print(f"⚠️ No image found for Soldier {soldier.customer_id}")

        except Exception as e:
            print(f"❌ Error with Soldier {soldier.customer_id}: {e}")

    print(f"\n✅ Done. {updated} image URLs updated out of {limit} soldiers.")
