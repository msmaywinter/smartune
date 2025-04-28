// משתנה גלובלי
let selectedSets = 0;
let modelName = "";

// 1. לחשוף פונקציות ל-eel
eel.expose(update_progress);
function update_progress(current, total) {
  const progressBar = document.getElementById('progress-bar-inner');
  const percentageText = document.getElementById('percentage-text');
  const generatedText = document.getElementById('generated-text');

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
  console.log("Python קרא לפונקציית הסיום!");
  
  // עדכון הטקסט
  const generatedText = document.getElementById('generated-text');
  if (generatedText) {
    generatedText.innerText = "כל השאלות והתשובות נוספו בהצלחה!";
    generatedText.style.color = "#28a745";
    console.log("עודכן טקסט סיום");
  }

  // צריך לקרוא לעדכון המטאדאטה לפני המעבר
  console.log("קורא לעדכון מטאדאטה עם המודל:", modelName);
  eel.finalize_model_generation(modelName)().then(result => {
    console.log("תוצאת עדכון מטאדאטה:", result);
    
    // פרק זמן המתנה
    console.log("מתחיל המתנה לפני מעבר עמוד");
    setTimeout(function() {
      try {
        console.log("מנסה לעבור לעמוד הבא עם המודל:", modelName);
        localStorage.setItem('generatedCount', selectedSets);
        navigateTo(`/questions-summary.html?name=${encodeURIComponent(modelName)}`);
      } catch (error) {
        console.error("שגיאה במעבר עמוד:", error);
        alert('קרתה שגיאה בסיום התהליך.');
      }
    }, 2000);
  }).catch(error => {
    console.error("שגיאה בעדכון מטאדאטה:", error);
    alert('קרתה שגיאה בעדכון המידע.');
  });
}

// 2. להתחיל תהליך הג'נרציה כשנטען העמוד
window.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  modelName = urlParams.get('name');

  if (!modelName) {
    alert('חסר שם מודל - לא ניתן להמשיך.');
    return;
  }

  try {
    // מבקשים את כמות הסטים לג'נרציה מהמטאדאטה
    const metadata = await eel.load_model_metadata(modelName)();
    selectedSets = metadata.generated_requested;

    if (!selectedSets || selectedSets < 1) {
      alert('בעיה בנתוני הג\'נרציה.');
      return;
    }

    // עדכון טקסט ראשוני
    const generatedText = document.getElementById('generated-text');
    if (generatedText) {
      generatedText.innerText = `נוספו 0 שאלות ותשובות מתוך ${selectedSets}`;
    }

    // המתנה שה-navbar ייטען
    const waitForNavbar = setInterval(async () => {
      const logo = document.getElementById('logo-image');
      if (logo) {
        clearInterval(waitForNavbar);
        try {
          const response = await eel.generate_sets(modelName)();
          if (!response.success) {
            alert("קרתה שגיאה ביצירת הסטים.");
            return;
          }
        } catch (error) {
          console.error("שגיאה בהתחלת תהליך הג'נרציה:", error);
          alert('קרתה שגיאה בעת יצירת הסטים.');
        }
      }
    }, 50);

  } catch (error) {
    console.error("שגיאה בטעינת מטאדאטה:", error);
    alert('בעיה בטעינת המידע.');
  }
});