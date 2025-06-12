document.addEventListener("DOMContentLoaded", function () {
  const trigger = document.getElementById("scrollTrigger");
  const target = document.querySelector(".context-section");

  if (trigger && target) {
    trigger.addEventListener("click", () => {
      target.scrollIntoView({ behavior: "smooth" });
    });
  }
});

document.addEventListener("preloaderDone", () => {
  const wrapper = document.querySelector(".hero-animate-wrapper");
  if (wrapper) {
    wrapper.classList.add("animate-in");

    const lastElement = wrapper.querySelector('.btn-load-model');
    if (lastElement) {
      lastElement.addEventListener("animationend", () => {
        wrapper.classList.add("animation-complete");
      }, { once: true });
    }
  }

  const scrollWrapper = document.querySelector(".scroll-wrapper");

  if (scrollWrapper) {
    scrollWrapper.addEventListener("animationend", (event) => {
      if (event.animationName === "fadeSlideUp") {
        scrollWrapper.classList.add("scroll-bounce");
      }
    }, { once: true });
  }
});


document.addEventListener('DOMContentLoaded', function () {
  const section = document.querySelector('.context-section');
  const cardTop = document.querySelector('.card-top-right');
  const cardBottom = document.querySelector('.card-bottom-left');

  const maxMove = 200;
  const centerOffset = -100;

  window.addEventListener('scroll', function () {
    const sectionRect = section.getBoundingClientRect();
    const sectionMiddle = sectionRect.top + sectionRect.height / 2;
    const windowMiddle = (window.innerHeight / 2) - centerOffset;

    const distanceFromCenter = sectionMiddle - windowMiddle;

    // נשאיר את המרחק כמו שהוא
    const maxDistance = window.innerHeight / 2;

    const normalized = distanceFromCenter / maxDistance;

    // ⛔ נחליף את הקלמפ ל-TIGHTER — כדי לא לחסום תנועה מוקדם מדי:
    const capped = Math.max(Math.min(normalized, 1.3), -1.3); // 👈 שינוי פה!

    const topMove = capped * maxMove;
    const bottomMove = -capped * maxMove;

    cardTop.style.transform = `translateY(${bottomMove}px)`;
    cardBottom.style.transform = `translateY(${topMove}px)`;
  });


});
function openAbout() {
  document.getElementById('aboutModal').classList.remove('hidden');
}

function closeAbout() {
  document.getElementById('aboutModal').classList.add('hidden');
}