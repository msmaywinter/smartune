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
        localStorage.setItem('uploadedFilename', filename);
        localStorage.setItem('uploadedCount', numOfSets);
        window.location.href = `choose-name.html?count=${numOfSets}`;
      } else {
        const errors = result.errors;

        openFancyModal({
          title: `נמצאו ${errors.length} שגיאות בקובץ`,
          subtitle: "אנא תקנו את השגיאות ונסו להעלות את הקובץ מחדש:",
          errors: errors
        });
      }
    } catch (err) {
      console.error("שגיאה בזמן העלאה:", err);

      openFancyModal({
        title: "שגיאה בהעלאת הקובץ",
        subtitle: "אירעה שגיאה כללית בעת העלאת הקובץ. אנא נסו שוב מאוחר יותר.",
        errors: []
      });
    } finally {
      fileInput.value = ""; // מנקה כדי שלא ייקרא שוב בטעות
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

  const centerBetweenSections = (exampleTop + avoidTop) / 2;
  const offset = -227;
  tips.style.top = `${centerBetweenSections - offset}px`;
}

window.addEventListener('load', positionTipBox);
window.addEventListener('resize', positionTipBox);

document.addEventListener('DOMContentLoaded', () => {
  const scrollBtn = document.querySelector('.scroll-btn');
  const target = document.getElementById('two-columns-section');

  if (scrollBtn && target) {
    scrollBtn.addEventListener('click', () => {
      target.scrollIntoView({ behavior: 'smooth' });
    });
  }
});

fetch('components/navbar.html')
  .then(res => res.text())
  .then(html => {
    document.getElementById('navbar-placeholder').innerHTML = html;

    const script = document.createElement('script');
    script.src = 'scripts/navbar.js';
    script.onload = () => {
      updateProgressBar(0); // ציין את השלב הנוכחי
    };
    document.body.appendChild(script);
  });
