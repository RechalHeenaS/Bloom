/**
 * checkin.js
 * The evening check-in: a short recap of mood, water, and food, capped
 * off with "Complete check-in" which locks in today's recommendations.
 * Uses the same mood set as Mood module so answers stay consistent.
 */
const Checkin = (() => {
  function render(dateKey) {
    const wrap = document.getElementById('checkin-mood-picker');
    const statusEl = document.getElementById('checkin-status');
    const btn = document.getElementById('checkin-complete-btn');
    if (!wrap) return;

    const day = Storage.getDay(dateKey);
    wrap.innerHTML = '';
    Mood.MOODS.forEach(m => {
      const b = document.createElement('button');
      b.className = 'mood-btn small' + (day.mood === m.key ? ' selected' : '');
      b.innerHTML = `<span class="mood-emoji">${m.emoji}</span><span class="mood-label">${m.label}</span>`;
      b.addEventListener('click', () => {
        Storage.updateDay(dateKey, { mood: day.mood === m.key ? null : m.key });
        render(dateKey);
        if (typeof UI !== 'undefined') UI.refreshHome();
      });
      wrap.appendChild(b);
    });

    const recap = document.getElementById('checkin-recap');
    if (recap) {
      recap.innerHTML = `
        <div class="modal-row"><span>Water</span><strong>${day.water} glasses</strong></div>
        <div class="modal-row"><span>Meals logged</span><strong>${day.foods.length}</strong></div>
        <div class="modal-row"><span>Fast food</span><strong>${day.foods.filter(f => f.category === 'fastfood').length}</strong></div>
      `;
    }

    if (day.checkinDone) {
      statusEl.textContent = `Checked in at ${new Date(day.checkinAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
      btn.textContent = 'Update check-in';
    } else {
      statusEl.textContent = '';
      btn.textContent = 'Complete check-in';
    }
  }

  function complete(dateKey) {
    Storage.completeCheckin(dateKey);
    render(dateKey);
    if (typeof UI !== 'undefined') {
      UI.refreshHome();
      UI.showToast('Evening check-in saved');
    }
  }

  function init(getActiveDate) {
    document.getElementById('checkin-complete-btn').addEventListener('click', () => complete(getActiveDate()));
  }

  return { render, init, complete };
})();
