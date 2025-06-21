const urlParams = new URLSearchParams(window.location.search);
const slug = urlParams.get("slug");

if (!slug) {
  alert("שגיאה: לא נמצא מזהה מודל (slug)");
}

window.currentSlug = slug;

const slider = document.getElementById('creativity-slider');
const tooltip = document.getElementById('tooltip-creativity');
let modelPrepared = false;

function updateSliderTooltip() {
  const percent = (slider.value - slider.min) / (slider.max - slider.min);
  tooltip.textContent = slider.value;
  tooltip.style.left = `${percent * 100}%`;
}

slider.addEventListener('input', updateSliderTooltip);
window.addEventListener('resize', updateSliderTooltip);
updateSliderTooltip();

const questionInput = document.getElementById("question");
const sendButton = document.getElementById("send-message-button");

sendButton.addEventListener("click", sendMessage);
questionInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault(); // מונע ירידת שורה
    sendMessage();
  }
});

async function sendMessage() {
  const question = questionInput.value.trim();
  const creativity = parseInt(slider.value) / 100;

  if (!question) return;

  addMessageToChat("user", question);
  questionInput.value = "";

  // ✅ צור מיד את ההודעה הריקה עם האנימציה
  const loadingEl = addMessageToChat("model", "");
  loadingEl.classList.add("loading-dots");

  // ✅ טען את המודל רק בפעם הראשונה
  if (!modelPrepared) {
    await eel.prepare_model_for_testing(window.currentSlug, creativity)();
    modelPrepared = true;
  }

  try {
    const response = await eel.ask_model_js(question, creativity)();
    console.log("תשובת פייתון:", response);
    loadingEl.classList.remove("loading-dots");
    loadingEl.textContent = response || "[לא התקבלה תשובה]";
  } catch (error) {
    console.error("שגיאה בקבלת תשובה:", error);
    loadingEl.classList.remove("loading-dots");
    loadingEl.textContent = "[שגיאה בתשובה מהמודל]";
  }
}


function addMessageToChat(sender, text) {
  const chatInner = document.querySelector(".chat-inner");
  const messageEl = document.createElement("div");
  messageEl.className = sender === "user" ? "message user-message" : "message model-message";
  messageEl.textContent = text;
  chatInner.appendChild(messageEl);
  chatInner.scrollTop = chatInner.scrollHeight;
  return messageEl; // ✅ חשוב להחזיר את האלמנט
}


fetch('components/navbar.html')
.then(res => res.text())
.then(html => {
  document.getElementById('navbar-placeholder').innerHTML = html;

  const script = document.createElement('script');
  script.src = 'scripts/navbar.js';
  script.onload = () => {
    updateProgressBar(4); // כאן תציין את האינדקס של השלב הנוכחי בעמוד הזה
  };
  document.body.appendChild(script);
});

document.addEventListener('DOMContentLoaded', () => {
  const popup = document.getElementById("creativity-popup");
  const closeBtn = document.getElementById("creativity-popup-close");
  const icon = document.querySelector(".creativity-row .info-icon");

  if (icon && popup && closeBtn) {
    icon.style.cursor = "pointer";

    icon.addEventListener("click", () => {
      popup.classList.remove("hidden");
    });

    closeBtn.addEventListener("click", () => {
      popup.classList.add("hidden");
    });
  }
});

function closeConfirmPopup() {
  document.querySelectorAll('.confirm-popup').forEach(p => p.classList.add('hidden'));
}


document.getElementById('back-button').addEventListener('click', () => {
  document.getElementById('backParamsPopup').classList.remove('hidden');
});

document.getElementById('confirmBackParams').addEventListener('click', () => {
  const slug = new URLSearchParams(window.location.search).get("slug");
  window.location.href = `parameters.html?slug=${encodeURIComponent(slug)}`;
});

document.getElementById('finish-button').addEventListener('click', () => {
  document.getElementById('finishPopup').classList.remove('hidden');
});


document.getElementById('confirmFinish').addEventListener('click', () => {
  window.location.href = 'home.html'; // או כל עמוד אחר שתרצה בסיום
});

document.getElementById("export-zip").addEventListener("click", async () => {
  try {
    const response = await eel.export_zip_package(slug)();
    if (response && response.success) {
      const zipUrl = response.zip_path;
      const a = document.createElement("a");
      a.href = zipUrl;
      a.download = zipUrl.split("/").pop();
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      alert("❌ שגיאה ביצירת קובץ ZIP: " + response.error);
    }
  } catch (err) {
    console.error("שגיאה כללית:", err);
    alert("❌ תקלה בלתי צפויה בעת הורדה");
  }
});
