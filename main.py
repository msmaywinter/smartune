import base64
import signal
from datetime import datetime
import json
import os
import shutil
import webbrowser
import eel
import glob
import pandas as pd
import asyncio
from pathlib import Path
import openpyxl
import sys
import threading

from excel_processor import process_excel_file
from model_registry import is_valid_model_name, is_duplicate_model_name, save_model_metadata as save_fn
from openai_generator import generate_by_topics, load_model_metadata as load_model_metadata_fn, finalize_generation
from generation_planner import update_generation_choice as update_generation_choice_fn
from data_editor import load_generated_data as load_generated_data_fn
from state_manager import cleanup_all, load_temp_metadata
from email_manager import register_email, notify_all
from Train import startTrain, question, setTestModel, exportModel
from dotenv import load_dotenv

load_dotenv()

sys.stdout.reconfigure(encoding='utf-8')

eel.init('web')

# ===== חשיפת פונקציות ל-Eel =====

@eel.expose
def handle_file_upload(filename):
    input_path = os.path.join("uploads", filename)
    result = process_excel_file(input_path)
    if os.path.exists(input_path):
        os.remove(input_path)

    return result

@eel.expose
def save_file_to_server(base64data, filename):
    path = f'uploads/{filename}'
    with open(path, 'wb') as f:
        f.write(base64.b64decode(base64data))


@eel.expose
def delete_model_folder(slug):
    model_path = os.path.join("models", slug)
    if os.path.exists(model_path) and os.path.isdir(model_path):
        shutil.rmtree(model_path)
        print(f"נמחקה תיקיית המודל: {slug}")
        return {"success": True}
    return {"success": False, "error": "תיקייה לא נמצאה"}


@eel.expose
def validate_model_name(name):
    if not is_valid_model_name(name):
        return {"success": False, "error": "שם המודל יכול להכיל רק אותיות באנגלית, מספרים, רווחים, מקף וקו תחתון."}
    if is_duplicate_model_name(name):
        return {"success": False, "error": f"השם '{name}' כבר בשימוש. יש לבחור שם אחר."}
    return {"success": True}


@eel.expose
def revert_temp_metadata(current_slug: str, original_slug: str):
    from state_manager import revert_metadata
    ok = revert_metadata(current_slug, original_slug)
    return {"success": ok}


@eel.expose
def save_model_metadata(model_name, user, description):
    return save_fn(model_name, user, description)

@eel.expose
def get_original_count(slug: str) -> int:
    metadata_path = os.path.join("models", slug, "metadata.json")
    if not os.path.exists(metadata_path):
        return 0
    try:
        with open(metadata_path, "r", encoding="utf-8") as f:
            metadata = json.load(f)
        return metadata.get("original_count", 0)
    except Exception as e:
        print(f"שגיאה בקריאת original_count: {e}")
        return 0


@eel.expose
def update_generation_choice(slug, wants_generation, generated_requested):
    return update_generation_choice_fn(slug, wants_generation, generated_requested)


@eel.expose
def load_model_metadata(slug):
    return load_model_metadata_fn(slug)


@eel.expose
def finalize_model_generation(slug):
    return finalize_generation(slug)

@eel.expose
def generate_sets(slug):
    return asyncio.run(generate_sets_async(slug))

@eel.expose
def done_generating():
    """פונקציה שקוראת ל-JavaScript כדי לסמן שהג'נרציה הסתיימה"""
    pass  # אין צורך בלוגיקה נוספת כאן, זה רק לחשיפה


def update_total_count(slug: str, new_count: int):
    meta_path = Path(f"models/{slug}/metadata.json")
    if not meta_path.exists():
        print(f"לא נמצא מטאדאטה לעדכון: {meta_path}")
        return
    try:
        with open(meta_path, "r", encoding="utf-8") as f:
            metadata = json.load(f)
        metadata["total_final_count"] = new_count
        metadata["last_updated"] = datetime.now().isoformat()
        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump(metadata, f, ensure_ascii=False, indent=2)
        print(f"עודכן מטאדאטה: total_final_count = {new_count}")
    except Exception as e:
        print(f"שגיאה בעדכון המטאדאטה: {e}")


