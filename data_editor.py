import os
import json
import eel

GENERATED_DATA_DIR = "data/generated"

# === פונקציות עזר === #
def load_generated_data(model_name: str) -> dict:
    """טוען את הדאטא המג׳ונרט של מודל לפי שם."""
    generated_data_path = os.path.join(GENERATED_DATA_DIR, f"{model_name}.json")
    if not os.path.exists(generated_data_path):
        raise FileNotFoundError(f"לא נמצא קובץ דאטה מג׳ונרט למודל: {model_name}")

    with open(generated_data_path, "r", encoding="utf-8") as f:
        generated_data = json.load(f)

    return generated_data