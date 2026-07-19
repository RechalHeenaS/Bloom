/**
 * ui.js
 * Ties together navigation between views, the home cycle dial, settings
 * bindings, data export/import, and the currently-active log date.
 */
const UI = (() => {
  let activeLogDate = Storage.todayKey();

  function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove('show'), 2200);
  }

  // ---------- Navigation ----------
  function switchView(name) {
    document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.dataset.view === name));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.nav === name));
    if (name === 'stats') Charts.renderAll();
    if (name === 'calendar') CalendarView.render();
    if (name === 'log') renderLog();
    if (name === 'home') refreshHome();
    window.scrollTo({ top: 0 });
  }

  function initNav() {
    document.getElementById('bottom-nav').addEventListener('click', (e) => {
      const btn = e.target.closest('.nav-btn');
      if (btn) switchView(btn.dataset.nav);
    });
  }

  function openLogForDate(dateKey) {
    activeLogDate = dateKey;
    switchView('log');
  }

  // ---------- Home dial ----------
  const PHASE_COLORS = {
    menstrual: '#C2597A',
    follicular: '#E4A96B',
    ovulation: '#8FA98C',
    luteal: '#8C7BAE',
    unknown: '#B9A6C0',
  };

  function drawDial(status) {
    const svg = document.getElementById('cycle-dial');
    const size = 240, cx = 120, cy = 120, r = 100;
    const cycleLen = status.cycleLength || 28;
    const progress = status.cycleDay ? Math.min(status.cycleDay / cycleLen, 1) : 0;
    const circumference = 2 * Math.PI * r;
    const dash = circumference * progress;
    const color = PHASE_COLORS[status.phase] || PHASE_COLORS.unknown;

    svg.innerHTML = `
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--dial-track)" stroke-width="14"/>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="14"
        stroke-linecap="round" stroke-dasharray="${dash} ${circumference}"
        transform="rotate(-90 ${cx} ${cy})" class="dial-progress"/>
    `;
    document.documentElement.style.setProperty('--phase-color', color);
  }

  function renderForecast(status) {
    const grid = document.getElementById('forecast-grid');
    if (!status.nextPeriodStart) {
      grid.innerHTML = `<p class="hint">Log your first period to unlock predictions.</p>`;
      return;
    }
    const fmt = (key) => new Date(key + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const items = [
      { label: 'Next period', value: fmt(status.nextPeriodStart), sub: status.daysUntilNextPeriod >= 0 ? `in ${status.daysUntilNextPeriod} days` : 'may be starting' },
      { label: 'Fertile window', value: `${fmt(status.fertileStart)} – ${fmt(status.fertileEnd)}` },
      { label: 'Ovulation', value: fmt(status.ovulationDate) },
      { label: 'Cycle length', value: `${status.cycleLength} days avg` },
    ];
    grid.innerHTML = items.map(i => `
      <div class="forecast-item">
        <span class="forecast-label">${i.label}</span>
        <span class="forecast-value">${i.value}</span>
        ${i.sub ? `<span class="forecast-sub">${i.sub}</span>` : ''}
      </div>
    `).join('');
  }

  function renderTodaySummary() {
    const today = Storage.todayKey();
    const day = Storage.getDay(today);
    const wrap = document.getElementById('today-summary');
    wrap.innerHTML = `
      <div class="today-chip">💧 ${day.water} glasses</div>
      <div class="today-chip">${day.mood ? Mood.labelFor(day.mood) + ' logged' : 'No mood yet'}</div>
      <div class="today-chip">${day.symptoms.length ? day.symptoms.length + ' symptoms' : 'No symptoms'}</div>
    `;
  }

  function renderTips() {
    const list = document.getElementById('tip-list');
    if (!list) return;
    const tips = Recommend.generateDailyTips(Storage.todayKey());
    list.innerHTML = tips.map(t => `<li class="tip-item tip-${t.type}">${t.text}</li>`).join('');
  }

  function renderCheckinBanner() {
    const title = document.getElementById('checkin-banner-title');
    const sub = document.getElementById('checkin-banner-sub');
    const btn = document.getElementById('checkin-banner-btn');
    if (!title) return;
    const day = Storage.getDay(Storage.todayKey());
    if (day.checkinDone) {
      title.textContent = "You've checked in today";
      sub.textContent = 'You can update it any time from the Log tab.';
      btn.textContent = 'View check-in';
    } else {
      const hour = new Date().getHours();
      title.textContent = hour >= 17 ? 'How was your day?' : "Plan for tonight's check-in";
      sub.textContent = 'Log your mood, meals, and water, then complete your evening check-in.';
      btn.textContent = 'Check in';
    }
  }

  function refreshHome() {
    const status = Cycle.getStatus();
    document.getElementById('dial-day').textContent = status.cycleDay ? `Day ${status.cycleDay}` : 'No data';
    document.getElementById('dial-phase').textContent = status.phaseLabel;
    document.getElementById('dial-sub').textContent = status.cycleLength
      ? `${status.cycleLength}-day average cycle`
      : '—';
    drawDial(status);
    renderForecast(status);
    renderTodaySummary();
    renderTips();
    renderCheckinBanner();
  }

  // ---------- Log view ----------
  function renderLog() {
    const label = document.getElementById('log-date-label');
    const today = Storage.todayKey();
    const d = new Date(activeLogDate + 'T00:00:00');
    label.textContent = activeLogDate === today
      ? 'Today'
      : d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

    Water.render(activeLogDate);
    Mood.render(activeLogDate);
    Symptoms.render(activeLogDate);
    Notes.render(activeLogDate);
    FoodLog.render(activeLogDate);
    Checkin.render(activeLogDate);
  }

  function initLogNav() {
    document.getElementById('log-prev-day').addEventListener('click', () => {
      activeLogDate = Cycle.addDays(activeLogDate, -1);
      renderLog();
    });
    document.getElementById('log-next-day').addEventListener('click', () => {
      const today = Storage.todayKey();
      if (activeLogDate >= today) return;
      activeLogDate = Cycle.addDays(activeLogDate, 1);
      renderLog();
    });
  }

  // ---------- Quick actions ----------
  function initQuickActions() {
    document.getElementById('btn-log-period').addEventListener('click', () => {
      Storage.addPeriodStart(Storage.todayKey());
      showToast('Period logged for today');
      refreshHome();
    });
    document.getElementById('btn-quick-water').addEventListener('click', () => {
      Water.adjust(Storage.todayKey(), 1);
      showToast('Added a glass of water');
    });
    document.getElementById('btn-quick-mood').addEventListener('click', () => openLogForDate(Storage.todayKey()));

    document.getElementById('checkin-banner-btn').addEventListener('click', () => {
      openLogForDate(Storage.todayKey());
      setTimeout(() => {
        const card = document.getElementById('checkin-complete-btn');
        if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 60);
    });
  }

  // ---------- Settings ----------
  function renderAccount() {
    const p = Storage.getProfile();
    document.getElementById('account-name').textContent = p.name || '—';
    document.getElementById('account-phone').textContent = p.phone || '—';
    document.getElementById('account-email').textContent = p.email || '—';
  }

  function initAccount() {
    renderAccount();
    document.getElementById('account-edit').addEventListener('click', () => Auth.editProfile());
    document.getElementById('account-logout').addEventListener('click', () => {
      if (confirm('Log out of Bloom on this device?')) Auth.logout();
    });
  }

  function renderSettings() {
    const s = Storage.getSettings();
    document.getElementById('settings-cycle-length').value = s.cycleLength;
    document.getElementById('settings-period-length').value = s.periodLength;
    document.getElementById('settings-water-reminder').checked = s.waterReminder;
    document.getElementById('settings-period-reminder').checked = s.periodReminder;
    document.getElementById('settings-healthy-reminder').checked = s.healthyFoodReminder;
    document.getElementById('settings-checkin-reminder').checked = s.checkinReminder;
    document.getElementById('settings-dark-mode').checked = s.darkMode;
    renderAccount();
  }

  function initSettings() {
    renderSettings();

    document.getElementById('settings-cycle-length').addEventListener('change', (e) => {
      Storage.updateSettings({ cycleLength: parseInt(e.target.value, 10) || 28 });
      refreshHome();
    });
    document.getElementById('settings-period-length').addEventListener('change', (e) => {
      Storage.updateSettings({ periodLength: parseInt(e.target.value, 10) || 5 });
      refreshHome();
    });
    document.getElementById('settings-dark-mode').addEventListener('change', (e) => {
      Storage.updateSettings({ darkMode: e.target.checked });
      Theme.apply(e.target.checked);
    });

    document.getElementById('export-data').addEventListener('click', () => {
      const blob = new Blob([Storage.exportJSON()], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bloom-export-${Storage.todayKey()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Data exported');
    });

    const fileInput = document.getElementById('import-data-file');
    document.getElementById('import-data-btn').addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
      const file = fileInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          Storage.importJSON(reader.result);
          renderSettings();
          refreshHome();
          showToast('Data imported');
        } catch (e) {
          showToast('That file could not be read');
        }
      };
      reader.readAsText(file);
      fileInput.value = '';
    });

    document.getElementById('clear-data').addEventListener('click', () => {
      if (confirm('Erase all Bloom data on this device? This cannot be undone.')) {
        Storage.clearAll();
        renderSettings();
        refreshHome();
        showToast('All data erased');
      }
    });
  }

  // ---------- Modal ----------
  function initModal() {
    document.getElementById('modal-close').addEventListener('click', CalendarView.closeModal);
    document.getElementById('modal-backdrop').addEventListener('click', (e) => {
      if (e.target.id === 'modal-backdrop') CalendarView.closeModal();
    });
  }

  function init() {
    initNav();
    initLogNav();
    initQuickActions();
    initSettings();
    initModal();
    Water.init(() => activeLogDate);
    Notes.init(() => activeLogDate);
    FoodLog.init(() => activeLogDate);
    Checkin.init(() => activeLogDate);
    initAccount();
    refreshHome();
  }

  return { init, switchView, refreshHome, openLogForDate, showToast };
})();
