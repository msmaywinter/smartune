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

window.addEventListener("load", () => {
  const waitForPreloader = setInterval(() => {
    const preloader = document.getElementById("preloader");
    if (preloader) {
      preloader.style.opacity = "0";
      preloader.style.transition = "opacity 0.5s ease";
      setTimeout(() => {
        preloader.style.display = "none";

        // יידוע לעמוד: "סיימתי להסתיר את הפרילודר"
        document.dispatchEvent(new Event("preloaderDone"));

      }, 500);
      clearInterval(waitForPreloader);
    }
  }, 50);
});
