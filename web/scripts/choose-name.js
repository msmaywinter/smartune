const input = document.getElementById("modelNameInput");
const errorMsg = document.getElementById("name-error");
const continueButton = document.querySelector(".bottom-buttons .nav-button:last-child");

let lastValidState = null; // זוכר האם הפעם הקודמת הייתה תקינה

function resetValidationUI() {
  continueButton.classList.add("disabled-button");
  errorMsg.style.display = "none";
  errorMsg.textContent = "";
  lastValidState = null;
}

window.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const count = urlParams.get("count");
  
    if (count) {
      const display = document.getElementById("set-count");
      display.textContent = `הקובץ מכיל ${count} שאלות ותשובות.`;
    }
  });  

  input.addEventListener("input", async () => {
    const name = input.value.trim();
  
    if (!name) {
      resetValidationUI();
      return;
    }    
  
    try {
      const result = await eel.validate_model_name(name)();
  
      if (result.success) {
        if (lastValidState !== true) {
          continueButton.classList.remove("disabled-button");
          errorMsg.style.display = "none";
          errorMsg.textContent = "";
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
      console.log("תוצאה מהשרת:", result);
  
      if (result.success) {
        // העברת פרמטר של שם המודל כדי שתהיה לעמוד הבא גישה למטאדאטה
        window.location.href = `add-ai-option.html?name=${encodeURIComponent(name)}`;
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
  