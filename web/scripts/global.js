function navigateTo(page) {
  // אם eel קיים, נסגור; אחרת נתעלם
  if (typeof eel !== 'undefined' && typeof eel.close === 'function') {
    eel.close();
  }
  // נחכה טיפה, ואז נטען את העמוד החדש
  setTimeout(() => {
    window.location.href = page;
  }, 100);
}

window.addEventListener('DOMContentLoaded', () => {
  // Navbar
  fetch('components/navbar.html')
    .then(response => response.text())
    .then(html => {
      const placeholder = document.getElementById('navbar-placeholder');
      if (placeholder) {
        placeholder.innerHTML = html;

        // נוודא ששינוי הלוגו קורה אחרי שה-DOM התעדכן
        setTimeout(() => {
          adjustLogoByPageType();
        }, 0);
      }
    });

  // Preloader
  fetch('components/preloader.html')
    .then(response => response.text())
    .then(html => {
      const placeholder = document.getElementById('preloader-placeholder');
      if (placeholder) {
        placeholder.innerHTML = html;
      }
    });
});

// פונקציה שמחליפה את הלוגו לפי סוג העמוד
function adjustLogoByPageType() {
  const logo = document.getElementById('logo-image');
  if (logo) {
    if (document.body.classList.contains('black-logo-page')) {
      logo.src = 'assets/SmarTune.png'; // לוגו שחור
    } else {
      logo.src = 'assets/SmarTune_white.png'; // לוגו לבן לעמודים אחרים
    }
  }
}

// טיפול בפרילודר
window.addEventListener("load", () => {
  const waitForPreloader = setInterval(() => {
    const preloader = document.getElementById("preloader");
    if (preloader) {
      preloader.style.opacity = "0";
      preloader.style.transition = "opacity 0.5s ease";
      setTimeout(() => {
        preloader.style.display = "none";
        document.dispatchEvent(new Event("preloaderDone"));
      }, 500);
      clearInterval(waitForPreloader);
    }
  }, 50);
});

window.navigateTo = navigateTo;