import { useState, useCallback, useMemo } from 'react';
import { useProgress } from '../context/ProgressContext';
import { isCardDue, normalizeCardStat } from '../utils/srs';
import { sampleItems } from '../utils/random';

export function useSession() {
  const [session, setSession] = useState(null);
  const [sessionResult, setSessionResult] = useState(null);
  const { progress, updateProgress } = useProgress();

  const startSession = useCallback((type, count = 10, cards = []) => {
    let sessionCards;
    let title = '';

    switch (type) {
      case 'dental':
        sessionCards = sampleItems(cards, count);
        title = '🦷 Zubní slovíčka';
        break;

      case 'review': {
        const due = cards.filter(c => {
          const stat = progress.cardStats[c.id];
          return stat && isCardDue(normalizeCardStat(c.id, stat));
        });
        sessionCards = sampleItems(due.length ? due : cards, count);
        title = 'Opakování';
        break;
      }

      case 'fresh': {
        const notLearned = cards.filter(c => !progress.cardStats[c.id]);
        sessionCards = sampleItems(notLearned.length ? notLearned : cards, count);
        title = 'Nová slovíčka';
        break;
      }

      default:
        sessionCards = sampleItems(cards, count);
        title = 'Procvičování';
    }

    setSession({
      id: `session-${Date.now()}`,
      title,
      cards: sessionCards,
    });
  }, [progress.cardStats, cards]);

  const endSession = useCallback((result) => {
    const xpGained = result.correct * 10;
    const streakBonus = result.total === result.correct ? 5 : 0;
    const isPerfect = result.correct === result.total;

    updateProgress({
      xp: progress.xp + xpGained + streakBonus,
      cardsLearned: progress.cardsLearned + result.correct,
      lessonsCompleted: progress.lessonsCompleted + 1,
      streak: progress.streak + streakBonus,
      lastStudyDate: new Date().toISOString().split('T')[0],
      perfectLessons: (progress.perfectLessons || 0) + (isPerfect ? 1 : 0),
    });

    setSessionResult(result);
    setSession(null);
  }, [progress, updateProgress]);

  const continueSession = useCallback(() => {
    setSessionResult(null);
  }, []);

  const exitSession = useCallback(() => {
    setSession(null);
    setSessionResult(null);
  }, []);

  const isActive = useMemo(() => !!session && !sessionResult, [session, sessionResult]);

  const value = {
    session,
    sessionResult,
    isActive,
    startSession,
    endSession,
    continueSession,
    exitSession,
  };

  return value;
}