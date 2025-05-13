import os, glob, json

UPLOAD_DIR   = "uploads"
MODELS_DIR   = "models_metadata"
TEMP_META    = os.path.join(MODELS_DIR, "temp_metadata.json")

def clear_uploads():
    for f in glob.glob(f"{UPLOAD_DIR}/*"):
        os.remove(f)

def clear_temp_metadata():
    if os.path.exists(TEMP_META):
        os.remove(TEMP_META)

def cleanup_all():
    clear_uploads()
    clear_temp_metadata()

def revert_metadata(slug: str):
    """
    מעביר את MODELS_DIR/{slug}.json חזרה ל־temp_metadata.json
    """
    src = os.path.join(MODELS_DIR, f"{slug}.json")
    if not os.path.exists(src):
        return False
    with open(src, 'r', encoding='utf-8') as f:
        metadata = json.load(f)
    with open(TEMP_META, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)
    os.remove(src)
    return True

def load_temp_metadata() -> dict:
    """
    טוען את temp_metadata.json ומחזיר dict ריק אם לא קיים.
    """
    if not os.path.exists(TEMP_META):
        return {}
    with open(TEMP_META, 'r', encoding='utf-8') as f:
        return json.load(f)
