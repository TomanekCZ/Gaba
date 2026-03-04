import { motion } from 'framer-motion';
import { useProgress } from '../context/ProgressContext';

export default function StatsRow({ stats }) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.1 }}
      className="stats-row"
      role="group"
      aria-label="Statistiky"
    >
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15 + i * 0.1, type: "spring", bounce: 0.5 }}
          whileHover={{ scale: 1.05, y: -4 }}
          className="stat-item"
        >
          <div className="stat-item__value">{stat.value}</div>
          <div className="stat-item__label">{stat.label}</div>
        </motion.div>
      ))}
    </motion.div>
  );
}