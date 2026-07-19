/**
 * script.js
 * App bootstrap. Runs once the DOM is ready: initializes theme, calendar,
 * UI wiring, and notifications, then registers the service worker for
 * offline/PWA support.
 */
let appBooted = false;

function bootApp() {
  if (appBooted) return; // Auth.init can call back more than once across edits
  appBooted = true;
  Theme.init();
  CalendarView.init();
  UI.init();
  Notify.init();
}

document.addEventListener('DOMContentLoaded', () => {
  Auth.init(bootApp);

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('service-worker.js').catch(err => {
        console.warn('Bloom: service worker registration failed', err);
      });
    });
  }
});
