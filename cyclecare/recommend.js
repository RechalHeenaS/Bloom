/**
 * recommend.js
 * A small rule-based recommendation engine — no external AI calls, just
 * straightforward logic over what's been logged for the day. Produces:
 *   - generateDailyTips(dateKey): a list of routine suggestions
 *   - compensationFor(foodName): a healthy-food + exercise suggestion to
 *     balance out a specific fast-food item
 *   - dailySummary(dateKey): a short human-readable recap for check-in
 */
const Recommend = (() => {
  // Specific compensation advice for common items; anything not listed
  // falls back to GENERIC.
  const COMPENSATION_MAP = {
    burger: { food: 'A big plate of leafy salad with grilled chicken or paneer, plus a glass of buttermilk.', exercise: '30-minute brisk walk or 20-minute cycling.' },
    pizza: { food: 'Load your next plate with steamed vegetables and a bowl of fruit.', exercise: '30-minute brisk walk plus 15 minutes of core exercises.' },
    fries: { food: 'Swap your next snack for roasted chana or a handful of nuts and fruit.', exercise: '20-minute walk after your next meal.' },
    'fried chicken': { food: 'Balance it with a light dinner: dal, salad, and steamed vegetables.', exercise: '30-minute walk or jog.' },
    soda: { food: 'Replace your next drink with coconut water or lemon water, no added sugar.', exercise: '15-minute walk.' },
    'ice cream': { food: 'Have fruit for your next dessert craving, and extra water today.', exercise: '20-minute walk or a short dance session.' },
    donut: { food: 'Choose oats or idli for your next meal to balance it out.', exercise: '20-minute brisk walk.' },
    samosa: { food: 'Pair your next meal with extra vegetables and skip fried snacks today.', exercise: '20-minute walk after lunch or dinner.' },
    'vada pav': { food: 'Go for curd rice or a vegetable-heavy thali next meal.', exercise: '25-minute walk.' },
    biryani: { food: 'Add a side salad or raita and go light on the next meal.', exercise: '30-minute walk.' },
    chaat: { food: 'Have a fruit bowl and extra water for the rest of the day.', exercise: '20-minute walk.' },
    'noodles': { food: 'Add a side of steamed vegetables or a salad to round out the meal.', exercise: '20-minute walk.' },
  };

  const GENERIC = {
    food: 'Add extra vegetables, fruit, and a full glass of water to your next meal.',
    exercise: '20–30 minutes of brisk walking or light cardio to help balance today out.',
  };

  function compensationFor(rawName) {
    const name = rawName.toLowerCase();
    const key = Object.keys(COMPENSATION_MAP).find(k => name.includes(k));
    return key ? COMPENSATION_MAP[key] : GENERIC;
  }

  function generateDailyTips(dateKey) {
    const day = Storage.getDay(dateKey);
    const settings = Storage.getSettings();
    const tips = [];

    const fastfoodCount = day.foods.filter(f => f.category === 'fastfood').length;
    const healthyCount = day.foods.filter(f => f.category === 'healthy').length;

    if (day.water < Math.ceil(settings.waterTarget * 0.5)) {
      tips.push({ type: 'water', text: `You're at ${day.water} of ${settings.waterTarget} glasses today — try to catch up with a glass now.` });
    } else if (day.water >= settings.waterTarget) {
      tips.push({ type: 'water', text: 'Water target reached today — nice work staying hydrated.' });
    }

    if (fastfoodCount > 0) {
      tips.push({ type: 'fastfood', text: `You logged ${fastfoodCount} fast-food item${fastfoodCount > 1 ? 's' : ''} today. See the compensation suggestions below to help balance it out.` });
    }

    if (healthyCount >= 2) {
      tips.push({ type: 'healthy', text: `Good pattern — ${healthyCount} healthy items logged today. Keep it up.` });
    } else if (healthyCount === 0 && day.foods.length > 0) {
      tips.push({ type: 'healthy', text: 'Try adding one healthy item to your next meal — fruit, salad, or a bowl of curd all count.' });
    }

    if (day.mood && ['low', 'anxious', 'tired', 'irritable'].includes(day.mood)) {
      tips.push({ type: 'mood', text: 'Feeling low or tired today — a short walk, some water, and an early night can help.' });
    }

    if (!tips.length) {
      tips.push({ type: 'general', text: 'Log a meal, your water, and your mood to get personalized tips for today.' });
    }

    return tips;
  }

  function dailySummary(dateKey) {
    const day = Storage.getDay(dateKey);
    const fastfood = day.foods.filter(f => f.category === 'fastfood');
    const healthy = day.foods.filter(f => f.category === 'healthy');
    return {
      water: day.water,
      mood: day.mood,
      fastfoodCount: fastfood.length,
      healthyCount: healthy.length,
      foods: day.foods,
    };
  }

  return { compensationFor, generateDailyTips, dailySummary, COMPENSATION_MAP, GENERIC };
})();
