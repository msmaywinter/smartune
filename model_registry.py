from datetime import datetime
import os
import json
import re
import unicodedata

MODELS_DIR = "models_metadata"
os.makedirs(MODELS_DIR, exist_ok=True)

def slugify(name: str) -> str:
    name = unicodedata.normalize("NFKD", name)
    name = re.sub(r'[^\w\s-]', '', name, flags=re.UNICODE)
    name = re.sub(r'[-\s]+', '-', name).strip('-')
    return name.lower()

def is_valid_model_name(name: str) -> bool:
    pattern = r'^[\w\s\-א-ת]+$'
    return bool(name.strip()) and bool(re.fullmatch(pattern, name.strip()))

def is_duplicate_model_name(name: str) -> bool:
    slug = slugify(name)
    return os.path.exists(os.path.join(MODELS_DIR, f"{slug}.json"))

def save_model_metadata(name: str) -> dict:
    print(f"קיבלתי בקשה לשמור מודל: {name}")

    if not is_valid_model_name(name):
        print(f"שם לא חוקי: {name}")
        return {"success": False, "error": "שם המודל לא חוקי."}
    
    slug = slugify(name)
    if is_duplicate_model_name(name):
        print(f"שם כבר קיים: {name} (slug: {slug})")
        return {"success": False, "error": f"השם '{name}' כבר בשימוש. יש לבחור שם אחר."}

    temp_metadata_path = os.path.join(MODELS_DIR, "temp_metadata.json")
    if not os.path.exists(temp_metadata_path):
        print("לא נמצא קובץ מטאדאטה זמני.")
        return {"success": False, "error": "לא נמצא מידע זמני. נסה להעלות את הקובץ מחדש."}

    try:
        # קריאת המטאדאטה הזמנית
        with open(temp_metadata_path, "r", encoding="utf-8") as f:
            metadata = json.load(f)

        # עדכון השדות
        metadata["model_name"] = name.strip()  # השם המלא לתצוגה
        metadata["slug"] = slug                # שם לוגי
        metadata["last_updated"] = datetime.now().isoformat()

        # שמירת הקובץ
        path = os.path.join(MODELS_DIR, f"{slug}.json")
        with open(path, "w", encoding="utf-8") as f:
            json.dump(metadata, f, ensure_ascii=False, indent=2)

        os.remove(temp_metadata_path)

        print(f"✅ שמירת המטאדאטה הצליחה! slug = {slug}")
        return {"success": True, "slug": slug}

    except Exception as e:
        print(f"שגיאה בזמן שמירה: {e}")
        return {"success": False, "error": str(e)}
