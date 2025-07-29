from excel_processor import process_excel_file
from model_registry import save_model_metadata
from generation_planner import get_generation_limits
from openai_generator import generate_by_topics

import os

# בדיקה כוללת של כל השלבים עד לבחירת כמות לג׳נרציה
def test_full_flow():
    test_file_path = "uploads/gadget_qa_dataset_hebrew.xlsx"

    model_name = input("הכנס שם למודל שלך: ").strip()

    if not model_name:
        print("שם המודל לא יכול להיות ריק. יוצאים מהבדיקה.")
        return

    metadata_path = os.path.join("models_metadata", f"{model_name}.json")
    if os.path.exists(metadata_path):
        print(f"השם '{model_name}' כבר בשימוש. בחר שם אחר ונסה שוב.")
        return

    # שלב 1: עיבוד קובץ
    result = process_excel_file(test_file_path)
    assert result["success"], f"שגיאה בעיבוד קובץ: {result.get('errors')}"

    # שמירת כמות השורות
    question_set = result["data"]
    original_count = len(question_set)

    print(f"שלב 1 הצליח: נטענו {original_count} שורות תקינות.")

    # שלב 2: שמירת שם מודל
    metadata = {
        "original_count": original_count,
        "user_notes": "בדיקת אינטגרציה"
    }
    save_result = save_model_metadata(model_name, metadata)
    assert save_result["success"], f"שגיאה בשמירת שם מודל: {save_result.get('error')}"

    print(f"שלב 2 הצליח: שם המודל '{model_name}' נשמר.")

    # שלב 3: בדיקת מגבלות ג׳נרציה
    limits = get_generation_limits(original_count)
    assert limits["success"], f"שגיאה בקביעת גבולות ג׳נרציה: {limits.get('error')}"

    print(f"שלב 3 הצליח: ניתן לג׳נרט עד {limits['max']} סטים חדשים.")

    # הדמיית בחירה של המשתמש
    try:
        user_input = int(input(f"הכנס את מספר הסטים שברצונך לג׳נרט (0 עד {limits['max']}): "))
        if 0 <= user_input <= limits['max']:
            user_selection = user_input
        else:
            raise ValueError()
    except ValueError:
        print("בחירה לא חוקית. בוצעה ברירת מחדל.")
        user_selection = limits["default"]
    
    print(f"המשתמש בחר לג׳נרט {user_selection} סטים.")

    # המרת הנתונים לפורמט הנדרש
    original_data = question_set  # כבר בפורמט של list of dicts

    # שלב 4: ג׳נרציה לפי נושאים
    print("\n⏳ מתחילים בג׳נרציה של סטים חדשים...")
    generate_by_topics(original_data, user_selection, model_name)

# הפעלת הבדיקה
if __name__ == "__main__":
    test_full_flow()