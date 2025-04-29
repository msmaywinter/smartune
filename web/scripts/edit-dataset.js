window.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get('slug'); // כאן צריך const!

  if (!slug) { // כאן צריך לבדוק slug, לא modelName
    alert("חסר שם מודל. לא ניתן להמשיך.");
    return;
  }

  // המתנה שה-navbar ייטען
  const waitForNavbar = setInterval(async () => {
    const logo = document.getElementById('logo-image');
    if (logo) {
      clearInterval(waitForNavbar);

      try {
        const metadata = await eel.load_model_metadata(slug)();
        console.log("מטאדאטה נטען בהצלחה:", metadata);
      } catch (error) {
        console.error("שגיאה בטעינת המטאדאטה:", error);
      }

      try {
        await new Promise(resolve => setTimeout(resolve, 800));
        const generated_data = await eel.load_generated_data(slug)();
        console.log("דאטה מג׳ונרט נטען בהצלחה:", generated_data);
      } catch (error) {
        console.error("שגיאה בטעינת קובץ הדאטה:", error);
      }
    }
  }, 50);
});
