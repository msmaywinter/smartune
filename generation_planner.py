import os
import json
from datetime import datetime


def get_generation_limits(original_count: int) -> dict:
    if original_count < 1:
        return {"success": False, "error": "כמות הסטים המקורית חייבת להיות גדולה מאפס."}

    max_gen = original_count * 2
    suggested_default = original_count

    return {
        "success": True,
        "max": max_gen,
        "min": 0,
        "default": suggested_default,
        "message": f"ניתן לג׳נרט עד {max_gen} סטים חדשים על בסיס {original_count} סטים שהועלו."
    }


def update_generation_choice(slug: str, wants_generation: bool, generated_requested: int) -> dict:
    """מעדכנת האם המשתמש רוצה להרחיב את המאגר וכמה סטים לבקש."""
    metadata_path = os.path.join("models", slug, "metadata.json")

    if not os.path.exists(metadata_path):
        return {"success": False, "error": "קובץ מטאדאטה לא נמצא."}

    try:
        with open(metadata_path, "r", encoding="utf-8") as f:
            metadata = json.load(f)

        metadata["user_generated"] = wants_generation
        metadata["generated_requested"] = generated_requested
        metadata["last_updated"] = datetime.now().isoformat()

        with open(metadata_path, "w", encoding="utf-8") as f:
            json.dump(metadata, f, ensure_ascii=False, indent=2)

        from state_manager import save_temp_metadata
        save_temp_metadata(metadata)

        print(
            f"✅ עודכן מטאדאטה למודל {slug}: user_generated={wants_generation}, generated_requested={generated_requested}")
        return {"success": True}

    except Exception as e:
        print(f"שגיאה בזמן עדכון המטאדאטה: {e}")
        return {"success": False, "error": str(e)}