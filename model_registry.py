import os
import json
import re

MODELS_DIR = "models_metadata"
os.makedirs(MODELS_DIR, exist_ok=True)

def is_valid_model_name(name: str) -> bool:
    pattern = r'^[\w\s\-א-ת]+$'
    return bool(name.strip()) and bool(re.fullmatch(pattern, name.strip()))

def is_duplicate_model_name(name: str) -> bool:
    return os.path.exists(os.path.join(MODELS_DIR, f"{name}.json"))

def save_model_metadata(name: str, metadata: dict) -> dict:
    print(f"🔍 קיבלתי בקשה לשמור מודל: {name}")

    if not is_valid_model_name(name):
        print(f"❌ שם לא חוקי: {name}")
        return {"success": False, "error": "שם המודל לא חוקי."}
    
    if is_duplicate_model_name(name):
        print(f"❌ שם כבר קיים: {name}")
        return {"success": False, "error": f"השם '{name}' כבר בשימוש. יש לבחור שם אחר."}
    
    try:
        os.makedirs(MODELS_DIR, exist_ok=True)
        path = os.path.join(MODELS_DIR, f"{name}.json")
        print(f"📁 מנסה לשמור בקובץ: {path}")

        with open(path, "w", encoding="utf-8") as f:
            json.dump(metadata, f, ensure_ascii=False, indent=2)
        
        print(f"✅ שמירת המטאדאטה הצליחה!")
        return {"success": True}
    
    except Exception as e:
        print(f"❌ שגיאה בזמן שמירה: {e}")
        return {"success": False, "error": str(e)}