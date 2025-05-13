const urlParams = new URLSearchParams(window.location.search);
const slug = urlParams.get('slug');

// כפתורים
const expandBtn = document.getElementById('expand-button');
const skipBtn = document.getElementById('skip-expansion-button');
const backBtn = document.getElementById('back-button');

async function initSuggestExpansionPage() {
  // אם רוצים להציג count או name, ניתן לטעון מטאדאטה
  try {
    const meta = await eel.get_temp_metadata()();
    document.getElementById('set-count').textContent =
      `הקובץ מכיל ${meta.original_count} שאלות ותשובות.`;
  } catch (err) {
    console.warn('Error loading temp metadata:', err);
  }

  // חזרה: לשחרר מלא וזיהוי מטאדאטה
  backBtn.addEventListener('click', () => {
    eel.revert_temp_metadata(slug)().then(res => {
      if (res.success) {
        window.location.href = 'choose-name.html';
      } else {
        alert('שחזור נכשל');
      }
    });
  });

  expandBtn.addEventListener('click', () => {
    window.location.href = `add-ai-option.html?slug=${encodeURIComponent(slug)}`;
  });

  skipBtn.addEventListener('click', () => {
    window.location.href = `parameters.html?slug=${encodeURIComponent(slug)}`;
  });
}

window.addEventListener('DOMContentLoaded', initSuggestExpansionPage);