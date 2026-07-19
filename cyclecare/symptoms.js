/**
 * symptoms.js
 * Multi-select symptom chips for the currently viewed day.
 */
const Symptoms = (() => {
  const LIST = [
    'Cramps', 'Headache', 'Bloating', 'Fatigue', 'Backache',
    'Tender breasts', 'Acne', 'Nausea', 'Cravings', 'Insomnia',
    'Spotting', 'Cold flashes',
  ];

  function render(dateKey) {
    const wrap = document.getElementById('symptom-chips');
    if (!wrap) return;
    const day = Storage.getDay(dateKey);
    wrap.innerHTML = '';
    LIST.forEach(sym => {
      const chip = document.createElement('button');
      const active = day.symptoms.includes(sym);
      chip.className = 'symptom-chip' + (active ? ' selected' : '');
      chip.textContent = sym;
      chip.addEventListener('click', () => {
        const current = new Set(Storage.getDay(dateKey).symptoms);
        if (current.has(sym)) current.delete(sym); else current.add(sym);
        Storage.updateDay(dateKey, { symptoms: [...current] });
        render(dateKey);
        if (typeof UI !== 'undefined') UI.refreshHome();
      });
      wrap.appendChild(chip);
    });
  }

  return { render, LIST };
})();
