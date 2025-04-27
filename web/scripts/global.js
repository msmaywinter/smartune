function navigateTo(page) {
  window.location.href = page;
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
    if (document.body.classList.contains('loading-page')) {
      logo.src = 'assets/SmarTune.png'; // לוגו שחור לעמוד טעינה
    } else {
      logo.src = 'assets/SmarTune_white.png'; // לוגו רגיל לעמודים אחרים
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
