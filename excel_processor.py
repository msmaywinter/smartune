import pandas as pd
import json
import re
import os
import shutil
from datetime import datetime
import state_manager  # לוודא שקיים קובץ עם הפונקציה save_temp_metadata

# קבועים
MIN_ROWS = 50
ALLOWED_EXTENSIONS = ['.xlsx', '.xls']

def is_valid_excel_file(filename: str) -> bool:
    _, ext = os.path.splitext(filename)
    return ext.lower() in ALLOWED_EXTENSIONS

def read_excel_file(file_path: str) -> pd.DataFrame:
    try:
        df = pd.read_excel(file_path)
        return df
    except Exception as e:
        raise ValueError(f"שגיאה בקריאת הקובץ: {str(e)}")

def validate_structure(df: pd.DataFrame) -> list:
    errors = []
    required_columns = ['שאלה', 'תשובה', 'נושא']
    if list(df.columns[:3]) != required_columns:
<<<<<<< HEAD
        errors.append("הקובץ חייב לכלול שלוש עמודות בלבד בסדר הזה: 'שאלה', 'תשובה', 'נושא'.")
=======
        errors.append("הקובץ חייב לכלול שלוש עמודות בלבד – 'שאלה', 'תשובה', 'נושא' – ובסדר הזה.")
>>>>>>> origin/main
        return errors
    df.columns = ['question', 'answer', 'topic']
    return errors

def clean_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    df = df.dropna(subset=['question', 'answer', 'topic'])
    for col in ['question', 'answer', 'topic']:
        df[col] = (
            df[col]
            .astype(str)
            .str.strip()
            .replace(r'[\n\t\r]', '', regex=True)
        )
    return df

def validate_content(df: pd.DataFrame) -> list:
    errors = []
    if len(df) < MIN_ROWS:
        errors.append(f"הקובץ מכיל רק {len(df)} שורות תקינות – נדרשות לפחות {MIN_ROWS}.")
    for i, row in df.iterrows():
        row_errors = []
        if not row['question'].strip():
            row_errors.append("שאלה חסרה")
        if not row['answer'].strip():
            row_errors.append("תשובה חסרה")
        if not row['topic'].strip():
            row_errors.append("נושא חסר")
        if row_errors:
            errors.append(f"שורה {i + 2}: {', '.join(row_errors)}.")
    return errors

<<<<<<< HEAD
=======
# 🧠 פונקציה ראשית
>>>>>>> origin/main
def process_excel_file(file_path: str) -> dict:
    if not is_valid_excel_file(file_path):
        return {"success": False, "errors": ["הקובץ שהועלה אינו קובץ Excel תקני (.xlsx או .xls)."]}

    try:
        df = read_excel_file(file_path)
    except ValueError as e:
        return {"success": False, "errors": [str(e)]}

    structure_errors = validate_structure(df)
    if structure_errors:
        return {"success": False, "errors": structure_errors}

    df = clean_dataframe(df)
    content_errors = validate_content(df)
    if content_errors:
        return {"success": False, "errors": content_errors}

    # יצירת תיקיית models אם לא קיימת
    os.makedirs("models", exist_ok=True)

    # יצירת slug לפי תאריך ושעה
    slug = datetime.now().strftime("%Y%m%d_%H%M%S")

    # יצירת תיקיית הפרויקט
    model_dir = os.path.join("models", slug)
    os.makedirs(model_dir, exist_ok=True)

    # שמירת קובץ האקסל בשם אחיד
    saved_excel_path = os.path.join(model_dir, "original.xlsx")
    shutil.copy(file_path, saved_excel_path)

    # יצירת metadata ראשוני
    now_iso = datetime.now().isoformat()
    metadata = {
        "slug": slug,
        "model_name": None,
<<<<<<< HEAD
        "user": None,
        "description": None,
=======
>>>>>>> origin/main
        "original_slug": slug,
        "original_filename": os.path.basename(file_path),
        "original_count": len(df),
        "user_generated": False,
        "generated_requested": 0,
        "generated_count": 0,
        "manual_added_count": 0,
        "total_final_count": len(df),
        "creation_date": now_iso,
        "last_updated": now_iso
    }

    # שמירה לתוך תיקיית הפרויקט
    metadata_path = os.path.join(model_dir, "metadata.json")
    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)

    # עדכון זמני ב-state_manager
    state_manager.save_temp_metadata(metadata)

    return {
        "success": True,
        "slug": slug,
        "data": df.to_dict(orient="records")
    }