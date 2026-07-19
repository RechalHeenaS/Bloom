/**
 * notes.js
 * Free-text note per day with a simple save action and status message.
 */
const Notes = (() => {
  function render(dateKey) {
    const textarea = document.getElementById('notes-textarea');
    const status = document.getElementById('note-status');
    if (!textarea) return;
    textarea.value = Storage.getDay(dateKey).note || '';
    if (status) status.textContent = '';
  }

  function save(dateKey) {
    const textarea = document.getElementById('notes-textarea');
    const status = document.getElementById('note-status');
    Storage.updateDay(dateKey, { note: textarea.value });
    if (status) {
      status.textContent = 'Saved';
      setTimeout(() => { if (status.textContent === 'Saved') status.textContent = ''; }, 1500);
    }
  }

  function init(getActiveDate) {
    document.getElementById('notes-save').addEventListener('click', () => save(getActiveDate()));
  }

  return { render, save, init };
})();
