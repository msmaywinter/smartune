import os
import smtplib
from email.mime.text import MIMEText
import json
#הפתרון - לשים את המייל שמחובר למחשב
sender_email = "genaitelem@gmail.com"

pending_emails = []
with open("Keys.json", "r", encoding="utf-8") as f:
    keys = json.load(f)

sender_password = keys.get("GMAIL")


def register_email(email: str):
    path = "emails.txt"
    emails = []

    # נטען אם יש כבר קובץ
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            emails = [line.strip() for line in f.readlines() if line.strip()]

    if email not in emails:
        emails.append(email)
        with open(path, "w", encoding="utf-8") as f:
            for e in emails:
                f.write(e + "\n")
        print(f"[✔] כתובת נרשמה: {email}")

def get_all_emails():
    return pending_emails.copy()


def send_email(to_email, subject, body):

    msg = MIMEText(body, "plain", "utf-8")
    msg["Subject"] = subject
    msg["From"] = "מעבדת הAI, טכנולוגיות למידה"
    msg["To"] = to_email

    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as server:  # ✅ Use SMTP, not SMTP_SSL
            server.ehlo()
            server.starttls()  # ✅ Start TLS after connecting
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, [to_email], msg.as_string())
        print(f"[📬] נשלח מייל ל־{to_email}")
    except Exception as e:
        print(f"[❌] שגיאה בשליחה ל־{to_email}: {e}")


def notify_all():

    subject = "האימון הסתיים!"
    body = "שלום! אימון המודל שלך הסתיים. ניתן כעת להוריד את המודל מהממשק. בהצלחה!"
    path = "emails.txt"

    if not os.path.exists(path):
        print("[!] לא נמצאו אימיילים לשליחה.")
        return

    with open(path, "r", encoding="utf-8") as f:
        emails = [line.strip() for line in f.readlines() if line.strip()]

    for email in emails:
        send_email(email, subject, body)

    os.remove(path)
