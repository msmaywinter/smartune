const input = document.getElementById("modelNameInput");
const errorMsg = document.getElementById("name-error");
const continueButton = document.querySelector(".bottom-buttons .nav-button:last-child");
const backButton = document.getElementById('back-button');
<<<<<<< HEAD
const userInput = document.getElementById("userNameInput");
const descriptionInput = document.getElementById("descriptionInput");

let lastValidState = null;
let originalName = null;

function isValidModelName(name) {
  const pattern = /^[a-zA-Z0-9_\- ]+$/;
  return pattern.test(name.trim());
}

function updateContinueButtonState() {
  const name = input.value.trim();
  const user = userInput.value.trim();
  const desc = descriptionInput.value.trim();

  const allFilled = name && user && desc;
  const nameValid = isValidModelName(name);

  if (!nameValid && name) {
    errorMsg.textContent = "שם המודל יכול להכיל רק אותיות באנגלית, מספרים, רווחים, מקפים וקווים תחתונים.";
    errorMsg.style.display = "block";
  } else {
    errorMsg.style.display = "none";
  }

  if (allFilled && nameValid) {
    continueButton.classList.remove("disabled-button");
  } else {
    continueButton.classList.add("disabled-button");
  }
}
=======

let lastValidState = null;      // זוכר האם הפעם הקודמת הייתה תקינה
let originalName = null;        // השם שהמשתמש הזין קודם (מטאדאטה זמני)
>>>>>>> origin/main

function resetValidationUI() {
  continueButton.classList.add("disabled-button");
  errorMsg.style.display = "none";
  errorMsg.textContent = "";
  lastValidState = null;
}

async function initChooseNamePage() {
<<<<<<< HEAD
  try {
    const uploadTitle = document.getElementById("upload-success-title");
    const uploadedFilename = localStorage.getItem("uploadedFilename");
    if (uploadedFilename && uploadTitle) {
      uploadTitle.textContent = `העלאת את הקובץ: ${uploadedFilename}`;
    }

=======
  // 1. טען מטאדאטה זמני כולל count ו-model_name
  try {
    // הצגת שם הקובץ שהועלה בכותרת
// הצגת שם הקובץ בכותרת
const uploadTitle = document.getElementById("upload-success-title");
const uploadedFilename = localStorage.getItem("uploadedFilename");
if (uploadedFilename && uploadTitle) {
  uploadTitle.textContent = `העלאת את הקובץ: ${uploadedFilename}`;
}
>>>>>>> origin/main
    const tempMeta = await eel.get_temp_metadata()();
    document.getElementById("set-count").textContent =
      `הקובץ מכיל ${tempMeta.original_count} שאלות ותשובות.`;
    originalName = tempMeta.model_name || null;
    if (originalName) {
      input.value = originalName;
<<<<<<< HEAD
      updateContinueButtonState();
=======
      continueButton.classList.remove("disabled-button");
>>>>>>> origin/main
      lastValidState = true;
    } else {
      resetValidationUI();
    }
  } catch (err) {
    console.warn("Failed to load temp metadata:", err);
  }

<<<<<<< HEAD
  backButton.addEventListener('click', async () => {
    try {
      const tempMeta = await eel.get_temp_metadata()();
      const slug = tempMeta.slug;
      if (slug) {
        await eel.delete_model_folder(slug)();
      }
      await eel.cleanup_upload()();
      internalNavigation = true;
      window.location.href = 'upload.html';
    } catch (err) {
      console.error("שגיאה במחיקת תיקיית המודל:", err);
      alert("אירעה שגיאה בשחזור. נסו שוב.");
    }
  });
=======
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
>>>>>>> origin/main
}

window.addEventListener("DOMContentLoaded", initChooseNamePage);

<<<<<<< HEAD
// עדכון בזמן אמת בכל שדה
[input, userInput, descriptionInput].forEach(el => {
  el.addEventListener("input", updateContinueButtonState);
=======
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
>>>>>>> origin/main
});

continueButton.addEventListener("click", async () => {
  if (continueButton.classList.contains("disabled-button")) return;
<<<<<<< HEAD

  const name = input.value.trim();
  const user = userInput.value.trim();
  const desc = descriptionInput.value.trim();

  if (!name || !user || !desc || !isValidModelName(name)) return;

  try {
    const result = await eel.save_model_metadata(name, user, desc)();
    if (result.success) {
    internalNavigation = true;
      window.location.href = `suggest-expansion.html?slug=${encodeURIComponent(result.slug)}`;
=======
  const name = input.value.trim();
  try {
    const result = await eel.save_model_metadata(name)();
    if (result.success) {
      window.location.href =
        `suggest-expansion.html?slug=${encodeURIComponent(result.slug)}`;
>>>>>>> origin/main
    } else {
      errorMsg.textContent = result.error;
      errorMsg.style.display = "block";
      continueButton.classList.add("disabled-button");
<<<<<<< HEAD
    }
  } catch (err) {
    errorMsg.textContent = "שגיאה בשמירה. נסי שוב.";
    errorMsg.style.display = "block";
    continueButton.classList.add("disabled-button");
  }
});
=======
      lastValidState = false;
    }
  } catch (err) {
    errorMsg.textContent = "שגיאה בשמירת השם. נסי שוב.";
    errorMsg.style.display = "block";
    continueButton.classList.add("disabled-button");
    lastValidState = false;
  }
});
>>>>>>> origin/main
