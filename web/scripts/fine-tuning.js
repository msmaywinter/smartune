document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get("slug");
  const configPath = urlParams.get("path");

  if (!slug || !configPath) {
    alert("שגיאה: חסרים פרמטרים בכתובת");
    return;
  }

  window.currentSlug = slug;
  let startTime = Date.now();

  const messages = [
  "המודל מתכוונן לפי הפרמטרים שבחרת",
  "הכוונון בעיצומו – המודל לומד מהנתונים שלך",
  "מבצע אופטימיזציה...",
  "המודל מתעדכן – עוד קצת סבלנות",
  "המערכת מעבדת את המידע שהוזן",
  "המחשב עובד – תהליך הלמידה מתקדם"
  ];

  let currentIndex = 0;
  const statusElement = document.getElementById("status-message");

  function updateMessage() {
    statusElement.style.opacity = 0;
    statusElement.style.transform = 'translateY(10px)';
    setTimeout(() => {
      statusElement.innerHTML = `<span>${messages[currentIndex]}</span>`;
      statusElement.style.opacity = 1;
      statusElement.style.transform = 'translateY(0)';
      currentIndex = (currentIndex + 1) % messages.length;
    }, 400);
  }

  updateMessage();
  const messageInterval = setInterval(updateMessage, 5000);

  const timerInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const seconds = Math.floor((elapsed / 1000) % 60);
    const minutes = Math.floor((elapsed / (1000 * 60)) % 60);
    const hours = Math.floor(elapsed / (1000 * 60 * 60));
    const formatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById("training-timer").textContent = formatted;
  }, 1000);

  // 📌 החשוב — expose לפני שהפייתון מנסה לקרוא לה
  eel.expose(training_complete_js);
  function training_complete_js() {
    clearInterval(timerInterval);
    clearInterval(messageInterval);

    const statusElement = document.getElementById("status-message");
    statusElement.innerHTML = `<span>האימון הושלם בהצלחה!</span>`;

    const mailSection = document.querySelector(".mail-section");
    const feedback = document.getElementById("email-feedback");
    if (mailSection) mailSection.remove();
    if (feedback) feedback.remove();

    const button = document.createElement("button");
    button.textContent = "לבדיקת המודל";
    button.className = "nav-button";
    button.onclick = () => {
    internalNavigation = true;
      window.location.href = `test-model.html?slug=${encodeURIComponent(window.currentSlug)}`;
    };

    const container = document.querySelector(".hero-section");
    container.appendChild(button);
  }

  // 🧠 התחלת האימון
  eel.start_training_from_path(configPath)().then(result => {
    if (!result.success) {
      alert("אירעה שגיאה במהלך האימון");
    }
  });

  // ✉️ שליחת מייל
document.getElementById("send-email-button").addEventListener("click", () => {
  const emailInput = document.getElementById("emailAddress");
  const email = emailInput.value.trim();
  const feedback = document.getElementById("email-feedback");

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!emailRegex.test(email)) {
    feedback.textContent = "כתובת הדוא״ל שהוזנה אינה תקינה";
    feedback.className = "email-feedback error";
    return;
  }

  // Clear the input field
  emailInput.value = "";

  // Show success message with email
  feedback.textContent = `✔ נשלח מייל ל: ${email} בסיום התהליך`;
  feedback.className = "email-feedback success";

  if (window.eel) {
    eel.register_email_for_notification(email);
  }
});

fetch('components/navbar.html')
.then(res => res.text())
.then(html => {
  document.getElementById('navbar-placeholder').innerHTML = html;

  const script = document.createElement('script');
  script.src = 'scripts/navbar.js';
  script.onload = () => {
    updateProgressBar(3); // כאן תציין את האינדקס של השלב הנוכחי בעמוד הזה
  };
  document.body.appendChild(script);
});

 const endButton = document.getElementById('end-button');
  const cancelPopup = document.getElementById('cancelPopup');
  const cancelConfirmBtn = document.getElementById('cancelConfirmBtn');

  endButton.addEventListener('click', () => {
    cancelPopup.classList.remove('hidden');
  });

  function closePopup() {
    cancelPopup.classList.add('hidden');
  }

  cancelConfirmBtn.addEventListener('click', async () => {
    try {
      const result = await eel.stop_fine_tuning()();
      console.log("מצב הפסקה:", result);
      internalNavigation = true;
      window.location.href = "home.html"; // או עמוד סיום
    } catch (err) {
      console.error("שגיאה בהפסקת האימון:", err);
    }
  });

  // כפתור חזרה לפרמטרים
const backButton = document.getElementById('back-to-params-button');
const backPopup = document.getElementById('backPopup');
const backConfirmBtn = document.getElementById('backConfirmBtn');

backButton.addEventListener('click', () => {
  backPopup.classList.remove('hidden');
});

function closeBackPopup() {
  backPopup.classList.add('hidden');
}

  // כפתור חזרה מתוך פופאפ הביטול
  const cancelBackBtn = document.querySelector('#cancelPopup .btn-cancel');
  cancelBackBtn.addEventListener('click', () => {
    cancelPopup.classList.add('hidden');
  });

  // כפתור חזרה מתוך פופאפ הפרמטרים
  const backCancelBtn = document.querySelector('#backPopup .btn-cancel');
  backCancelBtn.addEventListener('click', () => {
    backPopup.classList.add('hidden');
  });

backConfirmBtn.addEventListener('click', async () => {
  try {
    const result = await eel.stop_fine_tuning()(); // כמו כפתור ביטול
    console.log("מצב הפסקה:", result);
console.log("🔁 עובר לעמוד פרמטרים עם slug:", window.currentSlug);
internalNavigation = true;
window.location.href = `parameters.html?slug=${encodeURIComponent(window.currentSlug)}`;
  } catch (err) {
    console.error("שגיאה בהפסקת האימון:", err);
  }
});
});