/**
 * calendar.js
 * Renders a month grid with period/fertile/ovulation/predicted markers,
 * and opens a detail modal when a day is tapped.
 */
const CalendarView = (() => {
  let viewYear, viewMonth; // viewMonth is 0-indexed

  function init() {
    const now = new Date();
    viewYear = now.getFullYear();
    viewMonth = now.getMonth();

    document.getElementById('cal-prev').addEventListener('click', () => shiftMonth(-1));
    document.getElementById('cal-next').addEventListener('click', () => shiftMonth(1));

    const weekdays = document.getElementById('cal-weekdays');
    ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach(d => {
      const el = document.createElement('span');
      el.textContent = d;
      weekdays.appendChild(el);
    });

    render();
  }

  function shiftMonth(delta) {
    viewMonth += delta;
    if (viewMonth < 0) { viewMonth = 11; viewYear--; }
    if (viewMonth > 11) { viewMonth = 0; viewYear++; }
    render();
  }

  function keyFor(y, m, d) {
    const mm = String(m + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  }

  function render() {
    const label = document.getElementById('cal-month-label');
    const grid = document.getElementById('cal-grid');
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    label.textContent = `${monthNames[viewMonth]} ${viewYear}`;

    grid.innerHTML = '';
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const todayKey = Storage.todayKey();

    for (let i = 0; i < firstDay; i++) {
      const blank = document.createElement('div');
      blank.className = 'cal-cell empty';
      grid.appendChild(blank);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = keyFor(viewYear, viewMonth, d);
      const cls = Cycle.classifyDate(dateKey);
      const cell = document.createElement('button');
      cell.className = 'cal-cell' + (cls !== 'none' ? ' ' + cls : '') + (dateKey === todayKey ? ' today' : '');
      cell.innerHTML = `<span class="cal-num">${d}</span>`;
      const day = Storage.getDay(dateKey);
      if (day.mood) {
        const m = document.createElement('span');
        m.className = 'cal-mood';
        m.textContent = Mood.labelFor(day.mood);
        cell.appendChild(m);
      }
      cell.addEventListener('click', () => openDayModal(dateKey));
      grid.appendChild(cell);
    }
  }

  function openDayModal(dateKey) {
    const backdrop = document.getElementById('modal-backdrop');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');
    const day = Storage.getDay(dateKey);
    const cls = Cycle.classifyDate(dateKey);
    const d = new Date(dateKey + 'T00:00:00');
    title.textContent = d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

    const tagLabels = {
      period: 'Logged period day',
      fertile: 'Fertile window',
      ovulation: 'Predicted ovulation',
      predicted: 'Predicted period',
      none: '',
    };

    body.innerHTML = `
      ${tagLabels[cls] ? `<p class="modal-tag tag-${cls}">${tagLabels[cls]}</p>` : ''}
      <div class="modal-row">
        <span>Mood</span><strong>${day.mood ? Mood.labelFor(day.mood) : '—'}</strong>
      </div>
      <div class="modal-row">
        <span>Water</span><strong>${day.water} glasses</strong>
      </div>
      <div class="modal-row">
        <span>Symptoms</span><strong>${day.symptoms.length ? day.symptoms.join(', ') : '—'}</strong>
      </div>
      ${day.note ? `<div class="modal-note">${escapeHTML(day.note)}</div>` : ''}
      <button class="pill-btn wide" id="modal-toggle-period">
        ${cls === 'period' ? 'Remove period day' : 'Mark as period day'}
      </button>
      <button class="pill-btn wide ghost" id="modal-edit-day">Edit this day in Log</button>
    `;

    document.getElementById('modal-toggle-period').addEventListener('click', () => {
      Storage.togglePeriodDay(dateKey);
      render();
      openDayModal(dateKey);
      if (typeof UI !== 'undefined') UI.refreshHome();
    });
    document.getElementById('modal-edit-day').addEventListener('click', () => {
      closeModal();
      if (typeof UI !== 'undefined') UI.openLogForDate(dateKey);
    });

    backdrop.classList.add('open');
  }

  function closeModal() {
    document.getElementById('modal-backdrop').classList.remove('open');
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return { init, render, closeModal };
})();
