document.addEventListener("DOMContentLoaded", () => {
    const uploaded = localStorage.getItem('uploadedCount');
    const generated = localStorage.getItem('generatedCount');
  
    if (uploaded && generated) {
      const total = Number(uploaded) + Number(generated);
  
      document.getElementById('uploaded-count').innerText = uploaded;
      document.getElementById('generated-count').innerText = generated;
      document.getElementById('total-count').innerText = total;
    } else {
      console.error("❌ לא נמצאו נתונים ב-localStorage.");
    }
  });
  
  function navigateToEdit() {
    navigateTo('/edit-dataset.html'); 
  }
  