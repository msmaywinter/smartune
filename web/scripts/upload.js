document.getElementById('fileInput').addEventListener('change', (event) => {
  const fileInput = event.target;
  if (fileInput.files.length > 0) {
    upload(); // פשוט נריץ את הפונקציה
  } else {
    console.log("📂 שינוי בקובץ אך לא נבחר קובץ.");
  }
});

async function upload() {
  console.log("▶️ upload called");

  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];

  if (!file) {
    console.warn("📛 upload called without file – skipping");
    return;
  }

  const reader = new FileReader();

  reader.onload = async function () {
    const base64data = reader.result.split(',')[1];
    const filename = file.name;

    try {
      await eel.save_file_to_server(base64data, filename)();
      const result = await eel.handle_file_upload(filename)();

      if (result.success) {
        const numOfSets = result.data.length;
        window.location.href = `choose-name.html?count=${numOfSets}`;
      } else {
        const errors = result.errors;
        const shownErrors = errors.slice(0, 5);
        const hiddenErrorsCount = errors.length - shownErrors.length;
      
        let errorListHTML = `
          <h2 class="modal-title">נמצאו ${errors.length} שגיאות בקובץ</h2>
          <p class="modal-subtext">אנא תקנו את השגיאות ונסו להעלות את הקובץ מחדש:</p>
          <ul class="modal-error-list">
            ${shownErrors.map(error => `<li>${error}</li>`).join('')}
          </ul>
        `;
      
        if (hiddenErrorsCount > 0) {
          errorListHTML += `<p class="modal-error-extra">ועוד ${hiddenErrorsCount} שגיאות שלא מוצגות כאן.</p>`;
        }
      
        openModal("error", errorListHTML, [
          { id: "close-modal-button", label: "סגירה", class: "modal-button" }
        ]);
        
      }      
    } catch (err) {
      console.error("שגיאה בזמן העלאה:", err); // הדפסה לקונסול
    
      openModal("error", `
        <h2 class="modal-title">שגיאה בהעלאת הקובץ</h2>
        <p class="modal-subtext">אירעה שגיאה כללית בעת העלאת הקובץ. אנא נסה שוב מאוחר יותר.</p>
      `, [
        { id: "close-modal-button", label: "סגירה", class: "modal-button" }
      ])       

    } finally {
      fileInput.value = ""; // 🛠 מנקה כדי שלא ייקרא שוב בטעות
    }
  };

  reader.readAsDataURL(file);
}

function positionTipBox() {
  const example = document.querySelector('.example-section');
  const avoid = document.querySelector('.avoid-section');
  const tips = document.querySelector('.tips-section');

  if (!example || !avoid || !tips) return;

  const exampleTop = example.offsetTop;
  const avoidTop = avoid.offsetTop;

  // חישוב נקודת האמצע
  const centerBetweenSections = (exampleTop + avoidTop) / 2;

  // אפשר לקזז אם צריך לדייק מיקום
  const offset = -227;
  tips.style.top = `${centerBetweenSections - offset}px`;
}

// מריצים כשהדף נטען
window.addEventListener('load', positionTipBox);

// וגם כאשר משנים גודל מסך
window.addEventListener('resize', positionTipBox);

document.addEventListener('DOMContentLoaded', () => {
  const noFile = document.querySelector('.scroll-wrapper');
  const target = document.getElementById('example');

  if (noFile && target) {
    noFile.addEventListener('click', () => {
      target.scrollIntoView({ behavior: 'smooth' });
    });
  }
});

