import { motion } from 'framer-motion';
import { Play, ChevronRight } from 'lucide-react';

export default function LessonCard({
  icon,
  iconBg,
  title,
  subtitle,
  onClick,
  style = {},
  initial = { x: -20, opacity: 0 },
  animate = { x: 0, opacity: 1 },
  transition = {},
  ...props
}) {
  return (
    <motion.div
      initial={initial}
      animate={animate}
      transition={transition}
      whileTap={{ scale: 0.98 }}
      className="lesson-card"
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={title}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      style={style}
      {...props}
    >
      <motion.div
        className="lesson-card__icon"
        style={{ background: iconBg }}
        whileHover={{ scale: 1.1, rotate: 5 }}
      >
        {icon}
      </motion.div>
      <div className="lesson-card__content">
        <div className="lesson-card__title">{title}</div>
        <div className="lesson-card__meta">{subtitle}</div>
      </div>
      <motion.div
        className="lesson-card__arrow"
        whileHover={{ x: 8 }}
      >
        <ChevronRight size={18} color="var(--text-muted)" />
      </motion.div>
    </motion.div>
  );
}