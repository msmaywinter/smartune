import base64
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

from excel_processor import process_excel_file
from model_registry import is_valid_model_name, is_duplicate_model_name, save_model_metadata as save_fn
from openai_generator import generate_by_topics, load_model_metadata as load_model_metadata_fn, finalize_generation
from generation_planner import update_generation_choice as update_generation_choice_fn
from data_editor import load_generated_data as load_generated_data_fn
from state_manager import cleanup_all, revert_metadata, load_temp_metadata

eel.init('web')
# ===== חשיפת פונקציות ל-Eel =====

@eel.expose
def handle_file_upload(filename):
    input_path = os.path.join("uploads", filename)
    result = process_excel_file(input_path)
    return result

@eel.expose
def save_file_to_server(base64data, filename):
    path = f'uploads/{filename}'
    with open(path, 'wb') as f:
        f.write(base64.b64decode(base64data))

@eel.expose
def validate_model_name(name):
    if not is_valid_model_name(name):
        return {"success": False, "error": "שם המודל יכול להכיל רק אותיות (עברית/אנגלית), מספרים, רווחים, מקף וקו תחתון."}
    if is_duplicate_model_name(name):
        return {"success": False, "error": f"השם '{name}' כבר בשימוש. יש לבחור שם אחר."}
    return {"success": True}

@eel.expose
def save_model_metadata(name):
    return save_fn(name)

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

@eel.expose
def append_to_generated_raw(slug, example):
    print("📥 append_to_generated_raw הופעלה")
    try:
        path = Path(f"data/generated/{slug}/generated_raw.json")
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

        return {"success": True}
    except Exception as e:
        print(f"שגיאה בשמירת שאלה חדשה: {e}")
        return {"success": False, "error": str(e)}
    
@eel.expose
def delete_from_generated_raw(slug, index):
    try:
        path = Path(f"data/generated/{slug}/generated_raw.json")
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

        return {"success": True}
    except Exception as e:
        print(f"שגיאה במחיקת שאלה: {e}")
        return {"success": False, "error": str(e)}

async def generate_sets_async(slug):
    try:
        excel_files = glob.glob("uploads/*.xlsx")
        if not excel_files:
            print("לא נמצא אף קובץ Excel בתיקיית uploads")
            return {"success": False}

        latest_excel = max(excel_files, key=os.path.getmtime)
        print(f"קובץ האקסל שנבחר: {latest_excel}")

        df = pd.read_excel(latest_excel)
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
        model_name = metadata.get("model_name", slug)  # נשתמש בשם המקורי רק לצורכי תיעוד
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
    filepath = f"data/generated/{slug}/generated_raw.json"
    if not os.path.exists(filepath):
        return []

    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)
        return data

@eel.expose
def export_model_to_excel(model_name):
    try:
        print(f"מתחיל ייצוא למודל: {model_name}")
        
        # בדיקת הנתיב החדש
        data_path = f"data/generated/{model_name}/generated_raw.json"
        print(f"מחפש את הקובץ: {data_path}")
        
        if not os.path.exists(data_path):
            print(f"קובץ {data_path} לא קיים!")
            return None

        print(f"קובץ נמצא: {data_path}")

        output_dir = "exports"
        os.makedirs(output_dir, exist_ok=True)
        output_path = os.path.join(output_dir, f"{model_name}_dataset.xlsx")

        # קריאת הנתונים
        try:
            with open(data_path, "r", encoding="utf-8") as file:
                dataset = json.load(file)
                print(f"✅ נתונים נקראו בהצלחה. מספר רשומות: {len(dataset)}")
        except json.JSONDecodeError as e:
            print(f"שגיאה בקריאת JSON: {e}")
            return None

        # אם הנתונים ריקים
        if not dataset:
            print("הנתונים ריקים – לא נוצר קובץ.")
            return None

        # יצירת קובץ אקסל
        workbook = openpyxl.Workbook()
        sheet = workbook.active
        sheet.title = "שאלות ותשובות"
        sheet.append(["שאלה", "תשובה"])

        # הוספת הנתונים
        for index, item in enumerate(dataset):
            try:
                question = item.get("question", "")
                answer = item.get("answer", "")
                print(f"שורה {index + 1}: שאלה = {question}, תשובה = {answer}")
                sheet.append([question, answer])
            except Exception as e:
                print(f"שגיאה בהוספת שורה {index + 1}: {e}")
                continue

        # שמירת הקובץ
        workbook.save(output_path)
        print(f"קובץ אקסל נשמר בנתיב: {output_path}")

        return output_path

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
def revert_temp_metadata(slug: str):
    ok = revert_metadata(slug)
    return {"success": ok}

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
    metadata_path = os.path.join('models_metadata', f'{slug}.json')
    if not os.path.exists(metadata_path):
        raise FileNotFoundError(f"Metadata file not found for slug: {slug}")

    with open(metadata_path, 'r', encoding='utf-8') as f:
        metadata = json.load(f)

    target_dir = os.path.join('data', 'final_datasets')
    os.makedirs(target_dir, exist_ok=True)
    final_path = os.path.join(target_dir, f'{slug}.json')

    if metadata.get('user_generated'):
        # המשתמש בחר בג'נרציה
        generated_data_path = os.path.join('data', 'generated', slug, 'generated_raw.json')
        if not os.path.exists(generated_data_path):
            raise FileNotFoundError("Generated raw data not found.")
        shutil.copy(generated_data_path, final_path)
        print(f"Copied generated data to {final_path}")
    else:
        # המשתמש העלה קובץ
        excel_files = glob.glob("uploads/*.xlsx")
        if not excel_files:
            raise FileNotFoundError("No Excel files found in uploads.")

        latest_excel = max(excel_files, key=os.path.getmtime)
        df = pd.read_excel(latest_excel)
        df.to_json(final_path, orient='records', force_ascii=False, indent=4)
        print(f"Converted Excel '{latest_excel}' to JSON at {final_path}")
        
    return final_path

@eel.expose
def save_training_config(config):
    import datetime

    os.makedirs('configs', exist_ok=True)
    
    slug = config.get('slug', 'model')
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M")
    
    filename = f"{slug}_{timestamp}.json"
    config_path = os.path.join('configs', filename)

    with open(config_path, 'w', encoding='utf-8') as f:
        json.dump(config, f, ensure_ascii=False, indent=4)
    
    print(f"Training config saved at {config_path}")
    return config_path


webbrowser.open_new("http://localhost:8001/home.html")
eel.start("home.html", mode=None, host="localhost", port=8001)
