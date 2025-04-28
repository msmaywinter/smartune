import base64
import json
import os
import webbrowser
import eel
import glob
import pandas as pd
import asyncio

from excel_processor import process_excel_file
from model_registry import is_valid_model_name, is_duplicate_model_name, save_model_metadata as save_fn
from openai_generator import generate_by_topics, load_model_metadata as load_model_metadata_fn, finalize_generation
from generation_planner import update_generation_choice as update_generation_choice_fn

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
def update_generation_choice(model_name, wants_generation, generated_requested):
    return update_generation_choice_fn(model_name, wants_generation, generated_requested)

@eel.expose
def load_model_metadata(model_name):
    return load_model_metadata_fn(model_name)

@eel.expose
def finalize_model_generation(model_name):
    return finalize_generation(model_name)

@eel.expose
def generate_sets(model_name):
    return asyncio.run(generate_sets_async(model_name))

@eel.expose
def done_generating():
    """פונקציה שקוראת ל-JavaScript כדי לסמן שהג'נרציה הסתיימה"""
    pass  # אין צורך בלוגיקה נוספת כאן, זה רק לחשיפה

async def generate_sets_async(model_name):
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

        metadata = load_model_metadata(model_name)
        selected_sets = metadata.get("generated_requested", 0)
        if selected_sets <= 0:
            print(f"שגיאה: לא הוגדר מספר סטים לג'נרציה במטאדאטה למודל '{model_name}'.")
            return {"success": False}

        await generate_by_topics(original_data, selected_sets, model_name)

        return {"success": True}

    except Exception as e:
        print(f"שגיאה בג'נרציה: {e}")
        return {"success": False}

# ===== פתיחת הדפדפן והתחלת השרת =====

webbrowser.open_new("http://localhost:8000/home.html")
eel.start("home.html", mode=None)
