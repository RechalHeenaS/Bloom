/**
 * water.js
 * Renders the water intake row of droplets for the currently viewed day
 * and handles increment/decrement/target changes.
 */
const Water = (() => {
  function render(dateKey) {
    const day = Storage.getDay(dateKey);
    const target = Storage.getSettings().waterTarget;
    const row = document.getElementById('water-row');
    const caption = document.getElementById('water-caption');
    const targetInput = document.getElementById('water-target');
    if (!row) return;

    row.innerHTML = '';
    const count = Math.max(target, day.water);
    for (let i = 0; i < count; i++) {
      const drop = document.createElement('span');
      drop.className = 'drop' + (i < day.water ? ' filled' : '');
      drop.textContent = '💧';
      drop.dataset.index = i;
      drop.addEventListener('click', () => setWater(dateKey, i + 1 === day.water ? i : i + 1));
      row.appendChild(drop);
    }
    caption.textContent = `${day.water} / ${target} glasses`;
    if (targetInput) targetInput.value = target;
  }

  function setWater(dateKey, value) {
    const v = Math.max(0, value);
    Storage.updateDay(dateKey, { water: v });
    render(dateKey);
    if (typeof UI !== 'undefined') UI.refreshHome();
  }

  function adjust(dateKey, delta) {
    const day = Storage.getDay(dateKey);
    setWater(dateKey, day.water + delta);
  }

  function setTarget(value) {
    const v = Math.min(20, Math.max(1, parseInt(value, 10) || 8));
    Storage.updateSettings({ waterTarget: v });
  }

  function init(getActiveDate) {
    document.getElementById('water-plus').addEventListener('click', () => adjust(getActiveDate(), 1));
    document.getElementById('water-minus').addEventListener('click', () => adjust(getActiveDate(), -1));
    document.getElementById('water-target').addEventListener('change', (e) => {
      setTarget(e.target.value);
      render(getActiveDate());
    });
  }

  return { render, setWater, adjust, setTarget, init };
})();
