import os
import json
import eel
import unicodedata

def get_generated_data_path(slug: str) -> str:
    return os.path.join("models", slug, "generated_raw.json")

def load_generated_data(slug: str) -> dict:
    """טוען את הדאטה המג׳ונרט של מודל לפי slug מתוך models/<slug>/."""
    path = get_generated_data_path(slug)

    if not os.path.exists(path):
        raise FileNotFoundError(f"לא נמצא קובץ generated_raw.json עבור המודל '{slug}'.")

    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)
