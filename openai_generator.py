import os
import json
import re
import eel
import pandas as pd
from pathlib import Path
from collections import defaultdict
from dotenv import load_dotenv
from openai import OpenAI

# === הגדרות כלליות === #
load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=api_key)

MAX_TOKENS = 4096
TEMPERATURE = 0.3
CHUNK_SIZE = 3

# === פונקציות עזר === #

def detect_language(data):
    hebrew_chars = set("אבגדהוזחטיכלמנסעפצקרשת")
    for item in data:
        if any(c in hebrew_chars for c in item.get("question", "")):
            return "he"
    return "en"

def group_by_topic(data):
    grouped = defaultdict(list)
    for item in data:
        topic = item.get("topic", "כללי").strip()
        grouped[topic].append(item)
    return grouped

def distribute_generation_amount(total, grouped_data):
    total_questions = sum(len(qs) for qs in grouped_data.values())
    raw_distribution = {
        topic: (len(qs) / total_questions) * total
        for topic, qs in grouped_data.items()
    }

    distribution = {topic: round(val) for topic, val in raw_distribution.items()}
    diff = total - sum(distribution.values())

    topics = list(distribution.keys())
    for i in range(abs(diff)):
        t = topics[i % len(topics)]
        distribution[t] += 1 if diff > 0 else -1

    return distribution

def chunk_list(data, size):
    for i in range(0, len(data), size):
        yield data[i:i + size]

def extract_json_safely(text):
    try:
        json_str = re.search(r'\[\s*{.*?}\s*]', text, re.DOTALL).group()
        return json.loads(json_str)
    except Exception:
        try:
            start, end = text.find('['), text.rfind(']') + 1
            return json.loads(text[start:end])
        except Exception:
            return None

# === בניית פרומפט === #

def build_prompt(sample_data, avoid_qs, lang, num_to_generate):
    questions_list = "\n".join(avoid_qs)
    examples = json.dumps(sample_data, ensure_ascii=False, indent=2)

    if lang == "he":
        return f"""
להלן דוגמאות של סטים של שאלה ותשובה בנושא מסוים:

{examples}

אל תחזור על השאלות הבאות:
{questions_list}

צור {num_to_generate} סטים חדשים של שאלות ותשובות, תוך שמירה על הנושא והסגנון הכללי של הדוגמאות.

שים דגש על ניסוחים מגוונים:
- שאלות מסוגים שונים (הסבר, השוואה, המלצה, פעולה, תיאור)
- תבניות ניסוח שונות (לא לחזור על "מהו..." או "כיצד..." שוב ושוב)
- אל תשתמש בביטויים זהים כמו "הוא..." או "כולל..." בכל תשובה

הימנע מכל חזרתיות – גם ברעיון וגם במבנה. כל סט צריך להיות ייחודי וקל להבנה.

החזר אך ורק מערך JSON תקני. בלי טקסט נוסף, בלי הסברים, בלי markdown.

פורמט:
[
  {{ "question": "...", "answer": "..." }},
  ...
]
"""
    else:
        return f"""
Below are examples of question-answer pairs on a specific topic:

{examples}

Do not repeat the following questions:
{questions_list}

Create {num_to_generate} new Q&A sets, preserving the topic and style of the examples.

Focus on diversity:
- Different types of questions (explanations, comparisons, how-tos, pros/cons, reasoning)
- Vary sentence structures – avoid repeating "What is..." or "How does..." formats
- Do not reuse phrasing like "is..." or "includes..." in every answer

Avoid any redundancy – in ideas or structure. Each set should feel fresh and distinct.

Return ONLY a valid JSON array. No extra text, no explanations, no markdown.

Format:
[
  {{ "question": "...", "answer": "..." }},
  ...
]
"""

# === בקשת ג׳נרציה בודדת === #

def generate_batch(sample_data, avoid_qs, lang, num_to_generate):
    prompt = build_prompt(sample_data, avoid_qs, lang, num_to_generate)
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=TEMPERATURE,
            max_tokens=MAX_TOKENS,
        )
        return extract_json_safely(response.choices[0].message.content)
    except Exception as e:
        print(f"❌ שגיאה בג׳נרציה: {e}")
        return []

# === פונקציית הג׳נרציה הראשית === #

