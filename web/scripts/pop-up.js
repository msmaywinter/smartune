function showPopup({ title, subtitle, onConfirm }) {
    document.getElementById("popupTitle").textContent = title;
    document.getElementById("popupSubtitle").innerHTML = subtitle;
  
    // מוודא שלא נרשם מאזין פעמיים
    const confirmBtn = document.getElementById("popupConfirmBtn");
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
  
    newConfirmBtn.addEventListener("click", () => {
      closePopup();
      onConfirm?.();
    });
  
    document.getElementById("validationPopup").classList.remove("hidden");
  }
  
  function closePopup() {
    document.getElementById("validationPopup").classList.add("hidden");
  }
  