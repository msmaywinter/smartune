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
    console.log("🚨 פרמטרים שהתקבלו מהשרת:", paramDefs);

    initRendering();
  });

  if (backButton) {
    const referrer = document.referrer;
    backButton.style.display = referrer.includes('suggest-expansion.html') ? 'flex' : 'none';
  }
});

function initRendering() {
  const container = document.querySelector('.parameter-box');
  const basicDefs = paramDefs.slice(0, 3);
  const advancedDefs = paramDefs.slice(3);

  container.innerHTML = '';

  basicDefs.forEach(def => container.appendChild(renderParam(def)));

  const toggle = document.createElement('div');
  toggle.classList.add('advanced-toggle');
  toggle.innerHTML = `<span>פרמטרים מתקדמים</span> <svg class="arrow-down" xmlns="http://www.w3.org/2000/svg"
              fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"
             width="24" height="24">
             <path stroke-linecap="round" stroke-linejoin="round"
             d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>`;
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

  // 🟦 עטיפת טקסט עם אייקון i
  const labelWrapper = document.createElement('div');
  labelWrapper.classList.add('param-label-with-tooltip');

  const label = document.createElement('label');
  label.htmlFor = def.key;
  label.textContent = def.label;
  labelWrapper.appendChild(label);

  // 🟦 אם יש tooltip - מוסיפים אותו
  if (def.tooltip) {
    const infoBtn = document.createElement('button');
    infoBtn.classList.add('info-button');
    infoBtn.textContent = 'i';
    infoBtn.setAttribute('title', 'להסבר על הפרמטר לחץ/י כאן');
    infoBtn.setAttribute('aria-label', 'מידע על הפרמטר');
    infoBtn.addEventListener('click', () => showPopup(def.tooltip));
    labelWrapper.appendChild(infoBtn);
      
  }
  

  wrapper.appendChild(labelWrapper);

  // 🟪 טווח
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

// רק אם יש endpoints – מוסיפים אותם
    if (def.endpoints && def.endpoints.length === 2) {
      const ends = document.createElement('div');
      ends.classList.add('endpoints');
      ends.innerHTML = `<span class="endpoint">${def.endpoints[0]}</span><span class="endpoint">${def.endpoints[1]}</span>`;
      wrapper.appendChild(ends);
    }

  // 🟨 select
  } else if (def.type === 'select') {
    const sw = document.createElement('div');
    sw.classList.add('select-wrapper');
    sw.id = def.key;

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
  const toggle = container.querySelector('.advanced-toggle');

  toggle.addEventListener('click', () => {
    container.classList.toggle('open');
  });

  document.querySelectorAll('.slider').forEach(slider => {
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

  document.querySelectorAll('.select-wrapper').forEach(wrapper => {
    wrapper.addEventListener('click', event => {
      const btn = event.target.closest('.select-option');
      if (!btn) return;
      wrapper.querySelectorAll('.select-option').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });
}

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
      const wrapper = document.getElementById(def.key);
      if (!wrapper) return;

      const buttons = wrapper.querySelectorAll('.select-option');
      buttons.forEach(btn => {
        btn.classList.remove('selected');
        if (`${btn.dataset.value}` === `${def.default}`) {
          btn.classList.add('selected');
        }
      });
    }
  });

  const resetBtn = document.getElementById('reset-default');
  resetBtn.classList.add('pulse');
  setTimeout(() => resetBtn.classList.remove('pulse'), 300);

  const resetIcon = resetBtn.querySelector('svg');
  if (resetIcon) {
    resetIcon.classList.add('rotate');
    setTimeout(() => resetIcon.classList.remove('rotate'), 400);
  }
});

backButton.addEventListener('click', () => {
  eel.cleanup_upload()().then(() => {
    window.location.href = `suggest-expansion.html?slug=${encodeURIComponent(slug)}`;
  });
});

function closestLearningRate(val) {
  const candidates = [
    1e-5, 2e-5, 3e-5, 5e-5,
    1e-4, 2e-4, 3e-4, 5e-4,
    1e-3
  ];
  let closest = candidates[0];
  let minDiff = Math.abs(val - candidates[0]);
  for (let i = 1; i < candidates.length; i++) {
    const diff = Math.abs(val - candidates[i]);
    if (diff < minDiff) {
      closest = candidates[i];
      minDiff = diff;
    }
  }
  return closest;
}

