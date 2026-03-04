import { motion } from 'framer-motion';
import { DailyProgressRing } from './DailyProgressRing';

export function DailyProgress({ current, goal }) {
  const percentage = Math.min((current / Math.max(goal, 1)) * 100, 100);

  return (
    <motion.div
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", bounce: 0.3 }}
      className="daily-progress-banner"
      role="status"
      aria-label={`Dnešní pokrok: ${current} z ${goal} slov`}
    >
      <DailyProgressRing current={current} goal={goal} />
      <div className="daily-progress-banner__content">
        <div className="daily-progress-banner__title">
          {current >= goal ? 'Splněno! 🎉' : 'Dnešní cíl'}
        </div>
        <div className="daily-progress-banner__subtitle">
          {current} / {goal} slov
        </div>
        <div className="daily-progress-banner__bar">
          <motion.div
            className="daily-progress-banner__bar-fill"
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ delay: 0.5, duration: 0.8, type: 'spring', bounce: 0 }}
          />
        </div>
      </div>
    </motion.div>
  );
}