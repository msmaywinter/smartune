let modelName = "";
let dataset = [];
let currentIndex = 0;

const questionText = document.getElementById("question-text");
const answerText = document.getElementById("answer-text");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const deleteBtn = document.getElementById("delete-btn");

window.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  modelName = urlParams.get('slug');

  if (!modelName) {
    alert("❌ חסר שם מודל בכתובת.");
    return;
  }

<<<<<<< HEAD
=======
  // שליפה מתוך localStorage כדי לדעת איפה להתחיל
>>>>>>> origin/main
  dataset = JSON.parse(localStorage.getItem("dataset")) || [];
  currentIndex = parseInt(localStorage.getItem("currentIndex")) || 0;

  await refreshDataset();
});

async function refreshDataset() {
  try {
    dataset = await eel.load_generated_data(modelName)();
    if (dataset.length === 0) {
      alert("אין פריטים להצגה.");
<<<<<<< HEAD
      internalNavigation = true;
      window.location.href = `edit-dataset.html?slug=${modelName}`;
      return;
    }

=======
      window.location.href = `edit-dataset.html?slug=${modelName}`;
      return;
    }
>>>>>>> origin/main
    if (currentIndex >= dataset.length) currentIndex = dataset.length - 1;

    localStorage.setItem("dataset", JSON.stringify(dataset));
    localStorage.setItem("currentIndex", currentIndex);
    renderCurrentItem();
  } catch (err) {
    console.error("שגיאה בטעינת הדאטה:", err);
    alert("❌ שגיאה בטעינת המידע מהשרת.");
  }
}

function renderCurrentItem() {
  const current = dataset[currentIndex];
  questionText.textContent = current.question;
  answerText.textContent = current.answer;

<<<<<<< HEAD
=======
  // עדכון זמינות כפתורים
>>>>>>> origin/main
  prevBtn.disabled = currentIndex === 0;
  nextBtn.disabled = currentIndex === dataset.length - 1;

  prevBtn.classList.toggle("disabled-button", currentIndex === 0);
  nextBtn.classList.toggle("disabled-button", currentIndex === dataset.length - 1);
}

// ניווט קדימה
nextBtn.addEventListener("click", () => {
  if (currentIndex < dataset.length - 1) {
    currentIndex++;
    localStorage.setItem("currentIndex", currentIndex);
    renderCurrentItem();
  }
});

// ניווט אחורה
prevBtn.addEventListener("click", () => {
  if (currentIndex > 0) {
    currentIndex--;
    localStorage.setItem("currentIndex", currentIndex);
    renderCurrentItem();
  }
});

<<<<<<< HEAD
// ✅ מחיקה עם פופאפ מותאם אישית
deleteBtn.addEventListener("click", () => {
  showPopup({
    title: "האם למחוק את השאלה והתשובה?",
    subtitle: "פעולה זו סופית ואינה ניתנת לביטול",
    onConfirm: async () => {
      try {
        await eel.delete_from_generated_raw(modelName, currentIndex)();
        await refreshDataset();
      } catch (err) {
        console.error("שגיאה במחיקה:", err);
        alert("❌ שגיאה במחיקת סט.");
      }
    }
  });
});

// חזרה לעריכת המאגר
document.getElementById("back-btn").addEventListener("click", () => {
  const slug = new URLSearchParams(window.location.search).get("slug");
  if (slug) {
  internalNavigation = true;
    window.location.href = `edit-dataset.html?slug=${slug}`;
  } else {
    alert("❌ לא נמצא שם מודל בכתובת.");
  }
});

fetch('components/navbar.html')
.then(res => res.text())
.then(html => {
  document.getElementById('navbar-placeholder').innerHTML = html;

  const script = document.createElement('script');
  script.src = 'scripts/navbar.js';
  script.onload = () => {
    updateProgressBar(1); // כאן תציין את האינדקס של השלב הנוכחי בעמוד הזה
  };
  document.body.appendChild(script);
});
=======
// מחיקה מהמאגר (כולל עדכון בשרת)
deleteBtn.addEventListener("click", async () => {
  const confirmed = confirm("האם אתה בטוח שברצונך למחוק את הסט הזה?");
  if (!confirmed) return;

  try {
    await eel.delete_from_generated_raw(modelName, currentIndex)();
    await refreshDataset();
  } catch (err) {
    console.error("שגיאה במחיקה:", err);
    alert("❌ שגיאה במחיקת סט.");
  }
});
document.getElementById("back-btn").addEventListener("click", () => {
    const slug = new URLSearchParams(window.location.search).get("slug");
    if (slug) {
      window.location.href = `edit-dataset.html?slug=${slug}`;
    } else {
      alert("❌ לא נמצא שם מודל בכתובת.");
    }
  });
  
>>>>>>> origin/main