document.getElementById('save-and-continue').addEventListener('click', async () => {
  const button = document.getElementById('save-and-continue');
  const overlay = document.getElementById('loading-overlay');

  try {
    const finalDatasetPath = await eel.prepare_final_dataset(slug)();
    const trainingParams = {};

    paramDefs.forEach(def => {
      if (def.type === 'range') {
        const input = document.getElementById(def.key);
        if (!input) return;

        let realVal = def.key === 'learning_rate'
          ? closestLearningRate(realFromUiLog(Number(input.value), def.realRange.min, def.realRange.max))
          : uiToRealLinear(Number(input.value), def.realRange);

        if (['batch_size', 'num_epochs', 'gradient_accumulation_steps'].includes(def.key)) {
          realVal = Math.round(realVal);
        }

        trainingParams[def.key] = realVal;

      } else if (def.type === 'select') {
        const wrapper = document.getElementById(def.key);
        if (!wrapper) return;

        const selected = wrapper.querySelector('.select-option.selected');
        if (!selected) return;

        let value = selected.dataset.value;
        if (value === 'true') value = true;
        if (value === 'false') value = false;
        if (!isNaN(Number(value))) value = Number(value);

        trainingParams[def.key] = value;
      }
    });

    trainingParams.dataset_path = finalDatasetPath;
    trainingParams.slug = slug;

    const response = await eel.save_training_config(trainingParams)();

    if (response && response.success) {
      const configPath = encodeURIComponent(response.path);
      window.location.href = `fine-tuning.html?slug=${encodeURIComponent(slug)}&path=${configPath}`;
    } else {
      throw new Error("האימון לא התחיל כראוי");
    }

  } catch (error) {
    console.error('בעיה באימון:', error);
    button.disabled = false;
    overlay.classList.add('hidden');
  }
});

document.getElementById("download-json").addEventListener("click", () => {
  const trainingParams = {};

  paramDefs.forEach(def => {
    if (def.type === 'range') {
      const input = document.getElementById(def.key);
      if (!input) return;

      let realVal = def.key === 'learning_rate'
        ? closestLearningRate(realFromUiLog(Number(input.value), def.realRange.min, def.realRange.max))
        : uiToRealLinear(Number(input.value), def.realRange);

      if (['batch_size', 'num_epochs', 'gradient_accumulation_steps'].includes(def.key)) {
        realVal = Math.round(realVal);
      }

      trainingParams[def.key] = realVal;

    } else if (def.type === 'select') {
      const wrapper = document.getElementById(def.key);
      if (!wrapper) return;

      const selected = wrapper.querySelector('.select-option.selected');
      if (!selected) return;

      let value = selected.dataset.value;
      if (value === 'true') value = true;
      else if (value === 'false') value = false;
      else if (!isNaN(Number(value))) value = Number(value);

      trainingParams[def.key] = value;
    }
  });

  const jsonStr = JSON.stringify(trainingParams, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${slug}_training_params.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
});

function showPopup(fullText) {
  const [titleLine, ...rest] = fullText.split('\n');
  const splitIndex = rest.findIndex(line => line.trim().startsWith('אז מה מתאים?'));

  const mainText = rest.slice(0, splitIndex).join('\n').trim();
  const suggestionText = rest.slice(splitIndex + 1).join('\n').trim();

  document.getElementById('popup-title').textContent = titleLine;
  document.getElementById('popup-main-text').textContent = mainText;
  document.getElementById('popup-suggestion-text').textContent = suggestionText;

  document.getElementById('param-popup').classList.remove('hidden');
}

document.getElementById('popup-close').addEventListener('click', () => {
  document.getElementById('param-popup').classList.add('hidden');
});

fetch('components/navbar.html')
.then(res => res.text())
.then(html => {
  document.getElementById('navbar-placeholder').innerHTML = html;

  const script = document.createElement('script');
  script.src = 'scripts/navbar.js';
  script.onload = () => {
    updateProgressBar(2); // כאן תציין את האינדקס של השלב הנוכחי בעמוד הזה
  };
  document.body.appendChild(script);
});