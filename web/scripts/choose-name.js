const input = document.getElementById("modelNameInput");
const errorMsg = document.getElementById("name-error");
const continueButton = document.querySelector(".bottom-buttons .nav-button:last-child");
const backButton = document.getElementById('back-button');
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

function resetValidationUI() {
  continueButton.classList.add("disabled-button");
  errorMsg.style.display = "none";
  errorMsg.textContent = "";
  lastValidState = null;
}

async function initChooseNamePage() {
  try {
    const uploadTitle = document.getElementById("upload-success-title");
    const uploadedFilename = localStorage.getItem("uploadedFilename");
    if (uploadedFilename && uploadTitle) {
      uploadTitle.textContent = `העלאת את הקובץ: ${uploadedFilename}`;
    }

    const tempMeta = await eel.get_temp_metadata()();
    document.getElementById("set-count").textContent =
      `הקובץ מכיל ${tempMeta.original_count} שאלות ותשובות.`;
    originalName = tempMeta.model_name || null;
    if (originalName) {
      input.value = originalName;
      updateContinueButtonState();
      lastValidState = true;
    } else {
      resetValidationUI();
    }
  } catch (err) {
    console.warn("Failed to load temp metadata:", err);
  }

  backButton.addEventListener('click', async () => {
    try {
      const tempMeta = await eel.get_temp_metadata()();
      const slug = tempMeta.slug;
      if (slug) {
        await eel.delete_model_folder(slug)();
      }
      await eel.cleanup_upload()();
      window.location.href = 'upload.html';
    } catch (err) {
      console.error("שגיאה במחיקת תיקיית המודל:", err);
      alert("אירעה שגיאה בשחזור. נסו שוב.");
    }
  });
}

window.addEventListener("DOMContentLoaded", initChooseNamePage);

// עדכון בזמן אמת בכל שדה
[input, userInput, descriptionInput].forEach(el => {
  el.addEventListener("input", updateContinueButtonState);
});

continueButton.addEventListener("click", async () => {
  if (continueButton.classList.contains("disabled-button")) return;

  const name = input.value.trim();
  const user = userInput.value.trim();
  const desc = descriptionInput.value.trim();

  if (!name || !user || !desc || !isValidModelName(name)) return;

  try {
    const result = await eel.save_model_metadata(name, user, desc)();
    if (result.success) {
      window.location.href = `suggest-expansion.html?slug=${encodeURIComponent(result.slug)}`;
    } else {
      errorMsg.textContent = result.error;
      errorMsg.style.display = "block";
      continueButton.classList.add("disabled-button");
    }
  } catch (err) {
    errorMsg.textContent = "שגיאה בשמירה. נסי שוב.";
    errorMsg.style.display = "block";
    continueButton.classList.add("disabled-button");
  }
});
