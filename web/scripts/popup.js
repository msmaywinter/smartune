function openModal(type = "info", content = "", actions = []) {
  const modal = document.getElementById("feedbackModal");
  const contentContainer = document.getElementById("modalContent");

  // בסיס מודאל
  let headerClass = "modal-info";

  if (type === "success") {
    headerClass = "modal-success";
  } else if (type === "error") {
    headerClass = "modal-error";
  }

  let html = `<div class="${headerClass}">${content}</div>`;

  if (actions && actions.length > 0) {
    html += `<div class="modal-actions">`;
    actions.forEach(action => {
      html += `<button class="modal-button ${action.class}" id="${action.id}">${action.label}</button>`;
    });
    html += `</div>`;
  }

  contentContainer.innerHTML = html;
  modal.classList.remove("hidden");
  modal.style.display = "flex";
}

function closeModal() {
  const modal = document.getElementById("feedbackModal");
  modal.classList.add("hidden");
}

document.addEventListener('click', function(event) {
  switch (event.target.id) {
    case "go-to-parameters":
      // לדוגמה: נווט לעמוד אחר
      internalNavigation = true;
      window.location.href = "parameters.html";
      break;

    case "ai-extend":
      // הצגת קומפוננטת הרחבה / קריאה לפונקציית הצעה
      openAiSuggestions(); // ← פונקציה שתיצור/תציג את ההצעות
      break;

    case "upload-new":
      closeModal();
      document.getElementById("fileInput").value = "";
      break;
    
    case "close-modal-button":
      closeModal();
      break;

  }
});
