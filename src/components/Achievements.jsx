import { motion } from 'framer-motion';
import { Trophy, Star, Flame, Target, BookOpen, Zap, Award, Medal } from 'lucide-react';

const ACHIEVEMENTS = [
  {
    id: 'first_steps',
    title: 'První krůčky',
    description: 'Dokonči první lekci',
    icon: Star,
    condition: (stats) => stats.lessonsCompleted >= 1,
    xpReward: 50,
    color: '#32D74B',
  },
  {
    id: 'week_warrior',
    title: 'Týdenní válečník',
    description: '7denní streak',
    icon: Flame,
    condition: (stats) => stats.streak >= 7,
    xpReward: 100,
    color: '#FF9F0A',
  },
  {
    id: 'month_master',
    title: 'Měsíční mistr',
    description: '30denní streak',
    icon: Flame,
    condition: (stats) => stats.streak >= 30,
    xpReward: 500,
    color: '#FF453A',
  },
  {
    id: 'vocab_hunter',
    title: 'Lovec slovíček',
    description: 'Nauč se 100 slovíček',
    icon: BookOpen,
    condition: (stats) => stats.cardsLearned >= 100,
    xpReward: 200,
    color: '#0A84FF',
  },
  {
    id: 'vocab_legend',
    title: 'Legenda slovíček',
    description: 'Nauč se 500 slovíček',
    icon: Award,
    condition: (stats) => stats.cardsLearned >= 500,
    xpReward: 1000,
    color: '#BF5AF2',
  },
  {
    id: 'xp_collector',
    title: 'Sběratel XP',
    description: 'Získej 1000 XP',
    icon: Zap,
    condition: (stats) => stats.xp >= 1000,
    xpReward: 150,
    color: '#FFD60A',
  },
  {
    id: 'perfect_score',
    title: 'Perfektní skóre',
    description: '100% v lekci',
    icon: Trophy,
    condition: (stats) => stats.perfectLessons >= 1,
    xpReward: 75,
    color: '#32D74B',
  },
  {
    id: 'dedicated',
    title: 'Oddaný student',
    description: 'Dokonči 50 lekcí',
    icon: Medal,
    condition: (stats) => stats.lessonsCompleted >= 50,
    xpReward: 300,
    color: '#0A84FF',
  },
  {
    id: 'goal_crusher',
    title: 'Drtil cílů',
    description: 'Splň denní cíl 10x',
    icon: Target,
    condition: (stats) => stats.goalsCompleted >= 10,
    xpReward: 150,
    color: '#FF2A85',
  },
];

function AchievementCard({ achievement, unlocked, onClaim }) {
  const Icon = achievement.icon;
  const canClaim = !unlocked && achievement.condition({});

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.02 }}
      className={`achievement-card ${unlocked ? 'unlocked' : 'locked'}`}
      style={{
        background: unlocked 
          ? `linear-gradient(135deg, ${achievement.color}20 0%, ${achievement.color}10 100%)`
          : 'var(--bg-tertiary)',
        border: unlocked ? `2px solid ${achievement.color}` : '2px solid var(--border)',
        opacity: unlocked ? 1 : 0.6,
      }}
    >
      <div
        className="achievement-card__icon"
        style={{
          background: unlocked ? achievement.color : 'var(--bg-quaternary)',
          boxShadow: unlocked ? `0 8px 24px ${achievement.color}60` : 'none',
        }}
      >
        <Icon size={24} color={unlocked ? '#000' : 'var(--text-tertiary)'} />
      </div>
      <div className="achievement-card__content">
        <div className="achievement-card__title">{achievement.title}</div>
        <div className="achievement-card__description">{achievement.description}</div>
        <div className="achievement-card__xp">+{achievement.xp} XP</div>
      </div>
      {unlocked && (
        <div className="achievement-card__badge">
          <Trophy size={16} color={achievement.color} />
        </div>
      )}
    </motion.div>
  );
}

export function AchievementsScreen({ progress, onClaimAchievement }) {
  const unlockedIds = progress.achievements || [];

  const unlockedCount = ACHIEVEMENTS.filter(a => unlockedIds.includes(a.id)).length;
  const progressPercent = Math.round((unlockedCount / ACHIEVEMENTS.length) * 100);

  return (
    <div className="main-content" id="main-content">
      <div
        className="vocabulary-hero"
        style={{
          background: 'linear-gradient(135deg, #BF5AF2 0%, #FF2A85 100%)',
          boxShadow: '0 20px 56px var(--accent-glow)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <div className="vocabulary-hero__value">{unlockedCount}</div>
          <div style={{ fontSize: '20px', fontWeight: '600', opacity: 0.7 }}>/ {ACHIEVEMENTS.length}</div>
        </div>
        <div className="vocabulary-hero__label">Odemykatelných odznaků ({progressPercent}%)</div>
        <div style={{ height: '6px', background: 'rgba(255,255,255,0.2)', borderRadius: '3px', marginTop: '12px', overflow: 'hidden' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ delay: 0.3, duration: 0.8 }}
            style={{ height: '100%', background: 'rgba(255,255,255,0.9)', borderRadius: '3px' }}
          />
        </div>
      </div>

      <div className="section">
        <div className="section__header">
          <h2 className="section__title">Všechny odznaky</h2>
        </div>

        <div style={{ display: 'grid', gap: '12px' }}>
          {ACHIEVEMENTS.map((achievement, i) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <AchievementCard
                achievement={achievement}
                unlocked={unlockedIds.includes(achievement.id)}
                onClaim={() => onClaimAchievement(achievement.id)}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function checkAchievements(progress) {
  const newAchievements = [];
  const unlockedIds = progress.achievements || [];

  ACHIEVEMENTS.forEach(achievement => {
    if (!unlockedIds.includes(achievement.id) && achievement.condition(progress)) {
      newAchievements.push(achievement);
    }
  });

  return newAchievements;
}

export function getAchievementById(id) {
  return ACHIEVEMENTS.find(a => a.id === id);
}

export default ACHIEVEMENTS;