def generate_by_topics(original_data: list, total_to_generate: int, model_name: str):
    if not original_data:
        print("❌ הקובץ ריק! אין שאלות לקרוא.")
        return
    print("🔍 מפתחות של שורה ראשונה:", original_data[0].keys())
    grouped = group_by_topic(original_data)
    print(f"🔍 מספר נושאים שנמצאו: {len(grouped)}")
    for topic, questions in grouped.items():
        print(f"📚 נושא: '{topic}' - מספר שאלות: {len(questions)}")

    distribution = distribute_generation_amount(total_to_generate, grouped)
    lang = detect_language(original_data)

    all_generated = []
    generated_count = 0
    existing_questions = [item["question"].strip() for item in original_data]

    for topic, group_data in grouped.items():
        num_to_generate = distribution[topic]
        if num_to_generate == 0:
            continue

        print(f"\n📚 נושא: {topic} | שאלות קיימות: {len(group_data)} | לג׳נרציה: {num_to_generate}")

        if generated_count >= total_to_generate:
            print("🛑 הושלמה הג׳נרציה של כל הסטים המבוקשים.")
            break

        remaining_for_topic = min(num_to_generate, total_to_generate - generated_count)

        if len(group_data) <= 5:
            to_generate_now = remaining_for_topic
            if to_generate_now <= 0:
                continue

            batch = generate_batch(group_data, existing_questions, lang, to_generate_now)
            if batch:
                all_generated.extend(batch)
                existing_questions.extend(item["question"] for item in batch)
                generated_count += len(batch)
                print(f"⏳ התקדמות: {generated_count} מתוך {total_to_generate} סטים")
                eel.update_progress(generated_count, total_to_generate)
        else:
            chunks = list(chunk_list(group_data, CHUNK_SIZE))
            chunk_count = len(chunks)
            per_chunk = remaining_for_topic // chunk_count
            extra = remaining_for_topic % chunk_count

            for idx, sample in enumerate(chunks):
                if generated_count >= total_to_generate:
                    print("🛑 הושלמה הג׳נרציה של כל הסטים המבוקשים.")
                    break

                to_generate_now = per_chunk + (1 if idx < extra else 0)
                to_generate_now = min(to_generate_now, total_to_generate - generated_count)
                if to_generate_now <= 0:
                    continue

                batch = generate_batch(sample, existing_questions, lang, to_generate_now)
                if batch:
                    all_generated.extend(batch)
                    existing_questions.extend(item["question"] for item in batch)
                    generated_count += len(batch)
                    print(f"⏳ התקדמות: {generated_count} מתוך {total_to_generate} סטים")
                    eel.update_progress(generated_count, total_to_generate)

    # === שלב השלמה אם חסרים סטים ===
    remaining_to_generate = total_to_generate - len(all_generated)
    if remaining_to_generate > 0:
        print(f"\n⚠️ נוצרו רק {len(all_generated)} סטים מתוך {total_to_generate}. משלים את החסר...")

        all_existing = original_data + all_generated
        existing_questions = [item["question"] for item in all_existing]

        sorted_topics = sorted(grouped.items(), key=lambda x: len(x[1]), reverse=True)

        for topic, items in sorted_topics:
            if remaining_to_generate <= 0:
                break

            sample = items[:CHUNK_SIZE]
            batch = generate_batch(sample, existing_questions, lang, remaining_to_generate)
            if batch:
                actual = len(batch)
                all_generated.extend(batch)
                existing_questions.extend(item["question"] for item in batch)
                remaining_to_generate -= actual
                print(f"⏳ הושלמו {actual} סטים נוספים (סה\"כ: {len(all_generated)})")
                eel.update_progress(len(all_generated), total_to_generate)

        if remaining_to_generate > 0:
            print(f"⚠️ עדיין חסרים {remaining_to_generate} סטים – ייתכן שהמודל לא ייצר את כולם.")

    # שמירת הפלט לקובץ
    output_dir = Path(f"data/generated/{model_name}")
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / "generated_raw.json"

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(all_generated, f, ensure_ascii=False, indent=2)

    eel.done_generating()

    print(f"\n✅ נוצרו {len(all_generated)} סטים חדשים עבור המודל '{model_name}'")
    print(f"📁 נשמר אל: {output_path}")
