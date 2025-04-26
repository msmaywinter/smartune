import base64
import json
import os
import webbrowser
import eel
import glob
import pandas as pd
from excel_processor import process_excel_file
from model_registry import is_valid_model_name, is_duplicate_model_name, save_model_metadata as save_fn
from openai_generator import generate_by_topics

eel.init('web')

COLUMN_MAPPING = {
    "question": ["question", "שאלה"],
    "answer": ["answer", "תשובה"],
    "topic": ["topic", "נושא"]
}

@eel.expose
def handle_file_upload(filename):
    input_path = os.path.join("uploads", filename)
    result = process_excel_file(input_path)  # שליחת פרמטר אחד בלבד
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
def save_model_metadata(name, metadata):
    return save_fn(name, metadata)

@eel.expose
def generate_sets(selected_sets, model_name):
    try:
        excel_files = glob.glob("uploads/*.xlsx")
        if not excel_files:
            print("❌ לא נמצא אף קובץ Excel בתיקיית uploads")
            return

        latest_excel = max(excel_files, key=os.path.getmtime)
        print(f"📄 קובץ האקסל שנבחר: {latest_excel}")

        df = pd.read_excel(latest_excel)
        print("🔍 עמודות שנמצאו בקובץ:", df.columns.tolist())

        # מיפוי עמודות אמיתי לפי מה שקיים בקובץ
        available_columns = df.columns.tolist()

        def find_column(possible_names):
            for name in possible_names:
                if name in available_columns:
                    return name
            return None

        question_col = find_column(COLUMN_MAPPING["question"])
        answer_col = find_column(COLUMN_MAPPING["answer"])
        topic_col = find_column(COLUMN_MAPPING["topic"])

        if not (question_col and answer_col):
            print("❌ לא נמצאו עמודות שאלה ותשובה תקינות בקובץ")
            return

        original_data = []
        for _, row in df.iterrows():
            question = str(row.get(question_col, "")).strip()
            answer = str(row.get(answer_col, "")).strip()
            topic = str(row.get(topic_col, "")).strip() if topic_col else "כללי"

            if question and answer:
                if not topic:
                    topic = "כללי"
                original_data.append({
                    "question": question,
                    "answer": answer,
                    "topic": topic
                })

        if not original_data:
            print("❌ לא נמצאו שאלות תקינות בקובץ.")
            return

        generate_by_topics(original_data, selected_sets, model_name)
        print(f"✅ הסטים נוצרו בהצלחה עבור המודל {model_name}")

    except Exception as e:
        print(f"❌ שגיאה ביצירת הסטים: {e}")


webbrowser.open_new("http://localhost:8000/home.html")
eel.start("home.html", mode=None)




