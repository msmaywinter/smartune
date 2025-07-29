let modelName = "";
const continueButton = document.getElementById('save-and-continue');
const urlParams = new URLSearchParams(window.location.search);
const slug = urlParams.get("slug");

window.addEventListener("DOMContentLoaded", async () => {
<<<<<<< HEAD
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
  addButton.disabled = true;

  modelName = urlParams.get("slug");
=======
  modelName = urlParams.get('slug');
>>>>>>> origin/main

  if (!modelName) {
    alert("חסר שם מודל בכתובת.");
    return;
  }

  try {
<<<<<<< HEAD
    const metadata = await eel.load_model_metadata(modelName)();

    // כאן החלק החדש:
    if (!metadata.user_generated) {
      await eel.ensure_generated_from_original(modelName)();
    }

=======
>>>>>>> origin/main
    const generated = await eel.load_generated_data(modelName)();
    renderQAList(generated);
  } catch (error) {
    console.error("שגיאה בטעינת הנתונים:", error);
<<<<<<< HEAD
    alert("שגיאה בטעינת השאלות.");
  }

  document.getElementById("add-question-btn").addEventListener("click", async () => {
=======
    alert("שגיאה בטעינת השאלות שנוצרו.");
  }

  document.getElementById("add-question-btn").addEventListener("click", async () => {
    const questionInput = document.getElementById("new-question-input");
    const answerInput = document.getElementById("new-answer-input");

>>>>>>> origin/main
    const question = questionInput.value.trim();
    const answer = answerInput.value.trim();

    if (!question || !answer) {
      alert("נא למלא גם שאלה וגם תשובה.");
      return;
    }

    try {
      await eel.append_to_generated_raw(modelName, { question, answer })();
      const updated = await eel.load_generated_data(modelName)();
<<<<<<< HEAD
      renderQAList(updated, true);

      questionInput.value = "";
      answerInput.value = "";
      questionInput.focus();
      validateInputs();
=======
      renderQAList(updated);
      questionInput.value = "";
      answerInput.value = "";
>>>>>>> origin/main
    } catch (err) {
      console.error("שגיאה בהוספת שאלה:", err);
      alert("שגיאה בהוספת שאלה.");
    }
  });
<<<<<<< HEAD
});


continueButton.addEventListener('click', () => {
    eel.cleanup_upload()().then(() => {
    internalNavigation = true;
=======

});

continueButton.addEventListener('click', () => {
    eel.cleanup_upload()().then(() => {
>>>>>>> origin/main
      window.location.href = `parameters.html?slug=${encodeURIComponent(slug)}`;
    });
});

document.querySelector(".download-button").addEventListener("click", async () => {
  try {
    console.log("מתחיל ייצוא לאקסל...");
<<<<<<< HEAD
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
=======
    const filePath = await eel.export_model_to_excel(modelName)();
    console.log("➡️ קובץ נוצר בנתיב:", filePath);

    if (!filePath) {
      console.error("שגיאה: לא נוצר קובץ.");
      alert("שגיאה ביצוא לאקסל.");
      return;
    }

    // יצירת לינק להורדה
    const fileName = `${modelName}_dataset.xlsx`;
    const downloadUrl = `/exports/${fileName}`;

    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = fileName;
    a.click();

  } catch (err) {
    console.error("שגיאה ביצוא הנתונים:", err);
>>>>>>> origin/main
    alert("שגיאה ביצוא הנתונים.");
  }
});


<<<<<<< HEAD

async function renderQAList(list, scrollToBottom = false) {
=======
async function renderQAList(list) {
>>>>>>> origin/main
  const container = document.getElementById("qa-container");
  container.innerHTML = "";

  list.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "qa-row";

<<<<<<< HEAD
    row.addEventListener("click", () => {
      localStorage.setItem("dataset", JSON.stringify(list));
      localStorage.setItem("currentIndex", index);
      internalNavigation = true;
      window.location.href = `view-dataset-item.html?slug=${modelName}`;
    });

=======
    // הוספת התנהגות של מעבר לעמוד צפייה בפריט
    row.addEventListener("click", () => {
      localStorage.setItem("dataset", JSON.stringify(list));
      localStorage.setItem("currentIndex", index);
      window.location.href = `view-dataset-item.html?slug=${modelName}`;
    });    

    // תיבת שאלה
>>>>>>> origin/main
    const questionBox = document.createElement("div");
    questionBox.className = "qa-box qa-question";
    questionBox.innerText = item.question;

<<<<<<< HEAD
=======
    // תיבת תשובה
>>>>>>> origin/main
    const answerBox = document.createElement("div");
    answerBox.className = "qa-box qa-answer";
    answerBox.innerText = item.answer;

<<<<<<< HEAD
=======
    // תיבת מחיקה
>>>>>>> origin/main
    const deleteBox = document.createElement("div");
    deleteBox.className = "qa-delete-box";
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.innerText = "✖";

<<<<<<< HEAD
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
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
=======
    deleteBtn.addEventListener("click", async (e) => {
      e.stopPropagation(); // מונע מעבר לעמוד צפייה
      const confirmed = confirm("האם אתה בטוח שברצונך למחוק?");
      if (!confirmed) return;

      try {
        await eel.delete_from_generated_raw(modelName, index)();
        const updated = await eel.load_generated_data(modelName)();
        renderQAList(updated);
      } catch (err) {
        console.error("שגיאה במחיקה:", err);
        alert("שגיאה במחיקת שאלה.");
      }
>>>>>>> origin/main
    });

    deleteBox.appendChild(deleteBtn);

<<<<<<< HEAD
    row.appendChild(questionBox);
    row.appendChild(answerBox);
    row.appendChild(deleteBox);
    container.appendChild(row);
  });

  if (scrollToBottom) {
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }
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
=======
    // הוספת כל התאים לשורה
    row.appendChild(questionBox);
    row.appendChild(answerBox);
    row.appendChild(deleteBox);

    // הוספת השורה לקונטיינר
    container.appendChild(row);
  });
}
>>>>>>> origin/main