@eel.expose
def append_to_generated_raw(slug, example):
    try:
        path = Path(f"models/{slug}/generated_raw.json")
        if not path.exists():
            data = []
        else:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)

        data.append({
            "question": example.get("question", "").strip(),
            "answer": example.get("answer", "").strip()
        })

        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        update_total_count(slug, len(data))
        return {"success": True}
    except Exception as e:
        print(f"שגיאה בשמירת שאלה חדשה: {e}")
        return {"success": False, "error": str(e)}


@eel.expose
def delete_from_generated_raw(slug, index):
    try:
        path = Path(f"models/{slug}/generated_raw.json")
        if not path.exists():
            return {"success": False, "error": "לא נמצא קובץ generated_raw."}

        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        if 0 <= index < len(data):
            del data[index]
        else:
            return {"success": False, "error": "אינדקס לא חוקי."}

        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        update_total_count(slug, len(data))
        return {"success": True}
    except Exception as e:
        print(f"שגיאה במחיקת שאלה: {e}")
        return {"success": False, "error": str(e)}


async def generate_sets_async(slug):
    try:
        excel_path = os.path.join("models", slug, "original.xlsx")
        if not os.path.exists(excel_path):
            print(f"שגיאה: לא נמצא קובץ Excel בתיקייה models/{slug}")
            return {"success": False}

        print(f"קובץ האקסל שנבחר: {excel_path}")
        df = pd.read_excel(excel_path)
        print("עמודות שנמצאו בקובץ:", df.columns.tolist())

        question_col, answer_col, topic_col = None, None, None

        for col in df.columns:
            if col.lower() in ["question", "שאלה"]:
                question_col = col
            if col.lower() in ["answer", "תשובה"]:
                answer_col = col
            if col.lower() in ["topic", "נושא"]:
                topic_col = col

        if not question_col or not answer_col:
            print("לא נמצאו עמודות שאלה ותשובה תקינות.")
            return {"success": False}

        original_data = []
        for _, row in df.iterrows():
            question = str(row.get(question_col, "")).strip()
            answer = str(row.get(answer_col, "")).strip()
            topic = str(row.get(topic_col, "כללי")).strip()

            if question and answer:
                original_data.append({
                    "question": question,
                    "answer": answer,
                    "topic": topic if topic else "כללי"
                })

        if not original_data:
            print("לא נמצאו שאלות תקינות בקובץ.")
            return {"success": False}

        metadata = load_model_metadata(slug)
        model_name = metadata.get("model_name", slug)
        selected_sets = metadata.get("generated_requested", 0)

        if selected_sets <= 0:
            print(f"שגיאה: לא הוגדר מספר סטים לג'נרציה במטאדאטה למודל '{slug}'.")
            return {"success": False}

        await generate_by_topics(original_data, selected_sets, slug)

        return {"success": True}

    except Exception as e:
        print(f"שגיאה בג'נרציה: {e}")
        return {"success": False}


@eel.expose
def load_generated_data(slug):
    filepath = f"models/{slug}/generated_raw.json"
    if not os.path.exists(filepath):
        return []

    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)
        return data


@eel.expose
def export_model_to_excel(model_name):
    try:
        print(f"מתחיל ייצוא למודל: {model_name}")

        # קובץ המקור
        data_path = os.path.join("models", model_name, "generated_raw.json")
        print(f"מחפש את הקובץ: {data_path}")

        if not os.path.exists(data_path):
            print(f"קובץ {data_path} לא קיים!")
            return None

        # קריאת הנתונים
        with open(data_path, "r", encoding="utf-8") as file:
            dataset = json.load(file)

        if not dataset:
            print(" הקובץ ריק.")
            return None

        # יצירת תיקיית היעד בתוך web
        export_dir = os.path.join("web", "exports")
        os.makedirs(export_dir, exist_ok=True)

        file_name = f"{model_name}_dataset.xlsx"
        output_path = os.path.join(export_dir, file_name)

        # יצירת הקובץ
        workbook = openpyxl.Workbook()
        sheet = workbook.active
        sheet.title = "שאלות ותשובות"
        sheet.append(["שאלה", "תשובה"])

        for index, item in enumerate(dataset):
            question = item.get("question", "")
            answer = item.get("answer", "")
            sheet.append([question, answer])

        workbook.save(output_path)
        print(f" נשמר ב־: {output_path}")

        return f"exports/{file_name}"  # יחסי מתוך תיקיית web

    except Exception as e:
        print(f"שגיאה ביצוא הנתונים לאקסל: {e}")
        return None


