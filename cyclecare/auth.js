/**
 * auth.js
 * A local-only "login": collects name, phone, and email so reminders and
 * greetings can be personalized. There is no server and no password —
 * Bloom has no backend, so this cannot verify the phone/email or send
 * real SMS/emails. It only gates the app shell behind a simple form and
 * remembers the profile in localStorage via Storage.
 */
const Auth = (() => {
  function isValidEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }
  function isValidPhone(v) {
    return /^[0-9+\-\s()]{7,15}$/.test(v);
  }

  function showLogin(prefill) {
    const screen = document.getElementById('login-screen');
    const nameInput = document.getElementById('login-name');
    const phoneInput = document.getElementById('login-phone');
    const emailInput = document.getElementById('login-email');
    const error = document.getElementById('login-error');
    error.textContent = '';
    if (prefill) {
      nameInput.value = prefill.name || '';
      phoneInput.value = prefill.phone || '';
      emailInput.value = prefill.email || '';
    }
    screen.classList.add('open');
    document.getElementById('app').setAttribute('inert', '');
  }

  function hideLogin() {
    document.getElementById('login-screen').classList.remove('open');
    document.getElementById('app').removeAttribute('inert');
  }

  function handleSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('login-name').value.trim();
    const phone = document.getElementById('login-phone').value.trim();
    const email = document.getElementById('login-email').value.trim();
    const error = document.getElementById('login-error');

    if (!name) { error.textContent = 'Please enter your name.'; return; }
    if (!isValidPhone(phone)) { error.textContent = 'Please enter a valid phone number.'; return; }
    if (!isValidEmail(email)) { error.textContent = 'Please enter a valid email address.'; return; }

    Storage.updateProfile({ name, phone, email, loggedIn: true });
    hideLogin();
    if (typeof onLoginComplete === 'function') onLoginComplete();
  }

  let onLoginComplete = null;

  function init(callback) {
    onLoginComplete = callback;
    document.getElementById('login-form').addEventListener('submit', handleSubmit);

    const profile = Storage.getProfile();
    if (profile.loggedIn && profile.name) {
      hideLogin();
      callback();
    } else {
      showLogin(profile);
    }
  }

  function logout() {
    Storage.logout();
    const profile = Storage.getProfile();
    showLogin(profile);
  }

  function editProfile() {
    showLogin(Storage.getProfile());
  }

  return { init, logout, editProfile };
})();
