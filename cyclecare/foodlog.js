/**
 * foodlog.js
 * Logs meals for the active day, auto-categorizes them as healthy /
 * fast-food / neutral by keyword match, and — when a fast-food item is
 * logged — immediately shows a compensation suggestion (healthy food +
 * exercise) via Recommend.compensationFor.
 */
const FoodLog = (() => {
  const HEALTHY_PRESETS = ['Salad', 'Fruit bowl', 'Dal & rice', 'Idli / dosa', 'Curd rice', 'Boiled eggs', 'Grilled chicken', 'Smoothie', 'Sprouts', 'Vegetable soup'];
  const FASTFOOD_PRESETS = ['Burger', 'Pizza', 'French fries', 'Fried chicken', 'Soda', 'Samosa', 'Vada pav', 'Ice cream', 'Chaat', 'Noodles'];

  const HEALTHY_KEYWORDS = ['salad', 'fruit', 'vegetable', 'veggie', 'dal', 'sprout', 'oats', 'yogurt', 'curd', 'nuts', 'grilled', 'boiled egg', 'soup', 'brown rice', 'quinoa', 'smoothie', 'idli', 'dosa', 'poha', 'upma'];
  const FASTFOOD_KEYWORDS = ['burger', 'pizza', 'fries', 'fried chicken', 'soda', 'cola', 'donut', 'doughnut', 'hot dog', 'nugget', 'shawarma', 'samosa', 'bonda', 'bajji', 'vada pav', 'chips', 'ice cream', 'milkshake', 'deep fried', 'chaat', 'pani puri', 'noodles', 'biryani'];

  function categorize(name) {
    const n = name.toLowerCase();
    if (FASTFOOD_KEYWORDS.some(k => n.includes(k))) return 'fastfood';
    if (HEALTHY_KEYWORDS.some(k => n.includes(k))) return 'healthy';
    return 'neutral';
  }

  function timeNow() {
    return new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }

  function addFood(dateKey, name, categoryOverride) {
    const trimmed = name.trim();
    if (!trimmed) return;
    const category = categoryOverride || categorize(trimmed);
    const food = { id: 'f' + Date.now() + Math.random().toString(36).slice(2, 6), name: trimmed, category, time: timeNow() };
    Storage.addFood(dateKey, food);
    render(dateKey);
    if (typeof UI !== 'undefined') { UI.refreshHome(); }
    if (category === 'fastfood') {
      showCompensation(food);
      if (typeof UI !== 'undefined') UI.showToast(`Logged "${trimmed}" — see the compensation tip below`);
    } else if (typeof UI !== 'undefined') {
      UI.showToast(`Logged "${trimmed}"`);
    }
    return food;
  }

  function removeFood(dateKey, foodId) {
    Storage.removeFood(dateKey, foodId);
    render(dateKey);
    if (typeof UI !== 'undefined') UI.refreshHome();
  }

  function showCompensation(food) {
    const wrap = document.getElementById('compensation-feed');
    if (!wrap) return;
    const tip = Recommend.compensationFor(food.name);
    const card = document.createElement('div');
    card.className = 'compensation-card';
    card.innerHTML = `
      <p class="comp-title">To help balance out <strong>${escapeHTML(food.name)}</strong></p>
      <p class="comp-line">🥗 <strong>Eat:</strong> ${escapeHTML(tip.food)}</p>
      <p class="comp-line">🏃 <strong>Move:</strong> ${escapeHTML(tip.exercise)}</p>
    `;
    wrap.prepend(card);
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function renderPresets() {
    const healthyWrap = document.getElementById('food-presets-healthy');
    const fastWrap = document.getElementById('food-presets-fastfood');
    if (healthyWrap && !healthyWrap.childElementCount) {
      HEALTHY_PRESETS.forEach(name => {
        const btn = document.createElement('button');
        btn.className = 'food-chip healthy';
        btn.textContent = name;
        btn.addEventListener('click', () => addFood(currentDate, name, 'healthy'));
        healthyWrap.appendChild(btn);
      });
    }
    if (fastWrap && !fastWrap.childElementCount) {
      FASTFOOD_PRESETS.forEach(name => {
        const btn = document.createElement('button');
        btn.className = 'food-chip fastfood';
        btn.textContent = name;
        btn.addEventListener('click', () => addFood(currentDate, name, 'fastfood'));
        fastWrap.appendChild(btn);
      });
    }
  }

  let currentDate = Storage.todayKey();

  function render(dateKey) {
    currentDate = dateKey;
    renderPresets();
    const list = document.getElementById('food-list');
    if (!list) return;
    const day = Storage.getDay(dateKey);
    if (!day.foods.length) {
      list.innerHTML = '<p class="hint">Nothing logged yet today.</p>';
    } else {
      list.innerHTML = '';
      day.foods.slice().reverse().forEach(f => {
        const row = document.createElement('div');
        row.className = `food-row ${f.category}`;
        row.innerHTML = `
          <span class="food-name">${escapeHTML(f.name)}</span>
          <span class="food-time">${f.time}</span>
          <button class="food-remove" aria-label="Remove ${escapeHTML(f.name)}">✕</button>
        `;
        row.querySelector('.food-remove').addEventListener('click', () => removeFood(dateKey, f.id));
        list.appendChild(row);
      });
    }

    // Rebuild the compensation feed from today's already-logged fast food
    // so it survives switching tabs/days.
    const feed = document.getElementById('compensation-feed');
    if (feed) {
      feed.innerHTML = '';
      day.foods.filter(f => f.category === 'fastfood').forEach(showCompensation);
    }
  }

  function init(getActiveDate) {
    const input = document.getElementById('food-custom-input');
    const addBtn = document.getElementById('food-custom-add');
    addBtn.addEventListener('click', () => {
      if (input.value.trim()) {
        addFood(getActiveDate(), input.value);
        input.value = '';
      }
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') addBtn.click();
    });
  }

  return { render, init, addFood, removeFood, categorize };
})();
