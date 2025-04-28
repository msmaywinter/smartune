window.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const modelName = urlParams.get('name');
  
    if (!modelName) {
      alert("חסר שם מודל. לא ניתן להמשיך.");
      return;
    }
  
    try {
      const metadata = await eel.load_model_metadata(modelName)();
      console.log("Metadata loaded:", metadata);
  
      // עכשיו נמלא את התוכן בדף
      document.getElementById('original-count').innerText = metadata.original_count || 0;
      document.getElementById('generated-count').innerText = metadata.generated_count || 0;
      document.getElementById('total-final-count').innerText = metadata.total_final_count || 0;
  
    } catch (error) {
      console.error("שגיאה בטעינת המטאדאטה:", error);
      alert("קרתה שגיאה בטעינת נתוני הסיכום.");
    }
  });
  