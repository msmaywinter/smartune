function openFancyModal(data) {
  const modal = document.getElementById('feedbackModal');
  const title = document.getElementById('modalTitle');
  const subtitle = document.getElementById('modalSubtitle');
  const errorList = document.getElementById('modalErrorList');
  const extra = document.getElementById('modalExtra');
  const closeBtn = document.getElementById('closeModalBtn');

  title.innerHTML = data.title || "";
  subtitle.innerHTML = data.subtitle || "";
  errorList.innerHTML = "";
  extra.classList.add('hidden');

  if (data.errors && Array.isArray(data.errors)) {
    const shown = data.errors.slice(0, 5);
    errorList.innerHTML = shown.map(e => `<li>${e}</li>`).join('');
    if (data.errors.length > 5) {
      extra.textContent = `ועוד ${data.errors.length - 5} שגיאות שלא מוצגות כאן.`;
      extra.classList.remove('hidden');
    }
  }

  closeBtn.onclick = () => modal.classList.add('hidden');
  modal.classList.remove('hidden');
}
