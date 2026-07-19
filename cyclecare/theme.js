/**
 * theme.js
 * Applies and persists light/dark theme.
 */
const Theme = (() => {
  function apply(isDark) {
    document.body.classList.toggle('dark', isDark);
    const icon = document.getElementById('theme-icon');
    const meta = document.querySelector('meta[name="theme-color"]');
    if (icon) {
      icon.innerHTML = isDark
        ? '<path fill="currentColor" d="M6.76 4.84 4.96 3.05 3.55 4.46l1.79 1.8zM1 13h3v-2H1zm10-9h2V1h-2zm8.24.46-1.4-1.41-1.8 1.79 1.41 1.42zM20 13h3v-2h-3zm-2.24 6.84 1.79 1.8 1.41-1.41-1.79-1.8zM12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12zm-1 17h2v-3h-2zM3.55 19.54l1.41 1.41 1.79-1.8-1.4-1.41z"/>'
        : '<path fill="currentColor" d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9z"/>';
    }
    if (meta) meta.setAttribute('content', isDark ? '#1E1522' : '#3D2B4F');
  }

  function toggle() {
    const settings = Storage.getSettings();
    const next = !settings.darkMode;
    Storage.updateSettings({ darkMode: next });
    apply(next);
    const check = document.getElementById('settings-dark-mode');
    if (check) check.checked = next;
    return next;
  }

  function init() {
    const settings = Storage.getSettings();
    apply(!!settings.darkMode);
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.addEventListener('click', toggle);
  }

  return { init, toggle, apply };
})();
