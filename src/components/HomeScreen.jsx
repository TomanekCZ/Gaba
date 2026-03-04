/**
 * Home Screen Component
 * Displays daily progress, stats, and quick access to learning sessions
 */

import { motion } from 'framer-motion';
import { Play, ChevronRight } from 'lucide-react';
import { useProgress } from '../context/ProgressContext';
import { useCards } from '../hooks/useCards';
import DailyProgress from '../components/DailyProgress';
import StatsRow from '../components/StatsRow';
import LessonCard from '../components/LessonCard';
import { vibrate } from '../utils/vibrate';
import { isCardDue, normalizeCardStat } from '../utils/srs';
import { useState, useEffect } from 'react';

export default function HomeScreen({ onStartSession }) {
  const { progress } = useProgress();
  const { cards } = useCards();
  const [dueCount, setDueCount] = useState(0);
  const [newCount, setNewCount] = useState(0);

  // Calculate due and new card counts
  useEffect(() => {
    if (!cards.length) return;

    let due = 0;
    let newWords = 0;

    cards.forEach(card => {
      const stat = progress.cardStats[card.id];
      if (!stat) {
        newWords++;
      } else if (isCardDue(normalizeCardStat(card.id, stat))) {
        due++;
      }
    });

    setDueCount(due);
    setNewCount(newWords);
  }, [cards, progress.cardStats]);

  // Calculate today's learned words
  const todayLearned = Object.values(progress.cardStats || {}).filter(s =>
    s.lastReviewedAt && s.lastReviewedAt.startsWith(new Date().toISOString().split('T')[0])
  ).length;

  const handleSessionStart = (type, count) => {
    vibrate(10);
    onStartSession(type, count);
  };

  return (
    <div className="main-content" id="main-content" style={{ paddingBottom: 'calc(72px + 20px)' }}>
      {/* Daily Progress */}
      <DailyProgress current={todayLearned} goal={progress.dailyGoal} />

      {/* Stats */}
      <StatsRow
        stats={[
          { label: 'XP', value: progress.xp || 0 },
          { label: 'Slov', value: progress.cardsLearned || 0 },
          { label: 'Série', value: progress.streak || 0 },
        ]}
      />

      {/* Daily Lessons */}
      <div className="section">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="section__header"
        >
          <h2 className="section__title">Dnešní lekce</h2>
        </motion.div>

        <LessonCard
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
          icon={dueCount > 0 ? '🔄' : '✨'}
          iconBg={dueCount > 0 ? 'var(--warning-ghost)' : 'var(--primary-ghost)'}
          title={dueCount > 0 ? `${dueCount} slov k opakování` : 'Procvič nová slovíčka'}
          subtitle={dueCount > 0 ? 'Potřebuješ zopakovat' : `${newCount} nových slov k naučení`}
          onClick={() => handleSessionStart(dueCount > 0 ? 'review' : 'fresh')}
        />

        <LessonCard
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          icon="⚡"
          iconBg="var(--secondary-ghost)"
          title="10 nových slov"
          subtitle="Rychlé procvičení"
          onClick={() => handleSessionStart('fresh', 10)}
        />

        <LessonCard
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
          icon="🦷"
          iconBg="linear-gradient(135deg, #32D74B 0%, #0A84FF 100%)"
          title="Zubní slovíčka"
          subtitle="Anglické názvosloví"
          onClick={() => handleSessionStart('dental', 20)}
          style={{
            background: 'linear-gradient(135deg, var(--bg-elevated) 0%, var(--primary-ghost) 100%)',
            border: '2px solid var(--primary)',
          }}
        />
      </div>
    </div>
  );
}