import os
import smtplib
import sys
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.image import MIMEImage
import json
#הפתרון - לשים את המייל שמחובר למחשב
sender_email = "smartune.hit@gmail.com"

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


def send_email(to_email, model_name):
    subject = f'תהליך ה-Fine Tuning למודל "{model_name}" הסתיים בהצלחה!'

    html_body = f"""
        <html dir="rtl" lang="he">
          <body style="font-family: Arial, sans-serif; color: #333; background-color: #f9fcfd; padding: 20px;">
            <div style="direction: rtl; text-align: right; max-width: 600px; margin: auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 0 10px rgba(0,0,0,0.05);">
            
              <img src="cid:logo_smartune" alt="Smartune" style="height: 50px; display: block; margin-bottom: 20px;">

              <h2 style="color: #004051; font-size: 22px;"> תהליך ה-Fine Tuning למודל "<span style="color: #0088aa;">{model_name}</span>" הסתיים בהצלחה!</h2>

              <p style="font-size: 16px;">
                שלום,  
                <br><br>
                תהליך האימון של המודל שהגדרת הושלם בהצלחה. כעת ניתן לגשת לממשק המקומי לצורך:
              </p>

              <ul style="font-size: 16px;">
                <li>בדיקת הביצועים של המודל המאומן</li>
                <li>הורדת המודל לשימוש</li>
              </ul>

              <p style="font-size: 16px;">באפשרותך לחזור לממשק בכל עת כדי להמשיך בתהליך.</p>

              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">

              <p style="font-size: 14px; color: #555;">
                בברכה,<br>
                <strong>מערכת Smartune</strong><br>
                מעבדת Generative AI<br>
                הפקולטה לטכנולוגיות למידה<br>
                מכון טכנולוגי חולון
              </p>

              <img src="cid:logo_hit" alt="HIT" style="height: 40px; margin-top: 10px;">
            </div>
          </body>
        </html>
        """

    msg = MIMEMultipart("related")
    msg["Subject"] = subject
    msg["From"] = f"Smartune <{sender_email}>"
    msg["To"] = to_email

    alternative_part = MIMEMultipart("alternative")
    alternative_part.attach(MIMEText("האימון הסתיים – ניתן לחזור לממשק המקומי", "plain", "utf-8"))
    alternative_part.attach(MIMEText(html_body, "html", "utf-8"))
    msg.attach(alternative_part)

    # הוספת הלוגואים מהדיסק
    base_dir = getattr(sys, '_MEIPASS', os.path.abspath("."))  # כדי שיפעל גם אחרי pyinstaller

    for cid, rel_path in [("logo_smartune", "web/assets/SmarTune.png"), ("logo_hit", "web/assets/HitLogo.png")]:
        path = os.path.join(base_dir, rel_path)

        if os.path.exists(path):
            with open(path, "rb") as f:
                img = MIMEImage(f.read())
                img.add_header("Content-ID", f"<{cid}>")
                img.add_header("Content-Disposition", "inline", filename=os.path.basename(path))
                msg.attach(img)
        else:
            print(f"[⚠] לא נמצא לוגו בנתיב: {path}")

    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as server:  # Use SMTP, not SMTP_SSL
            server.ehlo()
            server.starttls()  # Start TLS after connecting
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, [to_email], msg.as_string())
        print(f" נשלח מייל ל־{to_email}")
    except Exception as e:
        print(f"שגיאה בשליחה ל־{to_email}: {e}")


def notify_all(slug: str):
    metadata_path = os.path.join("models", slug, "metadata.json")
    if not os.path.exists(metadata_path):
        print(f"[!] לא נמצא קובץ metadata עבור slug: {slug}")
        return

    with open(metadata_path, "r", encoding="utf-8") as f:
        metadata = json.load(f)
    model_name = metadata.get("model_name", slug)

    path = "emails.txt"

    if not os.path.exists(path):
        print("[!] לא נמצאו אימיילים לשליחה.")
        return

    with open(path, "r", encoding="utf-8") as f:
        emails = [line.strip() for line in f.readlines() if line.strip()]

    for email in emails:
        send_email(email, model_name)

    os.remove(path)
