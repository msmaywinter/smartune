let modelName = "";

window.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  modelName = urlParams.get('slug');

  if (!modelName) {
    alert("❌ חסר שם מודל בכתובת.");
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
    } catch (err) {
      console.error("שגיאה בהוספת שאלה:", err);
      alert("❌ שגיאה בהוספת שאלה.");
    }
  });

  document.querySelector(".download-button").addEventListener("click", async () => {
    try {
      await eel.export_model_data(modelName)();
      alert("📥 המאגר יוצא בהצלחה!");
    } catch (err) {
      console.error("שגיאה ביצוא המאגר:", err);
      alert("❌ שגיאה ביצוא המאגר.");
    }
  });
});

function renderQAList(list) {
  const container = document.getElementById("qa-container");
  container.innerHTML = "";

  list.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "qa-row";

    const qSpan = document.createElement("span");
    qSpan.className = "qa-question";
    qSpan.innerText = item.question;

    const aSpan = document.createElement("span");
    aSpan.className = "qa-answer";
    aSpan.innerText = item.answer;

    const delBtn = document.createElement("button");
    delBtn.className = "delete-btn";
    delBtn.innerText = "✖";
    delBtn.onclick = async () => {
      const confirmed = confirm("האם אתה בטוח שברצונך למחוק?");
      if (!confirmed) return;

      try {
        await eel.delete_from_generated_raw(modelName, index)();
        const updated = await eel.load_generated_data(modelName)();
        renderQAList(updated);
      } catch (err) {
        console.error("שגיאה במחיקה:", err);
        alert("❌ שגיאה במחיקת שאלה.");
      }
    };

    row.appendChild(qSpan);
    row.appendChild(aSpan);
    row.appendChild(delBtn);
    container.appendChild(row);
  });
}
