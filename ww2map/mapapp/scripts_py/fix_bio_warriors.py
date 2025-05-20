import pandas as pd
import requests
from bs4 import BeautifulSoup
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

# קבצים והגדרות
FILENAME = "jw.xlsx"
SHEET_NAME = "גיליון2"
FIELDS = ["CustomerID", "Biography"]
OUTPUT_FILE = "jw_updated_only.xlsx"
SAVE_EVERY = 500
MAX_WORKERS = 10

print(f"📂 טוען את הקובץ: {FILENAME}, גיליון: {SHEET_NAME}")
df = pd.read_excel(FILENAME, sheet_name=SHEET_NAME, usecols=FIELDS)

# זיהוי ביוגרפיה פגומה
def is_corrupted_bio(bio):
    if not isinstance(bio, str):
        return False
    bio = bio.strip()
    if not bio:
        return False
    signs = ["<p", "<span", "&quot;", "&nbsp;", "&#", "style=", "font-", "color:", "<br"]
    return any(sign in bio.lower() for sign in signs) or len(bio) < 100

# שליפת ביוגרפיה מהאתר
def fetch_biography(customer_id):
    url = f"https://www.jwmww2.org/soldier.aspx?id={int(customer_id)}"
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")

        # ניסיון לפי מבנה ישן
        bio_div = soup.find("div", id="ContentPlaceHolder1_lblBio")
        if bio_div and bio_div.get_text(strip=True):
            time.sleep(0.1)
            return bio_div.get_text(separator="\n").strip()

        # ניסיון לפי מבנה חדש
        bio_new = soup.find("p", id="mainContent_txtBody2")
        if bio_new and bio_new.get_text(strip=True):
            time.sleep(0.1)
            return bio_new.get_text(separator="\n").strip()

    except Exception as e:
        print(f"❌ שגיאה ב-ID {customer_id}: {e}")
    return None

# סינון שורות חשודות
corrupted_df = df[df["Biography"].apply(is_corrupted_bio)]
print(f"\n🔎 שורות חשודות לסריקה: {len(corrupted_df)}")

# רשימת תוצאות תקינות
updated_rows = []

# פונקציית עיבוד ללוחם
def process_row(index, row):
    cid = row["CustomerID"]
    old_bio = row["Biography"]
    new_bio = fetch_biography(cid)
    if new_bio:
        new_row = row.copy()
        new_row["Biography"] = new_bio
        print(f"✅ עדכון לוחם ID {cid}")
        return new_row
    else:
        print(f"⚠️ ללא עדכון לוחם ID {cid}")
    return None

# הרצה עם ThreadPool
with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
    futures = {executor.submit(process_row, i, row): i for i, row in corrupted_df.iterrows()}

    for count, future in enumerate(as_completed(futures), 1):
        result = future.result()
        if result is not None:
            updated_rows.append(result)

        # שמירה כל 500
        if count % SAVE_EVERY == 0 and updated_rows:
            partial_df = pd.DataFrame(updated_rows)
            partial_df.to_excel(OUTPUT_FILE, index=False)
            print(f"\n💾 נשמר קובץ זמני: {OUTPUT_FILE} ({len(updated_rows)} שורות מעודכנות)\n")

# שמירה סופית
if updated_rows:
    final_df = pd.DataFrame(updated_rows)
    final_df.to_excel(OUTPUT_FILE, index=False)
    print(f"\n✅ נשמר קובץ סופי עם {len(updated_rows)} ביוגרפיות מתוקנות: {OUTPUT_FILE}")
else:
    print("❗ לא נמצאו ביוגרפיות תקינות – לא נשמר קובץ.")

print("\n🎉 סיום מלא!")
