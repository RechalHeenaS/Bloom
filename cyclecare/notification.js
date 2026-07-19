/**
 * notification.js
 * Requests permission and fires local notifications for water and period
 * reminders. Since this is a static, backend-free app, reminders are
 * checked periodically while the app is open (and once on load) rather
 * than delivered via push while fully closed.
 */
const Notify = (() => {
  const WATER_HOUR = 15; // 3pm local nudge if under half of target
  const CHECK_INTERVAL_MS = 30 * 60 * 1000; // recheck every 30 min while open

  function supported() {
    return 'Notification' in window;
  }

  function permission() {
    return supported() ? Notification.permission : 'unsupported';
  }

  async function requestPermission() {
    if (!supported()) return 'unsupported';
    if (Notification.permission === 'default') {
      return await Notification.requestPermission();
    }
    return Notification.permission;
  }

  function fire(title, body) {
    if (!supported() || Notification.permission !== 'granted') return;
    try {
      new Notification(title, { body, icon: 'icon.svg', tag: title });
    } catch (e) {
      console.warn('Bloom: notification failed', e);
    }
  }

  function lastFiredKey(kind) {
    return `bloom.notif.${kind}.${Storage.todayKey()}`;
  }

  function alreadyFiredToday(kind) {
    return localStorage.getItem(lastFiredKey(kind)) === '1';
  }

  function markFired(kind) {
    localStorage.setItem(lastFiredKey(kind), '1');
  }

  function checkWaterReminder() {
    const settings = Storage.getSettings();
    if (!settings.waterReminder) return;
    const hour = new Date().getHours();
    if (hour < WATER_HOUR) return;
    if (alreadyFiredToday('water')) return;
    const day = Storage.getDay(Storage.todayKey());
    if (day.water < Math.ceil(settings.waterTarget / 2)) {
      fire('Time for some water 💧', `You're at ${day.water} of ${settings.waterTarget} glasses today.`);
      markFired('water');
    }
  }

  function checkPeriodReminder() {
    const settings = Storage.getSettings();
    if (!settings.periodReminder) return;
    const status = Cycle.getStatus();
    if (status.daysUntilNextPeriod === 2 && !alreadyFiredToday('period')) {
      fire('Period expected soon 🩸', `Bloom predicts your period may start in 2 days.`);
      markFired('period');
    }
  }

  const HEALTHY_HOUR = 12; // midday nudge to add something healthy to lunch
  function checkHealthyFoodReminder() {
    const settings = Storage.getSettings();
    if (!settings.healthyFoodReminder) return;
    const hour = new Date().getHours();
    if (hour < HEALTHY_HOUR) return;
    if (alreadyFiredToday('healthyfood')) return;
    const day = Storage.getDay(Storage.todayKey());
    const healthyCount = day.foods.filter(f => f.category === 'healthy').length;
    const name = Storage.getProfile().name;
    if (healthyCount === 0) {
      fire('Add something healthy today 🥗', `${name ? name + ', try' : 'Try'} adding a fruit, salad, or curd to your next meal.`);
      markFired('healthyfood');
    }
  }

  const CHECKIN_HOUR = 19; // 7pm evening check-in nudge
  function checkCheckinReminder() {
    const settings = Storage.getSettings();
    if (!settings.checkinReminder) return;
    const hour = new Date().getHours();
    if (hour < CHECKIN_HOUR) return;
    if (alreadyFiredToday('checkin')) return;
    const day = Storage.getDay(Storage.todayKey());
    if (!day.checkinDone) {
      fire('Evening check-in 🌙', 'How was your mood, meals, and water today? Take a minute to check in.');
      markFired('checkin');
    }
  }

  function runChecks() {
    checkWaterReminder();
    checkPeriodReminder();
    checkHealthyFoodReminder();
    checkCheckinReminder();
  }

  function updateHint() {
    const hint = document.getElementById('notification-hint');
    if (!hint) return;
    if (!supported()) {
      hint.textContent = 'Notifications are not supported in this browser.';
    } else if (Notification.permission === 'denied') {
      hint.textContent = 'Notifications are blocked in your browser settings.';
    } else if (Notification.permission === 'default') {
      hint.textContent = 'You will be asked to allow notifications when you enable a reminder.';
    } else {
      hint.textContent = 'Reminders check in while the app is open.';
    }
  }

  function init() {
    updateHint();
    runChecks();
    setInterval(runChecks, CHECK_INTERVAL_MS);

    const waterCheck = document.getElementById('settings-water-reminder');
    const periodCheck = document.getElementById('settings-period-reminder');

    waterCheck.addEventListener('change', async (e) => {
      if (e.target.checked) {
        const perm = await requestPermission();
        if (perm !== 'granted') { e.target.checked = false; updateHint(); return; }
      }
      Storage.updateSettings({ waterReminder: e.target.checked });
      updateHint();
    });

    periodCheck.addEventListener('change', async (e) => {
      if (e.target.checked) {
        const perm = await requestPermission();
        if (perm !== 'granted') { e.target.checked = false; updateHint(); return; }
      }
      Storage.updateSettings({ periodReminder: e.target.checked });
      updateHint();
    });

    const healthyCheck = document.getElementById('settings-healthy-reminder');
    const checkinCheck = document.getElementById('settings-checkin-reminder');

    healthyCheck.addEventListener('change', async (e) => {
      if (e.target.checked) {
        const perm = await requestPermission();
        if (perm !== 'granted') { e.target.checked = false; updateHint(); return; }
      }
      Storage.updateSettings({ healthyFoodReminder: e.target.checked });
      updateHint();
    });

    checkinCheck.addEventListener('change', async (e) => {
      if (e.target.checked) {
        const perm = await requestPermission();
        if (perm !== 'granted') { e.target.checked = false; updateHint(); return; }
      }
      Storage.updateSettings({ checkinReminder: e.target.checked });
      updateHint();
    });
  }

  return { init, requestPermission, permission, runChecks };
})();