@eel.expose
def cleanup_upload():
    cleanup_all()
    return {"success": True}


@eel.expose
def get_temp_model_name():
    meta = load_temp_metadata()
    return meta.get("model_name", "")


@eel.expose
def get_temp_metadata():
    return load_temp_metadata()


@eel.expose
def load_params():
    """
    קורא את params.json ומחזיר אותו כאובייקט שישמש ב־JS
    """
    p = Path(__file__).parent / 'params.json'
    return json.loads(p.read_text(encoding='utf-8'))

@eel.expose
def prepare_final_dataset(slug):
    # שליפת המטאדאטה
    metadata_path = os.path.join('models', slug, 'metadata.json')
    if not os.path.exists(metadata_path):
        raise FileNotFoundError(f"Metadata file not found for slug: {slug}")

    with open(metadata_path, 'r', encoding='utf-8') as f:
        metadata = json.load(f)

    model_dir = os.path.join('models', slug)
    os.makedirs(model_dir, exist_ok=True)
    final_path = os.path.join(model_dir, "final_dataset.json")

    if metadata.get('user_generated'):
        # המשתמש בחר בג'נרציה
        generated_data_path = os.path.join('models', slug, 'generated_raw.json')
        if not os.path.exists(generated_data_path):
            raise FileNotFoundError("Generated raw data not found.")
        shutil.copy(generated_data_path, final_path)
        print(f"Copied generated data to {final_path}")
    else:
        excel_path = os.path.join('models', slug, 'original.xlsx')
        if not os.path.exists(excel_path):
            raise FileNotFoundError(f"No uploaded Excel file found at: {excel_path}")

        df = pd.read_excel(excel_path)

        column_mapping = {
            "שאלה": "question",
            "תשובה": "answer",
            "נושא": "topic"
        }
        df.rename(columns=column_mapping, inplace=True)

        df.to_json(final_path, orient='records', force_ascii=False, indent=4)
        print(f"Converted Excel to JSON at {final_path}")

    if metadata.get('user_generated') is False:
        generated_data_path = os.path.join('models', slug, 'generated_raw.json')
        if os.path.exists(generated_data_path):
            os.remove(generated_data_path)
            print(f"✔️ נמחק generated_raw.json עבור מודל {slug} כי user_generated = False")

    return final_path

