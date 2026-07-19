/**
 * cycle.js
 * All the math: current cycle day, phase, predictions for next period,
 * fertile window and ovulation, plus history stats used by charts.
 */
const Cycle = (() => {
  const DAY_MS = 24 * 60 * 60 * 1000;

  function parse(dateKey) {
    const [y, m, d] = dateKey.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  function diffDays(a, b) {
    return Math.round((parse(b) - parse(a)) / DAY_MS);
  }

  function addDays(dateKey, n) {
    const d = parse(dateKey);
    d.setDate(d.getDate() + n);
    return Storage.todayKey(d);
  }

  // Most recent period start on or before `refKey` (defaults to today).
  function lastPeriodStart(refKey = Storage.todayKey()) {
    const periods = Storage.getPeriods();
    const started = periods.filter(p => p.start <= refKey);
    if (!started.length) return null;
    return started[started.length - 1].start;
  }

  function averageCycleLength() {
    const periods = Storage.getPeriods();
    if (periods.length < 2) return Storage.getSettings().cycleLength;
    const starts = periods.map(p => p.start).sort();
    const gaps = [];
    for (let i = 1; i < starts.length; i++) {
      const gap = diffDays(starts[i - 1], starts[i]);
      if (gap > 10 && gap < 90) gaps.push(gap); // filter out obvious data glitches
    }
    if (!gaps.length) return Storage.getSettings().cycleLength;
    return Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
  }

  function averagePeriodLength() {
    const periods = Storage.getPeriods().filter(p => p.end);
    if (!periods.length) return Storage.getSettings().periodLength;
    const lens = periods.map(p => diffDays(p.start, p.end) + 1).filter(n => n > 0 && n < 15);
    if (!lens.length) return Storage.getSettings().periodLength;
    return Math.round(lens.reduce((a, b) => a + b, 0) / lens.length);
  }

  function cycleLengthHistory(limit = 8) {
    const starts = Storage.getPeriods().map(p => p.start).sort();
    const out = [];
    for (let i = 1; i < starts.length; i++) {
      out.push(diffDays(starts[i - 1], starts[i]));
    }
    return out.slice(-limit);
  }

  function periodLengthHistory(limit = 8) {
    return Storage.getPeriods()
      .filter(p => p.end)
      .map(p => diffDays(p.start, p.end) + 1)
      .slice(-limit);
  }

  // Returns { cycleDay, phase, phaseLabel, daysUntilNextPeriod, nextPeriodStart, ovulationDate, fertileStart, fertileEnd }
  function getStatus(refKey = Storage.todayKey()) {
    const cycleLen = averageCycleLength();
    const periodLen = averagePeriodLength();
    const lastStart = lastPeriodStart(refKey);

    if (!lastStart) {
      return {
        cycleDay: null,
        phase: 'unknown',
        phaseLabel: 'No period logged yet',
        daysUntilNextPeriod: null,
        nextPeriodStart: null,
        ovulationDate: null,
        fertileStart: null,
        fertileEnd: null,
        cycleLength: cycleLen,
        periodLength: periodLen,
      };
    }

    let cycleDay = diffDays(lastStart, refKey) + 1;
    // If we've drifted past a full predicted cycle, roll forward virtually for display purposes.
    if (cycleDay > cycleLen * 2) cycleDay = ((cycleDay - 1) % cycleLen) + 1;

    const nextPeriodStart = addDays(lastStart, cycleLen);
    const daysUntilNextPeriod = diffDays(refKey, nextPeriodStart);

    const ovulationDate = addDays(nextPeriodStart, -14);
    const fertileStart = addDays(ovulationDate, -5);
    const fertileEnd = addDays(ovulationDate, 1);

    let phase = 'follicular';
    let phaseLabel = 'Follicular phase';
    if (cycleDay <= periodLen) {
      phase = 'menstrual';
      phaseLabel = 'Menstrual phase';
    } else if (refKey >= fertileStart && refKey <= fertileEnd) {
      phase = 'ovulation';
      phaseLabel = refKey === ovulationDate ? 'Ovulation day' : 'Fertile window';
    } else if (cycleDay > periodLen && refKey < fertileStart) {
      phase = 'follicular';
      phaseLabel = 'Follicular phase';
    } else if (refKey > fertileEnd) {
      phase = 'luteal';
      phaseLabel = 'Luteal phase';
    }

    return {
      cycleDay,
      phase,
      phaseLabel,
      daysUntilNextPeriod,
      nextPeriodStart,
      ovulationDate,
      fertileStart,
      fertileEnd,
      cycleLength: cycleLen,
      periodLength: periodLen,
    };
  }

  // Classifies an arbitrary date for calendar rendering.
  function classifyDate(dateKey) {
    const periods = Storage.getPeriods();
    const inLoggedPeriod = periods.some(p => {
      const end = p.end || p.start;
      return dateKey >= p.start && dateKey <= end;
    });
    if (inLoggedPeriod) return 'period';

    const status = getStatus(dateKey <= Storage.todayKey() ? dateKey : Storage.todayKey());
    // For future dates, compute predictions relative to that date's own status chain
    const s = getStatus();
    if (!s.nextPeriodStart) return 'none';

    if (dateKey >= s.fertileStart && dateKey <= s.fertileEnd) {
      return dateKey === s.ovulationDate ? 'ovulation' : 'fertile';
    }
    if (dateKey >= s.nextPeriodStart && dateKey < Cycle_addDaysExported(s.nextPeriodStart, s.periodLength)) {
      return 'predicted';
    }
    return 'none';
  }

  function Cycle_addDaysExported(dateKey, n) {
    return addDays(dateKey, n);
  }

  return {
    addDays,
    diffDays,
    lastPeriodStart,
    averageCycleLength,
    averagePeriodLength,
    cycleLengthHistory,
    periodLengthHistory,
    getStatus,
    classifyDate,
  };
})();
