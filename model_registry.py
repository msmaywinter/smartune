from datetime import datetime
import os
import json
import re
import unicodedata
import state_manager

def slugify(name: str) -> str:
    name = unicodedata.normalize("NFKD", name)
    name = re.sub(r'[^\w\s-]', '', name, flags=re.UNICODE)
    name = re.sub(r'[-\s]+', '-', name).strip('-')
    return name.lower()

def is_valid_model_name(name: str) -> bool:
    pattern = r'^[a-zA-Z0-9_\- ]+$'  # רק באנגלית
    return bool(name.strip()) and bool(re.fullmatch(pattern, name.strip()))

def is_duplicate_model_name(name: str) -> bool:
    slug = slugify(name)
    return os.path.exists(os.path.join("models", slug))

def save_model_metadata(name: str) -> dict:
    print(f"קיבלתי בקשה לשמור מודל: {name}")

    if not is_valid_model_name(name):
        return {"success": False, "error": "שם המודל יכול להכיל רק אותיות באנגלית, מספרים, רווחים, מקפים וקווים תחתונים."}

    slug = slugify(name)
    if is_duplicate_model_name(name):
        return {"success": False, "error": f"השם '{name}' כבר בשימוש. יש לבחור שם אחר."}

    # שליפת המטאדאטה מה-state הזמני
    metadata = state_manager.load_temp_metadata()
    if not metadata:
        return {"success": False, "error": "לא נמצא מידע זמני. נסה להעלות את הקובץ מחדש."}

    old_slug = metadata.get("slug")
    old_model_path = os.path.join("models", old_slug)

    # עדכון שם המודל וה-slug
    metadata["model_name"] = name.strip()
    metadata["slug"] = slug
    metadata["last_updated"] = datetime.now().isoformat()

    # שינוי שם התיקייה של המודל
    new_model_path = os.path.join("models", slug)
    if not os.path.exists(old_model_path):
        return {"success": False, "error": "תיקיית המודל לא נמצאה."}
    os.rename(old_model_path, new_model_path)

    # שמירת המטאדאטה למיקום החדש
    metadata_path = os.path.join(new_model_path, "metadata.json")
    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)

    # עדכון מצב זמני
    state_manager.save_temp_metadata(metadata)

    print(f"✅ שם המודל נשמר בהצלחה! slug = {slug}")
    return {"success": True, "slug": slug}
