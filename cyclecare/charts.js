/**
 * charts.js
 * Minimal dependency-free canvas charts: bars for cycle/period length and
 * water, a dot-line for mood. Reads CSS variables so it matches the theme.
 */
const Charts = (() => {
  function cssVar(name) {
    return getComputedStyle(document.body).getPropertyValue(name).trim();
  }

  function clear(ctx, canvas) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function drawBars(canvasId, values, { labelFn, unit = '', color } = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    clear(ctx, canvas);
    if (!values.length) {
      ctx.fillStyle = cssVar('--text-muted') || '#9a8ba0';
      ctx.font = '13px "Public Sans", sans-serif';
      ctx.fillText('Not enough data yet', 12, canvas.height / 2);
      return;
    }
    const padding = 24;
    const w = canvas.width - padding * 2;
    const h = canvas.height - padding * 1.5;
    const max = Math.max(...values, 1);
    const barGap = 10;
    const barWidth = (w - barGap * (values.length - 1)) / values.length;
    const barColor = color || cssVar('--accent') || '#C2597A';

    values.forEach((v, i) => {
      const barH = (v / max) * h;
      const x = padding + i * (barWidth + barGap);
      const y = canvas.height - padding - barH;
      ctx.fillStyle = barColor;
      roundRect(ctx, x, y, barWidth, barH, 6);
      ctx.fill();
      ctx.fillStyle = cssVar('--text-muted') || '#9a8ba0';
      ctx.font = '11px "IBM Plex Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(String(v), x + barWidth / 2, y - 6 < 10 ? y + 14 : y - 6);
      ctx.fillText(labelFn ? labelFn(i) : String(i + 1), x + barWidth / 2, canvas.height - 6);
    });
    ctx.textAlign = 'left';
  }

  function roundRect(ctx, x, y, w, h, r) {
    if (h < 1) h = 1;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawMoodLine(canvasId, entries) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    clear(ctx, canvas);
    const moodOrder = ['low', 'anxious', 'irritable', 'tired', 'crampy', 'okay', 'good', 'great'];
    const scored = entries.map(e => e.mood ? moodOrder.indexOf(e.mood) : null);
    if (!scored.some(v => v !== null)) {
      ctx.fillStyle = cssVar('--text-muted') || '#9a8ba0';
      ctx.font = '13px "Public Sans", sans-serif';
      ctx.fillText('No mood logs yet', 12, canvas.height / 2);
      return;
    }
    const padding = 20;
    const w = canvas.width - padding * 2;
    const h = canvas.height - padding * 2;
    const stepX = w / (entries.length - 1 || 1);
    const maxScore = moodOrder.length - 1;

    ctx.strokeStyle = cssVar('--accent-soft') || '#e7c3cf';
    ctx.lineWidth = 2;
    ctx.beginPath();
    let started = false;
    scored.forEach((s, i) => {
      if (s === null) return;
      const x = padding + i * stepX;
      const y = padding + h - (s / maxScore) * h;
      if (!started) { ctx.moveTo(x, y); started = true; } else { ctx.lineTo(x, y); }
    });
    ctx.stroke();

    ctx.fillStyle = cssVar('--accent') || '#C2597A';
    scored.forEach((s, i) => {
      if (s === null) return;
      const x = padding + i * stepX;
      const y = padding + h - (s / maxScore) * h;
      ctx.beginPath();
      ctx.arc(x, y, 3.5, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function renderAll() {
    drawBars('chart-cycle', Cycle.cycleLengthHistory(8), {
      labelFn: (i) => `C${i + 1}`,
    });
    drawBars('chart-period', Cycle.periodLengthHistory(8), {
      labelFn: (i) => `P${i + 1}`,
      color: cssVar('--sage') || '#8FA98C',
    });

    // Water: last 7 days including today
    const waterVals = [];
    const waterLabels = [];
    for (let i = 6; i >= 0; i--) {
      const key = Cycle.addDays(Storage.todayKey(), -i);
      waterVals.push(Storage.getDay(key).water);
      const d = new Date(key + 'T00:00:00');
      waterLabels.push(d.toLocaleDateString(undefined, { weekday: 'narrow' }));
    }
    drawBars('chart-water', waterVals, { labelFn: (i) => waterLabels[i], color: '#7FB3D5' });

    // Mood: last 14 days
    const moodEntries = [];
    for (let i = 13; i >= 0; i--) {
      const key = Cycle.addDays(Storage.todayKey(), -i);
      moodEntries.push(Storage.getDay(key));
    }
    drawMoodLine('chart-mood', moodEntries);

    const avgC = document.getElementById('stat-avg-cycle');
    const avgP = document.getElementById('stat-avg-period');
    if (avgC) avgC.textContent = `Average cycle length: ${Cycle.averageCycleLength()} days`;
    if (avgP) avgP.textContent = `Average period length: ${Cycle.averagePeriodLength()} days`;
  }

  return { renderAll };
})();
