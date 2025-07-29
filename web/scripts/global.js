<<<<<<< HEAD
// Flag גלובלי
let internalNavigation = false;

window.addEventListener("beforeunload", (e) => {
  if (!internalNavigation && typeof eel !== 'undefined') {
    eel.cleanup_on_close();
  }
});


// ניווט יזום דרך הפונקציה שלך
function navigateTo(page) {
  internalNavigation = true;
  if (typeof eel !== 'undefined' && typeof eel.close === 'function') {
    eel.close();
  }
=======
function navigateTo(page) {
  // אם eel קיים, נסגור; אחרת נתעלם
  if (typeof eel !== 'undefined' && typeof eel.close === 'function') {
    eel.close();
  }
  // נחכה טיפה, ואז נטען את העמוד החדש
>>>>>>> origin/main
  setTimeout(() => {
    window.location.href = page;
  }, 100);
}

<<<<<<< HEAD
// האזנה לקליקים על לינקים או כפתורים פנימיים
document.addEventListener("click", function (e) {
  const target = e.target.closest("a, button");
  if (!target) return;

  if (target.tagName === "A" && target.href && target.origin === location.origin) {
    internalNavigation = true;
  }

  if (target.dataset.navigate === "true") {
    internalNavigation = true;
  }
}, true);

// טיפול בסגירת עמוד
window.addEventListener("beforeunload", function (e) {
  console.log("beforeunload triggered. internalNavigation =", internalNavigation);
  if (!internalNavigation) {
    e.preventDefault();
    e.returnValue = '';
  }
});

// איפוס הדגל בטעינת עמוד חדש
window.addEventListener('DOMContentLoaded', () => {
  internalNavigation = false;

=======
window.addEventListener('DOMContentLoaded', () => {
>>>>>>> origin/main
  // Navbar
  fetch('components/navbar.html')
    .then(response => response.text())
    .then(html => {
      const placeholder = document.getElementById('navbar-placeholder');
      if (placeholder) {
        placeholder.innerHTML = html;
<<<<<<< HEAD
=======

        // נוודא ששינוי הלוגו קורה אחרי שה-DOM התעדכן
>>>>>>> origin/main
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

<<<<<<< HEAD
// החלפת לוגו
=======
// פונקציה שמחליפה את הלוגו לפי סוג העמוד
>>>>>>> origin/main
function adjustLogoByPageType() {
  const logo = document.getElementById('logo-image');
  if (logo) {
    if (document.body.classList.contains('black-logo-page')) {
<<<<<<< HEAD
      logo.src = 'assets/SmarTune.png';
    } else {
      logo.src = 'assets/SmarTune_white.png';
=======
      logo.src = 'assets/SmarTune.png'; // לוגו שחור
    } else {
      logo.src = 'assets/SmarTune_white.png'; // לוגו לבן לעמודים אחרים
>>>>>>> origin/main
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

<<<<<<< HEAD
window.navigateTo = navigateTo;
=======
window.navigateTo = navigateTo;
>>>>>>> origin/main
