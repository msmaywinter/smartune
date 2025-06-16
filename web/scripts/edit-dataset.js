let modelName = "";
const continueButton = document.getElementById('save-and-continue');
const urlParams = new URLSearchParams(window.location.search);
const slug = urlParams.get("slug");

window.addEventListener("DOMContentLoaded", async () => {
  const questionInput = document.getElementById("new-question-input");
  const answerInput = document.getElementById("new-answer-input");
  const addButton = document.getElementById("add-question-btn");

  function validateInputs() {
    const question = questionInput.value.trim();
    const answer = answerInput.value.trim();

    addButton.disabled = !(question && answer);
  }

  questionInput.addEventListener("input", validateInputs);
  answerInput.addEventListener("input", validateInputs);

  // התחלה - הכפתור כבוי
  addButton.disabled = true;

  modelName = urlParams.get('slug');

  if (!modelName) {
    alert("חסר שם מודל בכתובת.");
    return;
  }

  try {
    const generated = await eel.load_generated_data(modelName)();
    renderQAList(generated);
  } catch (error) {
    console.error("שגיאה בטעינת הנתונים:", error);
    alert("שגיאה בטעינת השאלות שנוצרו.");
  }

  document.getElementById("add-question-btn").addEventListener("click", async () => {
    const questionInput = document.getElementById("new-question-input");
    const answerInput = document.getElementById("new-answer-input");

    const question = questionInput.value.trim();
    const answer = answerInput.value.trim();

    if (!question || !answer) {
      alert("נא למלא גם שאלה וגם תשובה.");
      return;
    }

    try {
      await eel.append_to_generated_raw(modelName, { question, answer })();
      const updated = await eel.load_generated_data(modelName)();
      renderQAList(updated);
      questionInput.value = "";
      answerInput.value = "";
      validateInputs(); // מפעיל בדיקה מחודשת — הכפתור שוב נהיה disabled

    } catch (err) {
      console.error("שגיאה בהוספת שאלה:", err);
      alert("שגיאה בהוספת שאלה.");
    }
  });

});

continueButton.addEventListener('click', () => {
    eel.cleanup_upload()().then(() => {
      window.location.href = `parameters.html?slug=${encodeURIComponent(slug)}`;
    });
});

document.querySelector(".download-button").addEventListener("click", async () => {
  try {
    console.log("מתחיל ייצוא לאקסל...");
    const relativePath = await eel.export_model_to_excel(modelName)();
    console.log("➡️ הנתיב שהוחזר:", relativePath);

    if (!relativePath) {
      alert("שגיאה ביצוא הנתונים.");
      return;
    }

    const a = document.createElement("a");
    a.href = relativePath; // כבר יחסי מ-root של Eel
    a.download = `${modelName}_dataset.xlsx`;
    a.click();

  } catch (err) {
    console.error("שגיאה ביצוא:", err);
    alert("שגיאה ביצוא הנתונים.");
  }
});



async function renderQAList(list) {
  const container = document.getElementById("qa-container");
  container.innerHTML = "";

  list.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "qa-row";

    // הוספת התנהגות של מעבר לעמוד צפייה בפריט
    row.addEventListener("click", () => {
      localStorage.setItem("dataset", JSON.stringify(list));
      localStorage.setItem("currentIndex", index);
      window.location.href = `view-dataset-item.html?slug=${modelName}`;
    });    

    // תיבת שאלה
    const questionBox = document.createElement("div");
    questionBox.className = "qa-box qa-question";
    questionBox.innerText = item.question;

    // תיבת תשובה
    const answerBox = document.createElement("div");
    answerBox.className = "qa-box qa-answer";
    answerBox.innerText = item.answer;

    // תיבת מחיקה
    const deleteBox = document.createElement("div");
    deleteBox.className = "qa-delete-box";
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.innerText = "✖";

    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation(); // מונע מעבר לעמוד צפייה
    
      showPopup({
        title: "האם למחוק את השאלה והתשובה?",
        subtitle: "פעולה זו סופית ואינה ניתנת לביטול",
        onConfirm: async () => {
          try {
            await eel.delete_from_generated_raw(modelName, index)();
            const updated = await eel.load_generated_data(modelName)();
            renderQAList(updated);
          } catch (err) {
            console.error("שגיאה במחיקה:", err);
            alert("שגיאה במחיקת שאלה.");
          }
        }
      });
    });
    

    deleteBox.appendChild(deleteBtn);

    // הוספת כל התאים לשורה
    row.appendChild(questionBox);
    row.appendChild(answerBox);
    row.appendChild(deleteBox);

    // הוספת השורה לקונטיינר
    container.appendChild(row);
  });
}

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
