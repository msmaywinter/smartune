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
    "זה זמן מושלם להכין קפה ☕",
    "המודל שוקע בלמידה עמוקה",
    "עוד מעט זה מוכן...",
    "המודל לומד מהמידע שלך",
    "המודל מתכוונן...",
    "הישארו רגועים, המודל עובד בשבילכם"
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
    const email = document.getElementById("emailAddress").value.trim();
    const feedback = document.getElementById("email-feedback");

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(email)) {
      feedback.textContent = "כתובת הדוא״ל שהוזנה אינה תקינה";
      feedback.className = "email-feedback error";
      return;
    }

    feedback.textContent = "✔ נשלח אליך מייל בסיום התהליך";
    feedback.className = "email-feedback success";

    if (window.eel) {
      eel.register_email_for_notification(email);
    }
  });
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
      window.location.href = "home.html"; // או עמוד סיום
    } catch (err) {
      console.error("שגיאה בהפסקת האימון:", err);
    }
  });
