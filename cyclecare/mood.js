/**
 * mood.js
 * Single-select mood picker for the currently viewed day.
 */
const Mood = (() => {
  const MOODS = [
    { key: 'great', emoji: '😄', label: 'Great' },
    { key: 'good', emoji: '🙂', label: 'Good' },
    { key: 'okay', emoji: '😐', label: 'Okay' },
    { key: 'low', emoji: '😔', label: 'Low' },
    { key: 'anxious', emoji: '😟', label: 'Anxious' },
    { key: 'irritable', emoji: '😤', label: 'Irritable' },
    { key: 'tired', emoji: '🥱', label: 'Tired' },
    { key: 'crampy', emoji: '😖', label: 'Crampy' },
  ];

  function render(dateKey) {
    const picker = document.getElementById('mood-picker');
    if (!picker) return;
    const day = Storage.getDay(dateKey);
    picker.innerHTML = '';
    MOODS.forEach(m => {
      const btn = document.createElement('button');
      btn.className = 'mood-btn' + (day.mood === m.key ? ' selected' : '');
      btn.innerHTML = `<span class="mood-emoji">${m.emoji}</span><span class="mood-label">${m.label}</span>`;
      btn.addEventListener('click', () => {
        const newMood = day.mood === m.key ? null : m.key;
        Storage.updateDay(dateKey, { mood: newMood });
        render(dateKey);
        if (typeof UI !== 'undefined') UI.refreshHome();
      });
      picker.appendChild(btn);
    });
  }

  function labelFor(key) {
    const m = MOODS.find(m => m.key === key);
    return m ? m.emoji : '—';
  }

  return { render, labelFor, MOODS };
})();
