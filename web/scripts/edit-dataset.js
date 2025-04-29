let modelName = "";

window.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  modelName = urlParams.get('name');
  
    if (!modelName) {
      alert("חסר שם מודל. לא ניתן להמשיך.");
      return;
    }
  
    try {
      const metadata = await eel.load_model_metadata(modelName)();
    } catch (error) {
      console.error("שגיאה בטעינת המטאדאטה:", error);
    }

    try {
      const generated_data = await eel.load_generated_data(modelName)();
    } catch (error) {
      console.error("שגיאה בטעינת קובץ הדאטה:", error);
    }
    
  });
  