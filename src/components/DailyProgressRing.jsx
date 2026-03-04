import { motion } from 'framer-motion';

export function DailyProgressRing({ current, goal }) {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(current / Math.max(goal, 1), 1);
  const offset = circumference - (percentage * circumference);
  const isComplete = percentage >= 1;

  return (
    <div className="progress-ring" style={{ width: '64px', height: '64px' }}>
      <svg width="64" height="64" className="progress-ring__circle">
        <circle className="progress-ring__bg" cx="32" cy="32" r={radius} />
        <motion.circle
          className="progress-ring__fill"
          cx="32" cy="32" r={radius}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, delay: 0.3, type: 'spring', bounce: 0 }}
          style={{ stroke: isComplete ? 'var(--primary)' : 'var(--secondary)' }}
        />
      </svg>
      <div className="progress-ring__text">
        <span style={{ fontSize: isComplete ? '18px' : '16px' }}>
          {isComplete ? '🎉' : current}
        </span>
      </div>
    </div>
  );
}