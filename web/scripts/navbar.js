function updateProgressBar(currentStep) {
  const steps = document.querySelectorAll('.progress-bar .step');

  steps.forEach((step, index) => {
    const circle = step.querySelector('.circle');
    step.classList.remove('done', 'current');
    circle.innerHTML = '';

    if (index < currentStep) {
      step.classList.add('done');
      circle.innerHTML = `
        <svg class="check-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 13l4 4L19 7" />
        </svg>`;
    } else if (index === currentStep) {
      step.classList.add('current');
    }
  });
}
