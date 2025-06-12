from datetime import datetime
import os
import glob
import json
import shutil

# נתיבים
UPLOAD_DIR = "uploads"
TEMP_META = os.path.join("models_metadata", "temp_metadata.json")


# ---------------------
# ניקוי קבצים זמניים
# ---------------------

def clear_uploads():
    """
    מוחק את כל הקבצים בתיקיית uploads (שמשמשת כשלב ביניים בלבד).
    """
    for f in glob.glob(f"{UPLOAD_DIR}/*"):
        os.remove(f)


def clear_temp_metadata():
    """
    מוחק את המטאדאטה הזמנית שנשמרה (temp_metadata.json).
    """
    if os.path.exists(TEMP_META):
        os.remove(TEMP_META)


def cleanup_all():
    """
    מנקה גם את ההעלאות וגם את המטאדאטה הזמנית.
    """
    clear_uploads()
    clear_temp_metadata()


# ---------------------
# ניהול מטאדאטה זמנית
# ---------------------

def load_temp_metadata() -> dict:
    """
    טוען את temp_metadata.json ומחזיר dict ריק אם לא קיים.
    """
    if not os.path.exists(TEMP_META):
        return {}
    with open(TEMP_META, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_temp_metadata(data: dict):
    """
    שומר עותק של המטאדאטה לקובץ זמני – שימושי כשחוזרים אחורה בתהליך.
    """
    os.makedirs("models_metadata", exist_ok=True)
    with open(TEMP_META, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


# ---------------------
# גישה למטאדאטה לפי slug
# ---------------------

def get_model_metadata(slug: str) -> dict:
    """
    טוען את קובץ המטאדאטה של מודל לפי slug מתוך התיקייה הרלוונטית.
    """
    path = os.path.join("models", slug, "metadata.json")
    if not os.path.exists(path):
        return {}
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def revert_metadata(current_slug: str, original_slug: str) -> bool:
    """
    מחזירה את תיקיית המודל לשם המקורי ומעדכנת את המטאדאטה בהתאם.
    """
    current_path = os.path.join("models", current_slug)
    original_path = os.path.join("models", original_slug)

    # ודא שהנתיב הקיים אכן קיים
    if not os.path.exists(current_path):
        return False

    # טען את המטאדאטה הנוכחית
    metadata_path = os.path.join(current_path, "metadata.json")
    if not os.path.exists(metadata_path):
        return False

    with open(metadata_path, 'r', encoding='utf-8') as f:
        metadata = json.load(f)

    # עדכן את המטאדאטה לשם הקודם
    metadata["slug"] = original_slug
    metadata["model_name"] = None
    metadata["last_updated"] = datetime.now().isoformat()

    # שמור במטאדאטה בתיקייה החדשה
    os.makedirs(original_path, exist_ok=True)
    with open(os.path.join(original_path, "metadata.json"), 'w', encoding='utf-8') as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)

    # מחק את המטאדאטה מהתיקייה הנוכחית
    shutil.rmtree(current_path)

    # עדכן temp_metadata
    save_temp_metadata(metadata)

    return True
