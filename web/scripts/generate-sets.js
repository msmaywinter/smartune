// משתנה גלובלי לשמירת מספר הסטים שהמשתמש ביקש
let selectedSets = 0;

// 1. לחשוף פונקציות ל-eel
eel.expose(update_progress);
function update_progress(current, total) {
  const progressBar = document.getElementById('progress-bar-inner');
  const percentageText = document.getElementById('percentage-text');
  const generatedText = document.getElementById('generated-text');

  // אם total עדיין 0, נשתמש ב-selectedSets כדי להציג נכון
  const actualTotal = total > 0 ? total : selectedSets;

  const percentage = actualTotal > 0 ? Math.round((current / actualTotal) * 100) : 0;

  progressBar.style.width = percentage + '%';
  percentageText.innerText = percentage + '%';

  const centerOfProgress = percentage / 2;
  percentageText.style.left = centerOfProgress + '%';
  percentageText.style.right = 'auto';

  generatedText.innerText = `נוספו ${current} שאלות ותשובות מתוך ${actualTotal}`;
}

eel.expose(done_generating);
function done_generating() {
  const generatedText = document.getElementById('generated-text');

  generatedText.innerText = "כל השאלות והתשובות נוספו בהצלחה!";
  generatedText.style.color = "#28a745";

  setTimeout(() => {
    window.location.href = 'data-summary.html';
  }, 2000);
}

// 2. להתחיל תהליך הג'נרציה כשנטען העמוד
window.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  selectedSets = parseInt(urlParams.get('sets'));
  const modelName = urlParams.get('name');

  if (!selectedSets || !modelName) {
    alert('חסרים פרמטרים - לא ניתן להמשיך.');
    return;
  }

  // נחכה שה-navbar נטען (לוגו קיים) לפני שמתחילים ג'נרציה
  const waitForNavbar = setInterval(() => {
    const logo = document.getElementById('logo-image');
    if (logo) {
      clearInterval(waitForNavbar); // הלוגו נמצא = ה-navbar נטען
      const generatedText = document.getElementById('generated-text');
      if (generatedText) {
        generatedText.innerText = `נוספו 0 שאלות ותשובות מתוך ${selectedSets}`;
      }
      // עכשיו בטוח להתחיל ג'נרציה
      try {
        eel.generate_sets(selectedSets, modelName)();
      } catch (error) {
        console.error("שגיאה בהתחלת תהליך הג'נרציה:", error);
        alert('קרתה שגיאה בעת התחלת יצירת הסטים.');
      }
    }
  }, 50);
});
