import os
import json
import eel
import unicodedata

GENERATED_DATA_DIR = "data/generated"

def load_generated_data(slug: str) -> dict:
    """טוען את הדאטא המג׳ונרט של מודל לפי שם."""
    generated_data_path = os.path.join(GENERATED_DATA_DIR, slug, "generated_raw.json")

    if not os.path.exists(GENERATED_DATA_DIR):
        print("[ERROR] תיקיית data/generated לא קיימת בכלל.")
        raise FileNotFoundError("תיקיית הנתונים לא קיימת.")

    print(f"[DEBUG] תתי-תיקיות קיימות ב-data/generated: {os.listdir(GENERATED_DATA_DIR)}")
    
    if not os.path.exists(generated_data_path):
        raise FileNotFoundError(f"לא נמצא קובץ דאטה מג׳ונרט למודל: {slug}")

    with open(generated_data_path, "r", encoding="utf-8") as f:
        return json.load(f)