@eel.expose
def ensure_generated_from_original(slug):
    generated_path = os.path.join("models", slug, "generated_raw.json")
    if os.path.exists(generated_path):
        return {"created": False}

    # יוצרים אותו מתוך original.xlsx
    excel_path = os.path.join("models", slug, "original.xlsx")
    if not os.path.exists(excel_path):
        return {"success": False, "error": "לא נמצא קובץ original.xlsx"}

    df = pd.read_excel(excel_path)
    data = []
    for _, row in df.iterrows():
        question = str(row.get("שאלה", "")).strip()
        answer = str(row.get("תשובה", "")).strip()
        if question and answer:
            data.append({"question": question, "answer": answer})

    with open(generated_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    return {"created": True}



@eel.expose
def save_training_config(config):
    slug = config.get('slug')
    if not slug:
        return {"success": False, "error": "Training config must include a 'slug' key."}

    model_dir = os.path.join("models", slug)
    os.makedirs(model_dir, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"training_config_{timestamp}.json"
    config_path = os.path.join(model_dir, filename)

    with open(config_path, 'w', encoding='utf-8') as f:
        json.dump(config, f, ensure_ascii=False, indent=4)

    print(f"Training config saved at {config_path}")
    return {"success": True, "path": config_path}

@eel.expose
def start_training_from_path(config_path):
    def run_training():
        slug = startTrain(config_path)
        notify_all(slug)

    thread = threading.Thread(target=run_training)
    thread.start()
    return {"success": True}

@eel.expose
def register_email_for_notification(email):
    register_email(email)


@eel.expose
def prepare_model_for_testing(slug, temperature, max_tokens):
    import os
    import glob
    from trainingConfig import TrainingConfig
    import Train
    from Train import findLastAdapter, setTestModel

    # טוענים את קובץ הקונפיג הכי עדכני
    configs = sorted(
        glob.glob(os.path.join("models", slug, "training_config_*.json")),
        reverse=True
    )
    if not configs:
        raise FileNotFoundError(f"⚠ לא נמצא קובץ קונפיג למודל '{slug}'")
    config_path = configs[0]
    config = TrainingConfig.from_directory(config_path)

    # שמירת המודל והתבנית בתוך משתנים גלובליים
    Train.baseModel = Train.models[config.model_name]["source"]
    Train.template = Train.models[config.model_name]["template"]

    # מוצאים את תיקיית הריצה האחרונה
    runs = sorted([
        d for d in os.listdir(f"models/{slug}/trained")
        if os.path.isdir(os.path.join("models", slug, "trained", d)) and d.startswith("run_")
    ])
    if not runs:
        raise FileNotFoundError(f"⚠ לא נמצאו תיקיות run_ עבור המודל '{slug}'")
    run_id = runs[-1]
    run_path = os.path.join("models", slug, "trained", run_id)

    Train.outputDir = run_path

    # מוצאים את האדפטר האחרון
    adapter_path = findLastAdapter(run_path)

    # טוענים את המודל עם האדפטר
    setTestModel(temperature, adapter_path, max_tokens)



@eel.expose
def ask_model_js(question_text, temperature, max_tokens=512):
    response = question(question_text, temperature, max_tokens)
    if isinstance(response, list):
        for msg in reversed(response):
            if msg.get("role") == "assistant":
                return msg.get("content", "[שגיאה: אין תוכן]")
        return "[שגיאה: לא נמצאה תשובה מהמודל]"
    return str(response)


@eel.expose
def export_zip_package(slug):
    import zipfile

    try:
        model_dir = os.path.join("models", slug)
        export_dir = os.path.join("web", "exports")
        os.makedirs(export_dir, exist_ok=True)

        zip_filename = f"{slug}_export_package.zip"
        zip_path = os.path.join(export_dir, zip_filename)

        with zipfile.ZipFile(zip_path, 'w') as zipf:
            # קובץ קונפיג הכי עדכני
            configs = sorted(
                glob.glob(os.path.join(model_dir, "training_config_*.json")),
                reverse=True
            )
            if not configs:
                return {"success": False, "error": "לא נמצא קובץ הגדרות"}
            zipf.write(configs[0], arcname=os.path.basename(configs[0]))

            # רק קובץ original.xlsx
            excel_path = os.path.join(model_dir, "original.xlsx")
            if not os.path.exists(excel_path):
                return {"success": False, "error": "לא נמצא קובץ original.xlsx"}
            zipf.write(excel_path, arcname="original.xlsx")

        print(f" ZIP מוכן: {zip_path}")
        return {"success": True, "zip_path": f"exports/{zip_filename}"}

    except Exception as e:
        print(f"שגיאה ביצירת ZIP: {e}")
        return {"success": False, "error": str(e)}

@eel.expose
def export_model_js(slug, q_type="f16"):
    zip_path = exportModel(slug, q_type)

    if zip_path:
        return {"success": True, "zip_path": zip_path}
    else:
        return {"success": False, "error": "לא נוצר קובץ ZIP"}


MODELS_DIR: str = "models"

@eel.expose
def get_all_models_metadata():
    models = []
    for subdir in os.listdir(MODELS_DIR):
        model_path = os.path.join(MODELS_DIR, subdir)
        if os.path.isdir(model_path):
            metadata_path = os.path.join(model_path, "metadata.json")
            if os.path.exists(metadata_path):
                try:
                    with open(metadata_path, "r", encoding="utf-8") as f:
                        metadata = json.load(f)

                    # חיפוש קבצי training_config
                    # training_configs = glob.glob(os.path.join(model_path, "training_config_*.json"))
                    valid_runs = check_valid_runs(subdir)
                    tweaks_count = len(valid_runs)

                    # תאריך
                    raw_date = metadata.get("last_updated", "")
                    if raw_date:
                        dt = datetime.fromisoformat(raw_date)
                        formatted_date = f"{dt.day}/{dt.month}/{dt.year}"
                    else:
                        formatted_date = "—"

                    models.append({
                        "slug": metadata.get("slug", subdir),
                        "name": metadata.get("model_name", "ללא שם"),
                        "user": metadata.get("user", "—"),
                        "description": metadata.get("description", "—"),
                        "tweaks": tweaks_count,
                        "updated_at": formatted_date,
                        "last_updated_raw": raw_date
                    })
                except Exception as e:
                    print(f"שגיאה בקריאת מטאדאטה מתוך {metadata_path}: {e}")
    return models

def check_valid_runs(slug):
    run_dir = os.path.join("models", slug, "trained")
    if not os.path.exists(run_dir):
        return []

    valid_runs = []
    for run in os.listdir(run_dir):
        run_path = os.path.join(run_dir, run)
        if os.path.isdir(run_path) and run.startswith("run_"):
            adapter_path = os.path.join(run_path, "adapter_config.json")
            if os.path.exists(adapter_path):
                valid_runs.append(run)
            else:
                shutil.rmtree(run_path)  # מנקים את הריצה הלא תקינה
                print(f"נמחקה ריצה לא תקינה: {run_path}")

    return valid_runs

@eel.expose
def open_or_export_model(slug, q_type="f16"):
    from Train import exportModel, findLastAdapter
    import glob

    model_dir = os.path.join("models", slug)

    # מוצאים את הריצה האחרונה
    runs = sorted(
        [d for d in os.listdir(os.path.join(model_dir, "trained")) if d.startswith("run_")],
        reverse=True
    )

    if not runs:
        return {"success": False, "error": "לא נמצאה אף הרצת אימון."}

    last_run = runs[0]
    last_run_path = os.path.join(model_dir, "trained", last_run)

    # בדיקה אם קיימת תיקיית exported
    exported_path = os.path.join(last_run_path, "exported")
    if os.path.exists(exported_path):
        print(f" מודל כבר יוצא: {exported_path}")
        open_model_folder(os.path.join(slug, "trained", last_run, "exported"))
        return {"success": True, "already_exported": True}

    # אם לא קיים – מייצאים
    zip_path = exportModel(slug, q_type)
    if zip_path:
        print(f" מודל יוצא עכשיו: {zip_path}")
        folder_to_open = os.path.dirname(zip_path)
        open_model_folder(os.path.relpath(folder_to_open, "models"))
        return {"success": True, "already_exported": False}

    return {"success": False, "error": "לא נוצר קובץ ZIP"}


@eel.expose
def open_model_folder(name):
    import subprocess
    import platform

    folder_path = os.path.abspath(os.path.join("models", name))

    if not os.path.exists(folder_path):
        return {"success": False, "error": "התיקייה לא קיימת"}

    try:
        if platform.system() == "Windows":
            os.startfile(folder_path)
        elif platform.system() == "Darwin":
            subprocess.Popen(["open", folder_path])
        else:
            subprocess.Popen(["xdg-open", folder_path])
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}


@eel.expose
def cleanup_on_close():
    temp_meta = load_temp_metadata()
    slug = temp_meta.get("slug")
    model_name = temp_meta.get("model_name")

    if slug and model_name is None:
        model_path = os.path.join("models", slug)
        if os.path.exists(model_path):
            shutil.rmtree(model_path)
            print(f"נמחקה תיקיית המודל: {slug}")
        cleanup_all()
    else:
        print("אין מודל זמני פעיל. ")


webbrowser.open_new("http://localhost:8001/home.html")
eel.start("home.html", mode=None, host="localhost", port=8001)




