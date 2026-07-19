/**
 * storage.js
 * Single source of truth for reading/writing app data to localStorage.
 * Schema:
 * {
 *   profile: { loggedIn, name, phone, email },
 *   settings: { cycleLength, periodLength, waterTarget, darkMode,
 *               waterReminder, periodReminder, healthyFoodReminder, checkinReminder },
 *   periods: [ { start: 'YYYY-MM-DD', end: 'YYYY-MM-DD'|null } ],
 *   days: {
 *     'YYYY-MM-DD': {
 *       water: number, mood: string|null, symptoms: string[], note: string,
 *       foods: [ { id, name, category: 'healthy'|'fastfood'|'neutral', time } ],
 *       checkinDone: boolean, checkinAt: string|null
 *     }
 *   }
 * }
 */
const Storage = (() => {
  const KEY = 'bloom.v1';

  const DEFAULTS = {
    profile: {
      loggedIn: false,
      name: '',
      phone: '',
      email: '',
    },
    settings: {
      cycleLength: 28,
      periodLength: 5,
      waterTarget: 8,
      darkMode: false,
      waterReminder: false,
      periodReminder: false,
      healthyFoodReminder: false,
      checkinReminder: false,
    },
    periods: [],
    days: {},
  };

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return structuredClone(DEFAULTS);
      const parsed = JSON.parse(raw);
      // Merge with defaults so new fields introduced later don't break old data
      return {
        profile: { ...DEFAULTS.profile, ...(parsed.profile || {}) },
        settings: { ...DEFAULTS.settings, ...(parsed.settings || {}) },
        periods: Array.isArray(parsed.periods) ? parsed.periods : [],
        days: parsed.days && typeof parsed.days === 'object' ? parsed.days : {},
      };
    } catch (e) {
      console.error('Bloom: failed to load data, starting fresh.', e);
      return structuredClone(DEFAULTS);
    }
  }

  let state = load();
  let saveTimer = null;

  function persist() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(KEY, JSON.stringify(state));
      } catch (e) {
        console.error('Bloom: failed to save data.', e);
      }
    }, 150);
  }

  function todayKey(date = new Date()) {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  }

  function getProfile() {
    return state.profile;
  }

  function updateProfile(patch) {
    state.profile = { ...state.profile, ...patch };
    persist();
    return state.profile;
  }

  function logout() {
    state.profile = { ...state.profile, loggedIn: false };
    persist();
  }

  function getSettings() {
    return state.settings;
  }

  function updateSettings(patch) {
    state.settings = { ...state.settings, ...patch };
    persist();
    return state.settings;
  }

  function getPeriods() {
    return [...state.periods].sort((a, b) => a.start.localeCompare(b.start));
  }

  function addPeriodStart(dateKey) {
    // If there's an open period, close it the day before this new start.
    const open = state.periods.find(p => !p.end);
    if (open && open.start !== dateKey) {
      open.end = dateKey;
    }
    if (!state.periods.some(p => p.start === dateKey)) {
      state.periods.push({ start: dateKey, end: null });
    }
    persist();
  }

  function setPeriodEnd(dateKey, endKey) {
    const p = state.periods.find(p => p.start === dateKey);
    if (p) p.end = endKey;
    persist();
  }

  function removePeriod(dateKey) {
    state.periods = state.periods.filter(p => p.start !== dateKey);
    persist();
  }

  function togglePeriodDay(dateKey) {
    // Used from calendar taps: adds a 1-day period entry if none covers this day, else removes.
    const covering = state.periods.find(p => {
      const end = p.end || p.start;
      return dateKey >= p.start && dateKey <= end;
    });
    if (covering) {
      removePeriod(covering.start);
    } else {
      state.periods.push({ start: dateKey, end: dateKey });
    }
    persist();
  }

  function getDay(dateKey) {
    const day = state.days[dateKey];
    return {
      water: 0, mood: null, symptoms: [], note: '',
      foods: [], checkinDone: false, checkinAt: null,
      ...(day || {}),
    };
  }

  function addFood(dateKey, food) {
    const day = getDay(dateKey);
    const foods = [...day.foods, food];
    return updateDay(dateKey, { foods });
  }

  function removeFood(dateKey, foodId) {
    const day = getDay(dateKey);
    const foods = day.foods.filter(f => f.id !== foodId);
    return updateDay(dateKey, { foods });
  }

  function completeCheckin(dateKey) {
    return updateDay(dateKey, { checkinDone: true, checkinAt: new Date().toISOString() });
  }

  function updateDay(dateKey, patch) {
    const current = getDay(dateKey);
    state.days[dateKey] = { ...current, ...patch };
    persist();
    return state.days[dateKey];
  }

  function getAllDays() {
    return state.days;
  }

  function exportJSON() {
    return JSON.stringify(state, null, 2);
  }

  function importJSON(json) {
    const parsed = JSON.parse(json);
    state = {
      profile: { ...DEFAULTS.profile, ...(parsed.profile || {}) },
      settings: { ...DEFAULTS.settings, ...(parsed.settings || {}) },
      periods: Array.isArray(parsed.periods) ? parsed.periods : [],
      days: parsed.days || {},
    };
    persist();
  }

  function clearAll() {
    // Keep the signed-in profile; only wipe tracked health data.
    const keepProfile = state.profile;
    state = { ...structuredClone(DEFAULTS), profile: keepProfile };
    persist();
  }

  return {
    todayKey,
    getProfile,
    updateProfile,
    logout,
    getSettings,
    updateSettings,
    getPeriods,
    addPeriodStart,
    setPeriodEnd,
    removePeriod,
    togglePeriodDay,
    getDay,
    updateDay,
    addFood,
    removeFood,
    completeCheckin,
    getAllDays,
    exportJSON,
    importJSON,
    clearAll,
  };
})();
