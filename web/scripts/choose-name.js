const input = document.getElementById("modelNameInput");
const errorMsg = document.getElementById("name-error");
const continueButton = document.querySelector(".bottom-buttons .nav-button:last-child");
const backButton = document.getElementById('back-button');

let lastValidState = null;      // זוכר האם הפעם הקודמת הייתה תקינה
let originalName = null;        // השם שהמשתמש הזין קודם (מטאדאטה זמני)

function resetValidationUI() {
  continueButton.classList.add("disabled-button");
  errorMsg.style.display = "none";
  errorMsg.textContent = "";
  lastValidState = null;
}

async function initChooseNamePage() {
  // 1. טען מטאדאטה זמני כולל count ו-model_name
  try {
    const tempMeta = await eel.get_temp_metadata()();
    document.getElementById("set-count").textContent =
      `הקובץ מכיל ${tempMeta.original_count} שאלות ותשובות.`;
    originalName = tempMeta.model_name || null;
    if (originalName) {
      input.value = originalName;
      continueButton.classList.remove("disabled-button");
      lastValidState = true;
    } else {
      resetValidationUI();
    }
  } catch (err) {
    console.warn("Failed to load temp metadata:", err);
  }

  // 2. וידוא כפתור חזרה
  backButton.addEventListener('click', async () => {
  try {
    const tempMeta = await eel.get_temp_metadata()();
    const slug = tempMeta.slug;
    if (slug) {
      await eel.delete_model_folder(slug)();
    }
    await eel.cleanup_upload()(); // רק אם את רוצה לנקות גם את uploads
    window.location.href = 'upload.html';
  } catch (err) {
    console.error("שגיאה במחיקת תיקיית המודל:", err);
    alert("אירעה שגיאה בשחזור. נסו שוב.");
  }
});
}

window.addEventListener("DOMContentLoaded", initChooseNamePage);

input.addEventListener("input", async () => {
  const name = input.value.trim();
  if (!name) {
    resetValidationUI();
    return;
  }
  // אם זה השם המקורי – התעלם מבדיקת duplicate
  if (name === originalName) {
    continueButton.classList.remove("disabled-button");
    errorMsg.style.display = "none";
    lastValidState = true;
    return;
  }
  // אחרת – בדיקה רגילה
  try {
    const result = await eel.validate_model_name(name)();
    if (result.success) {
      if (lastValidState !== true) {
        continueButton.classList.remove("disabled-button");
        errorMsg.style.display = "none";
        lastValidState = true;
      }
    } else {
      if (lastValidState !== false) {
        continueButton.classList.add("disabled-button");
        errorMsg.textContent = result.error;
        errorMsg.style.display = "block";
        lastValidState = false;
      }
    }
  } catch (err) {
    if (lastValidState !== false) {
      continueButton.classList.add("disabled-button");
      errorMsg.textContent = "שגיאה בבדיקת השם. נסו שוב.";
      errorMsg.style.display = "block";
      lastValidState = false;
    }
  }
});

continueButton.addEventListener("click", async () => {
  if (continueButton.classList.contains("disabled-button")) return;
  const name = input.value.trim();
  try {
    const result = await eel.save_model_metadata(name)();
    if (result.success) {
      window.location.href =
        `suggest-expansion.html?slug=${encodeURIComponent(result.slug)}`;
    } else {
      errorMsg.textContent = result.error;
      errorMsg.style.display = "block";
      continueButton.classList.add("disabled-button");
      lastValidState = false;
    }
  } catch (err) {
    errorMsg.textContent = "שגיאה בשמירת השם. נסי שוב.";
    errorMsg.style.display = "block";
    continueButton.classList.add("disabled-button");
    lastValidState = false;
  }
});