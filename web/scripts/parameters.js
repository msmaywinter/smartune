function uiToRealLinear(ui, {min, max}) {
  return min + (ui / 100) * (max - min);
}

function realFromUiLog(uiVal, realMin, realMax) {
  const logMin = Math.log10(realMin);
  const logMax = Math.log10(realMax);
  const t = uiVal / 100;
  const logVal = logMin + t * (logMax - logMin);
  return Number(10 ** logVal);
}

function uiFromRealLog(realVal, realMin, realMax) {
  const logMin = Math.log10(realMin);
  const logMax = Math.log10(realMax);
  const logVal = Math.log10(realVal);
  return Math.round((logVal - logMin) / (logMax - logMin) * 100);
}

let paramDefs = [];

window.addEventListener('DOMContentLoaded', () => {
  eel.load_params()(defs => {
    paramDefs = defs;
    initRendering();
  });
});

function initRendering() {
  const container = document.querySelector('.parameter-box');
  const basicDefs    = paramDefs.slice(0, 3);
  const advancedDefs = paramDefs.slice(3);

  container.innerHTML = '';

  basicDefs.forEach(def => container.appendChild(renderParam(def)));

  const toggle = document.createElement('div');
  toggle.classList.add('advanced-toggle');
  toggle.innerHTML = `<span>פרמטרים מתקדמים</span>
    <svg class="arrow-down" …>…</svg>`;
  container.appendChild(toggle);

  const advContainer = document.createElement('div');
  advContainer.classList.add('advanced-params');
  advancedDefs.forEach(def => advContainer.appendChild(renderParam(def)));
  container.appendChild(advContainer);

  attachListeners();
}

function renderParam(def) {
  const wrapper = document.createElement('div');
  wrapper.classList.add('parameter');

  const label = document.createElement('label');
  label.htmlFor = def.key;
  label.textContent = def.label;
  wrapper.appendChild(label);

  if (def.type === 'range') {
    const sw = document.createElement('div');
    sw.classList.add('slider-wrapper');

    const input = document.createElement('input');
    input.type = 'range';
    input.id = def.key;
    input.classList.add('slider');
    input.min = 0;
    input.max = 100;
    const defaultUi = def.key === 'learning_rate'
      ? uiFromRealLog(def.realRange.default, def.realRange.min, def.realRange.max)
      : Math.round((def.realRange.default - def.realRange.min) / (def.realRange.max - def.realRange.min) * 100);
    input.value = defaultUi;

    sw.appendChild(input);

    const tooltip = document.createElement('div');
    tooltip.classList.add('slider-tooltip');
    tooltip.id = `tooltip-${def.key}`;
    tooltip.textContent = input.value;
    sw.appendChild(tooltip);

    wrapper.appendChild(sw);

    const ends = document.createElement('div');
    ends.classList.add('endpoints');
    ends.innerHTML = `<span class="endpoint">${def.endpoints[0]}</span><span class="endpoint">${def.endpoints[1]}</span>`;
    wrapper.appendChild(ends);

  } else if (def.type === 'select') {
    const sw = document.createElement('div');
    sw.classList.add('select-wrapper');

    def.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.classList.add('select-option');
      btn.dataset.value = opt.value;
      btn.textContent = opt.label;
      if (`${opt.value}` === `${def.default}`) btn.classList.add('selected');
      sw.appendChild(btn);
    });

    wrapper.appendChild(sw);
  }

  return wrapper;
}

function attachListeners() {
  const container = document.querySelector('.parameter-box');
  const toggle    = container.querySelector('.advanced-toggle');

  toggle.addEventListener('click', () => {
    container.classList.toggle('open');
  });

  document.querySelectorAll('.slider').forEach(slider => {
    const tooltip = document.getElementById(`tooltip-${slider.id}`);
    const update = () => {
      const percent = (slider.value - slider.min) / (slider.max - slider.min);
      tooltip.textContent = slider.value;
      tooltip.style.left   = `${percent * 100}%`;
    };
    slider.addEventListener('input', update);
    window.addEventListener('resize', update);
    update();
  });

  document.querySelectorAll('.select-wrapper').forEach(wrapper => {
    wrapper.addEventListener('click', event => {
      const btn = event.target.closest('.select-option');
      if (!btn) return;
      wrapper.querySelectorAll('.select-option')
             .forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });
}
