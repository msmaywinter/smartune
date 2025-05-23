const urlParams = new URLSearchParams(window.location.search);
const slug = urlParams.get("slug");

window.addEventListener('DOMContentLoaded', async () => {
  
    if (!slug) {
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
              console.log("Metadata loaded:", metadata);
          
              // עכשיו נמלא את התוכן בדף
              document.getElementById('original-count').innerText = metadata.original_count || 0;
              document.getElementById('generated-count').innerText = metadata.generated_count || 0;
              document.getElementById('total-final-count').innerText = metadata.total_final_count || 0;
          
            } catch (error) {
              console.error("שגיאה בטעינת המטאדאטה:", error);
              alert("קרתה שגיאה בטעינת נתוני הסיכום.");
            }
          }
        }, 50);
  });
  