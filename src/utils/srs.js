const MIN_EASE = 1.3;

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000).toISOString();
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next.toISOString();
}

export function normalizeCardStat(cardId, stat = {}) {
  const counts = stat.counts || {};

  return {
    cardId,
    reviewCount: stat.reviewCount || 0,
    lapseCount: stat.lapseCount || 0,
    state: stat.state || 'new',
    intervalDays: stat.intervalDays || 0,
    ease: typeof stat.ease === 'number' ? stat.ease : 2.3,
    dueAt: stat.dueAt || null,
    lastRating: stat.lastRating || null,
    lastReviewedAt: stat.lastReviewedAt || null,
    lessonId: stat.lessonId || null,
    lessonTitle: stat.lessonTitle || null,
    en: stat.en || '',
    cz: stat.cz || '',
    counts: {
      again: counts.again || 0,
      hard: counts.hard || 0,
      good: counts.good || 0,
      easy: counts.easy || 0,
    },
  };
}

export function scheduleCardReview(previousStat, result, reviewedAtIso) {
  const reviewedAt = new Date(reviewedAtIso);
  const previous = normalizeCardStat(previousStat?.cardId || 'unknown', previousStat);
  const nextEase =
    result === 'again'
      ? Math.max(MIN_EASE, previous.ease - 0.2)
      : result === 'hard'
        ? Math.max(MIN_EASE, previous.ease - 0.12)
        : result === 'easy'
          ? previous.ease + 0.05
          : previous.ease + 0.01;

  let nextState = previous.state;
  let nextIntervalDays = previous.intervalDays;
  let nextDueAt = previous.dueAt;
  let lapseCount = previous.lapseCount;

  if (result === 'again') {
    nextState = 'learning';
    nextIntervalDays = 0;
    nextDueAt = addMinutes(reviewedAt, 10);
    lapseCount += 1;
  } else if (result === 'hard') {
    nextState = previous.reviewCount < 2 ? 'learning' : 'review';
    nextIntervalDays = previous.intervalDays > 0 ? Math.max(1, Math.round(previous.intervalDays * 1.2)) : 1;
    nextDueAt = addDays(reviewedAt, nextIntervalDays);
  } else if (result === 'good') {
    nextState = 'review';
    nextIntervalDays =
      previous.intervalDays > 0
        ? Math.max(1, Math.round(previous.intervalDays * Math.max(1.45, previous.ease)))
        : previous.reviewCount === 0
          ? 1
          : 2;
    nextDueAt = addDays(reviewedAt, nextIntervalDays);
  } else {
    nextState = 'review';
    nextIntervalDays =
      previous.intervalDays > 0
        ? Math.max(3, Math.round(previous.intervalDays * Math.max(1.8, previous.ease * 1.35)))
        : 3;
    nextDueAt = addDays(reviewedAt, nextIntervalDays);
  }

  return {
    ...previous,
    state: nextState,
    intervalDays: nextIntervalDays,
    ease: Number(nextEase.toFixed(2)),
    dueAt: nextDueAt,
    lastRating: result,
    lastReviewedAt: reviewedAtIso,
    reviewCount: previous.reviewCount + 1,
    lapseCount,
    counts: {
      ...previous.counts,
      [result]: (previous.counts[result] || 0) + 1,
    },
  };
}

export function isCardDue(stat, referenceDate = new Date()) {
  if (!stat?.dueAt) {
    return true;
  }

  return new Date(stat.dueAt).getTime() <= referenceDate.getTime();
}

export function getDuePriority(stat, referenceDate = new Date()) {
  const normalized = normalizeCardStat(stat?.cardId || 'unknown', stat);
  const dueAt = normalized.dueAt ? new Date(normalized.dueAt).getTime() : 0;
  const lateByDays = dueAt ? Math.max(0, Math.round((referenceDate.getTime() - dueAt) / 86400000)) : 2;
  const ratingPressure =
    normalized.lastRating === 'again'
      ? 40
      : normalized.lastRating === 'hard'
        ? 22
        : normalized.lastRating === 'good'
          ? 8
          : 4;

  return lateByDays * 8 + normalized.lapseCount * 6 + ratingPressure;
}

export function formatRelativeDue(dueAtIso) {
  if (!dueAtIso) {
    return 'dnes';
  }

  const dayDelta = Math.round((new Date(dueAtIso).getTime() - Date.now()) / 86400000);

  if (dayDelta <= 0) {
    return 'dnes';
  }

  if (dayDelta === 1) {
    return 'zítra';
  }

  return `za ${dayDelta} dní`;
}
