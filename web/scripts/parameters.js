const sliders = document.querySelectorAll('.slider');

sliders.forEach(slider => {
  const tooltip = document.getElementById(`tooltip-${slider.id}`);
  const update = () => {
    const percent = (slider.value - slider.min) / (slider.max - slider.min);
    tooltip.textContent = slider.value;
        tooltip.style.left = `${percent * 100}%`;
  };
  slider.addEventListener('input', update);
  window.addEventListener('resize', update);
  update();
});

const advToggle = document.querySelector('.advanced-toggle');
const paramBox = document.querySelector('.parameter-box');

advToggle.addEventListener('click', () => {
  advToggle.classList.toggle('open');
  paramBox.classList.toggle('open');
});

document.querySelectorAll('.select-wrapper').forEach(wrapper => {
  wrapper.addEventListener('click', event => {
    const btn = event.target.closest('.select-option');
    if (!btn) return;
    wrapper.querySelectorAll('.select-option').forEach(b => {
      b.classList.remove('selected');
    });
    btn.classList.add('selected');
  });
});
