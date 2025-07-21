const urlParams = new URLSearchParams(window.location.search);
const slug = urlParams.get('slug');

// כפתורים
const expandBtn = document.getElementById('expand-button');
const skipBtn = document.getElementById('skip-expansion-button');
const backBtn = document.getElementById('back-button');

// משתנים לזיהוי מצב
let currentSlug = slug;
let originalSlug = null;

async function initSuggestExpansionPage() {
  try {
    // שליפת מטאדאטה זמנית
    const meta = await eel.get_temp_metadata()();
    originalSlug = meta.original_slug || null;

    // עדכון תצוגה
    if (meta.original_count) {
      document.getElementById('set-count').textContent =
        `הקובץ מכיל ${meta.original_count} שאלות ותשובות.`;
    }
  } catch (err) {
    console.warn('שגיאה בטעינת המטאדאטה הזמנית:', err);
  }

  // כפתור חזרה
  backBtn.addEventListener('click', () => {
    if (!originalSlug) {
      alert("לא ניתן לשחזר – original_slug לא נמצא במטאדאטה.");
      return;
    }

    eel.revert_temp_metadata(currentSlug, originalSlug)().then(res => {
      if (res.success) {
      internalNavigation = true;
        window.location.href = 'choose-name.html';
      } else {
        alert('שחזור נכשל');
      }
    });
  });

  // כפתור הרחבת מאגר
  expandBtn.addEventListener('click', () => {
  internalNavigation = true;
    window.location.href = `add-ai-option.html?slug=${encodeURIComponent(slug)}`;
  });

  // כפתור דילוג
  skipBtn.addEventListener('click', () => {
  internalNavigation = true;
    window.location.href = `parameters.html?slug=${encodeURIComponent(slug)}`;
  });
}

window.addEventListener('DOMContentLoaded', initSuggestExpansionPage);
