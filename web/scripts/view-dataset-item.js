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

  // שליפה מתוך localStorage כדי לדעת איפה להתחיל
  dataset = JSON.parse(localStorage.getItem("dataset")) || [];
  currentIndex = parseInt(localStorage.getItem("currentIndex")) || 0;

  await refreshDataset();
});

async function refreshDataset() {
  try {
    dataset = await eel.load_generated_data(modelName)();
    if (dataset.length === 0) {
      alert("אין פריטים להצגה.");
      window.location.href = `edit-dataset.html?slug=${modelName}`;
      return;
    }
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

  // עדכון זמינות כפתורים
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
  