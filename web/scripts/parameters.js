const urlParams = new URLSearchParams(window.location.search);
const slug = urlParams.get("slug");
const backButton = document.getElementById('back-button');

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

window.addEventListener('DOMContentLoaded', () => {
  const backButton = document.getElementById('back-button');
  if (backButton) {
    const referrer = document.referrer;
    if (referrer.includes('suggest-expansion.html')) {
      backButton.style.display = 'flex';
    } else {
      backButton.style.display = 'none';
    }
  }
});

document.getElementById('reset-default').addEventListener('click', () => {
  paramDefs.forEach(def => {
    if (def.type === 'range') {
      const input = document.getElementById(def.key);
      if (!input) return;

      const defaultUi = def.key === 'learning_rate'
        ? uiFromRealLog(def.realRange.default, def.realRange.min, def.realRange.max)
        : Math.round((def.realRange.default - def.realRange.min) / (def.realRange.max - def.realRange.min) * 100);

      input.value = defaultUi;

      const tooltip = document.getElementById(`tooltip-${def.key}`);
      if (tooltip) {
        tooltip.textContent = defaultUi;
        const percent = (input.value - input.min) / (input.max - input.min);
        tooltip.style.left = `${percent * 100}%`;
      }

    } else if (def.type === 'select') {
      // מוצאים את ה-wrapper של הכפתורים
      const wrappers = document.querySelectorAll('.select-wrapper');
      wrappers.forEach(wrapper => {
        const buttons = wrapper.querySelectorAll('.select-option');
        // בודקים אם הכפתורים האלה שייכים ל-def הנוכחי
        buttons.forEach(btn => {
          if (btn.closest('.parameter')?.querySelector('label')?.htmlFor === def.key) {
            // איפוס כל הכפתורים בקבוצה הזו
            buttons.forEach(opt => {
              opt.classList.remove('selected');
              if (`${opt.dataset.value}` === `${def.default}`) {
                opt.classList.add('selected');
                opt.classList.add('flash');
                setTimeout(() => {
                  opt.classList.remove('flash');
                }, 300);
              }
            });
          }
        });
      });
    }
    const resetBtn = document.getElementById('reset-default');
    resetBtn.classList.add('pulse');
    setTimeout(() => {
      resetBtn.classList.remove('pulse');
    }, 300);
    const resetIcon = resetBtn.querySelector('svg');
    if (resetIcon) {
      resetIcon.classList.add('rotate');
      setTimeout(() => {
        resetIcon.classList.remove('rotate');
      }, 400); // זמן הסיבוב צריך להיות כמו האנימציה (400ms)
    }
  });
});

backButton.addEventListener('click', () => {
    eel.cleanup_upload()().then(() => {
      window.location.href = `suggest-expansion.html?slug=${encodeURIComponent(slug)}`;
    });
});