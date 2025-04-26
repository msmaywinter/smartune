import pandas as pd
import json
import re
import os

# הגדרות קבועות
MIN_ROWS = 50
ALLOWED_EXTENSIONS = ['.xlsx', '.xls']

# שלב 0: בדיקת סיומת קובץ
def is_valid_excel_file(filename: str) -> bool:
    _, ext = os.path.splitext(filename)
    return ext.lower() in ALLOWED_EXTENSIONS

# שלב 1: ניסיון קריאה
def read_excel_file(file_path: str) -> pd.DataFrame:
    try:
        df = pd.read_excel(file_path)
        return df
    except Exception as e:
        raise ValueError(f"שגיאה בקריאת הקובץ: {str(e)}")

# שלב 2: בדיקת מבנה
def validate_structure(df: pd.DataFrame) -> list:
    errors = []

    required_columns = ['שאלה', 'תשובה', 'נושא']
    if list(df.columns[:3]) != required_columns:
        errors.append("הקובץ חייב לכלול שלוש עמודות בלבד – 'שאלה', 'תשובה', 'נושא' – ובסדר הזה.")
        return errors

    # שינוי שמות העמודות באנגלית
    df.columns = ['question', 'answer', 'topic']
    return errors

# שלב 3: ניקוי ראשוני
def clean_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    # הסרת שורות חסרות (לפני ניקוי)
    df = df.dropna(subset=['question', 'answer', 'topic'])

    for col in ['question', 'answer', 'topic']:
        df[col] = (
            df[col]
            .astype(str)
            .str.strip()
            .replace(r'[\n\t\r]', '', regex=True)
        )

    return df

# שלב 4: בדיקות תוכן
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

# פונקציה מרכזית שמריצה את כל התהליך
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

    # החזר את df להמשך טיפול בשלב הבא
    return {"success": True, "data": df.to_dict(orient="records")}