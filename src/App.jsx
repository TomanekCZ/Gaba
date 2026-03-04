import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  Home, BookOpen, User, Play,
  Flame, Zap, CheckCircle, ChevronRight,
  Volume2, RefreshCcw, X, ArrowRight, Star, Trophy, Search,
  Sun, Moon, Monitor, Award
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTTS } from './hooks/useTTS';
import { sampleItems } from './utils/random';
import { isCardDue, normalizeCardStat, scheduleCardReview } from './utils/srs';
import Confetti from './components/Confetti';
import { checkAchievements, getAchievementById, AchievementsScreen } from './components/Achievements';
import { formatPhonetic } from './utils/phonetic';

const STORAGE_KEY = 'gaba-progress-v11';
const THEME_KEY = 'gaba-theme';

const DEFAULT_PROGRESS = {
  xp: 0,
  streak: 0,
  lastStudyDate: null,
  lessonsCompleted: 0,
  cardsLearned: 0,
  dailyGoal: 15,
  cardStats: {},
};

const MOTIVATIONAL_MESSAGES = {
  perfect: ['🔥 Perfektní!', '⭐ Ohromující!', '🏆 Mistrovská práce!'],
  great: ['👏 Skvěle!', '✨ Výborně!', '💪 Paráda!'],
  good: ['👍 Dobrá práce!', '😊 Pokračuj takhle!', '🙂 Zvládáš to!'],
  bad: ['💪 Zítra to bude lepší!', '🌟 Každý den se zlepšuješ!', '⭐ Zkus to znovu!'],
};

function vibrate(pattern) {
  if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
    window.navigator.vibrate(pattern);
  }
}

function loadProgress() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_PROGRESS;
    return { ...DEFAULT_PROGRESS, ...JSON.parse(stored) };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

function saveProgress(progress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function loadTheme() {
  try {
    return localStorage.getItem(THEME_KEY) || 'system';
  } catch {
    return 'system';
  }
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);

  // Update meta theme-color for mobile browsers
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      meta.setAttribute('content', '#1C1C1E');
    } else {
      meta.setAttribute('content', '#FFFFFF');
    }
  }
}

function normalizeCard(card, index) {
  return {
    id: card.id || `card-${index}`,
    en: card.en || '',
    cz: card.cz || '',
    meanings: Array.isArray(card.meanings) ? card.meanings : [],
    frequencyTag: card.frequencyTag || 'EN-5000',
  };
}

const THEME_ICONS = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

const THEME_CYCLE = ['light', 'dark', 'system'];

function ThemeToggle({ theme, onToggle }) {
  const Icon = THEME_ICONS[theme] || Monitor;
  const labels = { light: 'Světlý režim', dark: 'Tmavý režim', system: 'Systémový režim' };

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.05 }}
      className="theme-toggle"
      onClick={onToggle}
      aria-label={labels[theme] || 'Přepnout motiv'}
      title={labels[theme]}
      initial={{ rotate: -90, opacity: 0 }}
      animate={{ rotate: 0, opacity: 1 }}
      transition={{ type: "spring", bounce: 0.4 }}
    >
      <Icon size={20} />
    </motion.button>
  );
}

function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(15);

  const steps = [
    {
      emoji: '👋',
      title: 'Vítej v Gaba!',
      subtitle: 'Naučíš se anglicky zábavně a efektivně.',
      content: (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", bounce: 0.6, delay: 0.2 }}
            style={{ fontSize: '96px', marginBottom: '16px' }}
          >
            🎯
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '24px' }}
          >
            {['✨', '🚀', '💡'].map((item, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                style={{ fontSize: '32px' }}
              >
                {item}
              </motion.span>
            ))}
          </motion.div>
        </div>
      ),
    },
    {
      emoji: '🎯',
      title: 'Kolik slov denně?',
      subtitle: 'Můžeš to kdykoli změnit.',
      content: (
        <div className="option-grid" role="radiogroup" aria-label="Denní cíl">
          {[10, 15, 20, 30].map((n, i) => (
            <motion.button
              key={n}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileTap={{ scale: 0.92 }}
              whileHover={{ scale: 1.02, y: -4 }}
              className={`option-card ${dailyGoal === n ? 'is-selected' : ''}`}
              onClick={() => {
                vibrate(10);
                setDailyGoal(n);
              }}
              role="radio"
              aria-checked={dailyGoal === n}
              aria-label={`${n} slov denně`}
            >
              <div className="option-card__label">{n}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>slov</div>
            </motion.button>
          ))}
        </div>
      ),
    },
    {
      emoji: '💪',
      title: 'Jdeme na to!',
      subtitle: 'Každý den trochu, a za měsíc uvidíš výsledky.',
      content: (
        <div style={{ textAlign: 'center' }}>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
            style={{
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
              padding: '40px 32px',
              borderRadius: '28px',
              marginBottom: '16px',
              boxShadow: '0 20px 60px var(--primary-glow)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.6, delay: 0.4 }}
              style={{ fontSize: '64px', marginBottom: '12px' }}
            >
              🔥
            </motion.div>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              style={{ fontWeight: '800', fontSize: '32px', color: 'white', marginBottom: '4px' }}
            >
              {dailyGoal} slov
            </motion.div>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              style={{ fontWeight: '600', color: 'rgba(255,255,255,0.9)', fontSize: '15px' }}
            >
              každý den
            </motion.div>
          </motion.div>
        </div>
      ),
    },
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div className="onboarding" role="dialog" aria-label="Průvodce aplikací">
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -30 }}
        transition={{ type: "spring", bounce: 0.3 }}
        className="onboarding__step"
      >
        <motion.div
          key={`emoji-${step}`}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.5, delay: 0.1 }}
          className="onboarding__illustration"
          aria-hidden="true"
        >
          {current.emoji}
        </motion.div>
        <motion.h1
          key={`title-${step}`}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="onboarding__title"
        >
          {current.title}
        </motion.h1>
        <motion.p
          key={`subtitle-${step}`}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="onboarding__subtitle"
        >
          {current.subtitle}
        </motion.p>
        {current.content}
      </motion.div>

      <div className="onboarding__actions">
        {step > 0 && (
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            whileTap={{ scale: 0.96 }}
            className="btn btn--secondary btn--block"
            onClick={() => {
              vibrate(10);
              setStep(step - 1);
            }}
          >
            Zpět
          </motion.button>
        )}
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          whileTap={{ scale: 0.96 }}
          whileHover={{ scale: 1.02 }}
          className="btn btn--primary btn--block btn--lg"
          onClick={() => {
            vibrate(15);
            isLast ? onComplete(dailyGoal) : setStep(step + 1);
          }}
        >
          {isLast ? 'Začít učit!' : 'Pokračovat'}
          {isLast && <motion.span style={{ marginLeft: '8px' }}>→</motion.span>}
        </motion.button>
      </div>

      <motion.div
        className="onboarding__dots"
        aria-label={`Krok ${step + 1} z ${steps.length}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {steps.map((_, i) => (
          <motion.div
            key={i}
            layout
            className={`onboarding__dot ${i === step ? 'onboarding__dot--active' : 'onboarding__dot--inactive'}`}
            aria-current={i === step ? 'step' : undefined}
          />
        ))}
      </motion.div>
    </div>
  );
}

function SessionComplete({ result, onContinue, onClose }) {
  const [showConfetti, setShowConfetti] = useState(false);
  const percentage = Math.round((result.correct / result.total) * 100);

  let message, emoji, bgColor;
  if (percentage === 100) {
    message = MOTIVATIONAL_MESSAGES.perfect[Math.floor(Math.random() * 3)];
    emoji = '🏆';
    bgColor = '#32D74B';
  } else if (percentage >= 70) {
    message = MOTIVATIONAL_MESSAGES.great[Math.floor(Math.random() * 3)];
    emoji = '⭐';
    bgColor = '#0A84FF';
  } else if (percentage >= 40) {
    message = MOTIVATIONAL_MESSAGES.good[Math.floor(Math.random() * 3)];
    emoji = '👍';
    bgColor = '#FF9F0A';
  } else {
    message = MOTIVATIONAL_MESSAGES.bad[Math.floor(Math.random() * 3)];
    emoji = '💪';
    bgColor = '#FF453A';
  }

  useEffect(() => {
    if (percentage === 100) {
      vibrate([40, 60, 100, 40, 40]);
      setShowConfetti(true);
    } else if (percentage >= 70) {
      vibrate([30, 50, 30]);
    } else {
      vibrate([20, 20]);
    }
  }, [percentage]);

  const xpEarned = result.correct * 10;
  const streakBonus = result.total === result.correct ? 5 : 0;

  return (
    <>
      {showConfetti && <Confetti type="burst" onComplete={() => setShowConfetti(false)} />}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="session-complete"
        role="status"
        aria-live="polite"
        aria-label="Výsledky procvičování"
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", bounce: 0.6, delay: 0.1 }}
          className="session-complete__emoji"
          aria-hidden="true"
        >
          {emoji}
        </motion.div>
        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="session-complete__title"
        >
          {message}
        </motion.h2>

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="session-complete__stats"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, type: "spring" }}
            className="session-complete__stat"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring", bounce: 0.5 }}
              className="session-complete__stat-value"
              style={{ color: bgColor }}
            >
              {result.correct}/{result.total}
            </motion.div>
            <div className="session-complete__stat-label">SPRÁVNĚ</div>
          </motion.div>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.45, type: "spring" }}
            className="session-complete__stat"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.55, type: "spring", bounce: 0.5 }}
              className="session-complete__stat-value"
              style={{ color: '#BF5AF2' }}
            >
              +{xpEarned + streakBonus}
            </motion.div>
            <div className="session-complete__stat-label">XP</div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: '100%', opacity: 1 }}
          transition={{ delay: 0.6 }}
          style={{ maxWidth: '340px', width: '100%' }}
        >
          <div className="session-complete__progress-bar" role="progressbar" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100} aria-label={`${percentage}% správně`}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ delay: 0.8, duration: 1, type: "spring", bounce: 0 }}
              style={{
                height: '100%',
                background: `linear-gradient(90deg, ${bgColor}, var(--primary))`,
                borderRadius: 'inherit',
                boxShadow: '0 0 20px var(--primary-glow)'
              }}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          style={{ marginTop: 'auto' }}
        >
          <motion.button
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
            className="btn btn--primary btn--block btn--lg"
            onClick={() => {
              vibrate(15);
              onContinue();
            }}
            style={{ maxWidth: '320px', marginTop: '24px' }}
          >
            Pokračovat
            <motion.span
              initial={{ x: -5 }}
              animate={{ x: 0 }}
              transition={{ delay: 1, repeat: Infinity, repeatType: "reverse", duration: 0.6 }}
            >
              →
            </motion.span>
          </motion.button>
        </motion.div>
      </motion.div>
    </>
  );
}

function QuizScreen({ session, onComplete, onClose, onExit }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [result, setResult] = useState({ correct: 0, total: session.cards.length });
  const { speak, speaking, stop } = useTTS();
  const touchStartX = useRef(0);

  const currentCard = session.cards[currentIndex];
  const progress = ((currentIndex) / session.cards.length) * 100;

  // Swipe gestures for better mobile navigation
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    // Swipe left - show answer if not shown
    if (diff > 50 && !showAnswer) {
      vibrate(15);
      setShowAnswer(true);
    }
    // Swipe right - exit quiz
    else if (diff < -50) {
      vibrate(10);
      stop();
      onExit();
    }
  };

  // Auto-play EN pronunciation when new card appears - disabled for better UX
  // Users can manually tap to play
  const handlePlayAudio = () => {
    vibrate(10);
    speak(currentCard.en, 'en');
  };

  const handleReveal = () => {
    vibrate(15);
    setShowAnswer(true);
  };

  const handleAnswer = (wasCorrect) => {
    vibrate(wasCorrect ? [20, 30, 20] : [40]);
    stop();

    setResult(r => ({
      ...r,
      correct: r.correct + (wasCorrect ? 1 : 0)
    }));

    setTimeout(() => {
      if (currentIndex < session.cards.length - 1) {
        setCurrentIndex(i => i + 1);
        setShowAnswer(false);
      } else {
        onComplete({
          correct: result.correct + (wasCorrect ? 1 : 0),
          total: session.cards.length
        });
      }
    }, 400);
  };

  if (!currentCard) return null;

  const phonetic = formatPhonetic(currentCard.en);

  return (
    <div
      className="quiz-screen"
      role="region"
      aria-label="Procvičování slovíček"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="quiz-header">
        <motion.button
          whileTap={{ scale: 0.9 }}
          className="btn btn--ghost"
          onClick={() => { vibrate(10); stop(); onExit(); }}
          aria-label="Zavřít procvičování"
        >
          <X size={24} />
        </motion.button>
        <div className="quiz-progress" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} aria-label="Postup procvičování">
          <motion.div
            className="quiz-progress__fill"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", bounce: 0 }}
          />
        </div>
        <motion.div
          key={currentIndex}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{ fontWeight: '800', minWidth: '40px', textAlign: 'right', fontSize: '15px', color: 'var(--text-secondary)' }}
          aria-label={`Karta ${currentIndex + 1} z ${session.cards.length}`}
        >
          {currentIndex + 1}/{session.cards.length}
        </motion.div>
      </div>

      <motion.div
        key={currentIndex}
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -30 }}
        transition={{ type: "spring", bounce: 0.3 }}
        className="quiz-content"
      >
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
          <motion.div
            key={`word-${currentIndex}`}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", bounce: 0.4, delay: 0.1 }}
            style={{ textAlign: 'center' }}
          >
            <div className="quiz-word">{currentCard.en}</div>

            {/* Phonetic pronunciation - always visible */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{
                fontFamily: 'monospace',
                fontSize: '16px',
                color: 'var(--primary)',
                fontWeight: 600,
                marginTop: '12px',
                padding: '6px 12px',
                background: 'var(--primary-ghost)',
                borderRadius: '8px',
                display: 'inline-block',
              }}
            >
              {phonetic}
            </motion.div>

            <AnimatePresence mode="wait">
              {showAnswer && (
                <motion.div
                  key="answer"
                  initial={{ opacity: 0, y: -20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", bounce: 0.4 }}
                  className="quiz-answer"
                  style={{
                    color: 'var(--primary)',
                    fontSize: '28px',
                    fontWeight: '800',
                    margin: '24px 0'
                  }}
                  aria-live="assertive"
                >
                  {currentCard.cz}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Swipe hint */}
            {!showAnswer && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 0.5, y: 0 }}
                transition={{ delay: 1, duration: 0.5 }}
                style={{
                  marginTop: '16px',
                  fontSize: '12px',
                  color: 'var(--text-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>↩ Přetáhni pro odpověď</span>
              </motion.div>
            )}

            {/* Sound button — English pronunciation */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{
                marginTop: '24px',
                display: 'flex',
                justifyContent: 'center',
                width: '100%'
              }}
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={speaking ? { boxShadow: ['0 0 0 0 rgba(50,215,75,0)', '0 0 0 16px rgba(50,215,75,0.2)', '0 0 0 0 rgba(50,215,75,0)'] } : {}}
                transition={speaking ? { repeat: Infinity, duration: 1.2 } : {}}
                onClick={handlePlayAudio}
                className={`quiz-sound-btn ${speaking ? 'is-playing' : ''}`}
                aria-label={`Přehrát anglicky: ${currentCard.en}`}
              >
                <Volume2 size={32} />
                <span style={{ fontSize: '12px', fontWeight: '700', marginTop: '2px', color: 'var(--text-secondary)' }}>EN</span>
              </motion.button>
            </motion.div>
          </motion.div>
        </div>

        <div style={{ width: '100%', maxWidth: '320px', marginTop: 'auto', paddingBottom: '32px' }}>
          {!showAnswer ? (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: 1.02 }}
              className="btn btn--primary btn--lg btn--block"
              onClick={handleReveal}
              style={{ padding: '20px', fontSize: '18px' }}
            >
              Zobrazit odpověď
              <motion.span
                initial={{ y: 0 }}
                animate={{ y: [0, 4, 0] }}
                transition={{ delay: 0.5, repeat: Infinity, duration: 1.5 }}
                style={{ marginLeft: '8px' }}
              >
                ↓
              </motion.span>
            </motion.button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="quiz-answer-buttons"
            >
              <motion.button
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                whileTap={{ scale: 0.94 }}
                whileHover={{ scale: 1.02, y: -2 }}
                className="quiz-answer-btn quiz-answer-btn--wrong"
                onClick={() => handleAnswer(false)}
                aria-label="Špatná odpověď"
              >
                <X size={24} />
                Špatně
              </motion.button>
              <motion.button
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.15 }}
                whileTap={{ scale: 0.94 }}
                whileHover={{ scale: 1.02, y: -2 }}
                className="quiz-answer-btn quiz-answer-btn--correct"
                onClick={() => handleAnswer(true)}
                aria-label="Správná odpověď"
              >
                <CheckCircle size={24} />
                Správně
              </motion.button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function DailyProgressRing({ current, goal }) {
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

function HomeScreen({ progress, cards, onStartSession, onNavigate }) {
  const [dueCount, setDueCount] = useState(0);
  const [newCount, setNewCount] = useState(0);

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

  const todayLearned = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return Object.values(progress.cardStats || {}).filter(s =>
      s.lastReviewedAt && s.lastReviewedAt.startsWith(today)
    ).length;
  }, [progress.cardStats]);

  const dailyXP = useMemo(() => {
    return progress.xp || 0;
  }, [progress.xp]);

  return (
    <div className="main-content" id="main-content" style={{ paddingBottom: 'calc(72px + 20px)' }}>
      {/* Daily Progress */}
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", bounce: 0.3 }}
        className="daily-progress-banner"
        role="status"
        aria-label={`Dnešní pokrok: ${todayLearned} z ${progress.dailyGoal} slov`}
      >
        <DailyProgressRing current={todayLearned} goal={progress.dailyGoal} />
        <div className="daily-progress-banner__content">
          <div className="daily-progress-banner__title">
            {todayLearned >= progress.dailyGoal ? 'Splněno! 🎉' : 'Dnešní cíl'}
          </div>
          <div className="daily-progress-banner__subtitle">
            {todayLearned} / {progress.dailyGoal} slov
          </div>
          <div className="daily-progress-banner__bar">
            <motion.div
              className="daily-progress-banner__bar-fill"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((todayLearned / progress.dailyGoal) * 100, 100)}%` }}
              transition={{ delay: 0.5, duration: 0.8, type: 'spring', bounce: 0 }}
            />
          </div>
        </div>
      </motion.div>

      {/* Stats - Compact */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="stats-row"
        role="group"
        aria-label="Statistiky"
      >
        {['xp', 'cardsLearned', 'streak'].map((stat, i) => (
          <motion.div
            key={stat}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15 + i * 0.1, type: "spring", bounce: 0.5 }}
            whileHover={{ scale: 1.05, y: -4 }}
            className="stat-item"
          >
            <div className="stat-item__value">
              {stat === 'xp' ? progress.xp || 0 : stat === 'cardsLearned' ? progress.cardsLearned || 0 : progress.streak || 0}
            </div>
            <div className="stat-item__label">{stat === 'xp' ? 'XP' : stat === 'cardsLearned' ? 'Slov' : 'Série'}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Daily Quest */}
      <div className="section">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="section__header"
        >
          <h2 className="section__title">Dnešní lekce</h2>
        </motion.div>

        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
          whileTap={{ scale: 0.98 }}
          className="lesson-card"
          onClick={() => { vibrate(10); onStartSession(dueCount > 0 ? 'review' : 'fresh'); }}
          role="button"
          tabIndex={0}
          aria-label={dueCount > 0 ? `${dueCount} slov k opakování` : 'Procvič nová slovíčka'}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); vibrate(10); onStartSession(dueCount > 0 ? 'review' : 'fresh'); } }}
        >
          <motion.div
            className="lesson-card__icon"
            style={{ background: dueCount > 0 ? 'var(--warning-ghost)' : 'var(--primary-ghost)' }}
            whileHover={{ scale: 1.1, rotate: 5 }}
          >
            {dueCount > 0 ? '🔄' : '✨'}
          </motion.div>
          <div className="lesson-card__content">
            <div className="lesson-card__title">
              {dueCount > 0 ? `${dueCount} slov k opakování` : 'Procvič nová slovíčka'}
            </div>
            <div className="lesson-card__meta">
              {dueCount > 0 ? 'Potřebuješ zopakovat' : `${newCount} nových slov k naučení`}
            </div>
          </div>
          <motion.div
            className="lesson-card__arrow"
            whileHover={{ x: 8 }}
          >
            <Play size={20} fill="var(--primary)" color="var(--primary)" />
          </motion.div>
        </motion.div>

        {/* Quick Practice - Two compact cards */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          whileTap={{ scale: 0.98 }}
          className="lesson-card"
          onClick={() => { vibrate(10); onStartSession('fresh', 10); }}
          role="button"
          tabIndex={0}
          aria-label="10 nových slov — rychlé procvičení"
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); vibrate(10); onStartSession('fresh', 10); } }}
        >
          <motion.div
            className="lesson-card__icon"
            style={{ background: 'var(--secondary-ghost)' }}
            whileHover={{ scale: 1.1, rotate: -5 }}
          >
            ⚡
          </motion.div>
          <div className="lesson-card__content">
            <div className="lesson-card__title">10 nových slov</div>
            <div className="lesson-card__meta">Rychlé procvičení</div>
          </div>
          <motion.div className="lesson-card__arrow" whileHover={{ x: 8 }}>
            <ChevronRight size={18} color="var(--text-muted)" />
          </motion.div>
        </motion.div>

        {/* Dental Vocabulary */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
          whileTap={{ scale: 0.98 }}
          className="lesson-card"
          onClick={() => { vibrate(10); onStartSession('dental', 20); }}
          role="button"
          tabIndex={0}
          aria-label="Zubní slovíčka — anglické názvosloví"
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); vibrate(10); onStartSession('dental', 20); } }}
          style={{
            background: 'linear-gradient(135deg, var(--bg-elevated) 0%, var(--primary-ghost) 100%)',
            border: '2px solid var(--primary)',
          }}
        >
          <motion.div
            className="lesson-card__icon"
            style={{ background: 'linear-gradient(135deg, #32D74B 0%, #0A84FF 100%)' }}
            whileHover={{ scale: 1.1, rotate: -5 }}
          >
            🦷
          </motion.div>
          <div className="lesson-card__content">
            <div className="lesson-card__title">Zubní slovíčka</div>
            <div className="lesson-card__meta">Anglické názvosloví</div>
          </div>
          <motion.div className="lesson-card__arrow" whileHover={{ x: 8 }}>
            <ChevronRight size={18} color="var(--text-muted)" />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

function VocabularyScreen({ cards, progress, onPlayEN }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [visibleCount, setVisibleCount] = useState(24);

  const cardRows = useMemo(() => {
    return cards.map((card) => {
      const statRaw = progress.cardStats?.[card.id];
      const stat = normalizeCardStat(card.id, statRaw || {});
      const isMastered = stat.lastRating === 'good' || stat.lastRating === 'easy';
      const isDue = Boolean(statRaw) && isCardDue(stat);
      const status = isDue ? 'review' : isMastered ? 'mastered' : 'new';

      return { card, stat, status, isMastered };
    });
  }, [cards, progress.cardStats]);

  const filteredCards = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cardRows.filter(({ card, status }) => {
      const matchesSearch =
        !q ||
        card.en.toLowerCase().includes(q) ||
        card.cz.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [cardRows, search, statusFilter]);

  const visibleCards = useMemo(
    () => filteredCards.slice(0, visibleCount),
    [filteredCards, visibleCount]
  );

  useEffect(() => {
    setVisibleCount(24);
  }, [search, statusFilter]);

  const learnedCount = useMemo(() => {
    return Object.values(progress.cardStats || {}).filter(s => s.lastRating === 'good' || s.lastRating === 'easy').length;
  }, [progress.cardStats]);

  const totalCards = cards.length;
  const progressPercent = totalCards > 0 ? Math.round((learnedCount / totalCards) * 100) : 0;

  return (
    <div className="main-content" id="main-content">
      <div className="section">
        <div className="vocabulary-hero">
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <div className="vocabulary-hero__value">{learnedCount}</div>
            <div style={{ fontSize: '20px', fontWeight: '600', opacity: 0.7 }}>/ {totalCards}</div>
          </div>
<div className="vocabulary-hero__label">Slovíček jsi se naučil/a ({progressPercent}%)</div>
          <div style={{ height: '8px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px', marginTop: '12px', overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ delay: 0.3, duration: 0.8, type: "spring" }}
              style={{ height: '100%', background: 'rgba(255,255,255,0.9)', borderRadius: '4px' }}
            />
          </div>
        </div>

        <div className="vocabulary-search">
          <Search size={20} className="vocabulary-search__icon" />
          <input
            type="text"
            placeholder="Hledat slovo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="vocabulary-search__input"
            aria-label="Hledat slovíčko"
            id="vocabulary-search"
          />
        </div>

        <div className="vocabulary-controls">
          <label className="vocabulary-select">
            <span>Filtr</span>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">Vše</option>
              <option value="review">K zopakování</option>
              <option value="new">Nová</option>
              <option value="mastered">Zvládnutá</option>
            </select>
          </label>
          <div className="vocabulary-counter" aria-live="polite">
            {filteredCards.length} slov
          </div>
        </div>

        {filteredCards.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="empty-state"
            role="status"
          >
            <div className="empty-state__icon" aria-hidden="true">🔍</div>
            <div className="empty-state__title">Nic jsme nenašli</div>
            <div className="empty-state__text">Zkus hledat něco jiného.</div>
          </motion.div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }} role="list" aria-label="Seznam slovíček">
            {visibleCards.map(({ card, stat, isMastered, status }, i) => {
              const phonetic = formatPhonetic(card.en);
              const strength = Math.max(
                6,
                Math.min(
                  100,
                  Math.round(
                    (Math.min(stat.reviewCount || 0, 5) / 5) * 60 +
                    (Math.min(stat.ease || 1.3, 3.1) - 1.3) * 20 +
                    (isMastered ? 20 : 0)
                  )
                )
              );

              return (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.4) }}
                  className="vocabulary-card"
                  role="listitem"
                >
                  {isMastered && (
                    <div className="vocabulary-card__badge" aria-label="Naučeno">
                      <CheckCircle size={16} />
                    </div>
                  )}
                  <div className="vocabulary-card__content">
                    <div className="vocabulary-card__en">{card.en}</div>
                    <div className="vocabulary-card__cz">{card.cz}</div>
                    <div className={`vocabulary-card__status vocabulary-card__status--${status}`}>
                      {status === 'review' ? 'K zopakování' : status === 'mastered' ? 'Zvládnutá' : 'Nová'}
                    </div>
                    <div
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        color: 'var(--primary)',
                        fontWeight: 600,
                        marginTop: '4px',
                      }}
                    >
                      {phonetic}
                    </div>
                    <div className="vocabulary-strength" aria-label={`Síla ${strength}%`}>
                      <span style={{ width: `${strength}%` }} />
                    </div>
                  </div>
                  <div className="vocabulary-card__actions">
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={() => { vibrate(10); onPlayEN(card.en); }}
                      className="vocabulary-card__sound"
                      aria-label={`Anglicky: ${card.en}`}
                      title="🇬🇧 English"
                    >
                      <Volume2 size={18} />
                      <span className="vocabulary-card__sound-label">EN</span>
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}

            {filteredCards.length > visibleCount && (
              <button
                type="button"
                className="vocabulary-load-more"
                onClick={() => setVisibleCount((value) => value + 24)}
              >
                Načíst další
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileScreen({ progress, onReset, theme, onCycleTheme }) {
  const THEME_ICONS = { light: Sun, dark: Moon, system: Monitor };
  const Icon = THEME_ICONS[theme] || Monitor;
  const labels = { light: 'Světlý režim', dark: 'Tmavý režim', system: 'Systémový režim' };

  return (
    <div className="main-content" id="main-content">
      <div className="section">
        <div className="profile-section">
          <div className="profile-avatar" aria-hidden="true">
            🎓
          </div>
          <h2 className="profile-name">Student</h2>
        </div>

        {/* Theme Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lesson-card"
          onClick={onCycleTheme}
          style={{ cursor: 'pointer', marginBottom: '16px' }}
          whileTap={{ scale: 0.98 }}
        >
          <div
            className="lesson-card__icon"
            style={{ background: 'var(--bg-tertiary)' }}
          >
            <Icon size={24} color="var(--text)" />
          </div>
          <div className="lesson-card__content">
            <div className="lesson-card__title">Vzhled</div>
            <div className="lesson-card__meta">{labels[theme] || 'Systémový'}</div>
          </div>
          <ChevronRight size={20} color="var(--text-muted)" />
        </motion.div>

        <div className="stats-row" role="group" aria-label="Statistiky profilu">
          <div className="stat-item">
            <div className="stat-item__value" style={{ color: 'var(--warning)' }}>🔥 {progress.streak || 0}</div>
            <div className="stat-item__label">Série</div>
          </div>
          <div className="stat-item">
            <div className="stat-item__value" style={{ color: 'var(--secondary)' }}>⚡ {progress.xp || 0}</div>
            <div className="stat-item__label">XP</div>
          </div>
          <div className="stat-item">
            <div className="stat-item__value" style={{ color: 'var(--primary)' }}>📚 {progress.cardsLearned || 0}</div>
            <div className="stat-item__label">Slov</div>
          </div>
        </div>
      </div>

      <div className="section" style={{ marginTop: 'auto', paddingTop: '32px' }}>
        <motion.button
          whileTap={{ scale: 0.96 }}
          className="btn btn--danger btn--3d btn--block btn--lg profile-danger-btn"
          onClick={() => {
            vibrate(20);
            onReset();
          }}
          aria-label="Vymazat veškerý postup"
        >
          <RefreshCcw size={20} />
          Vymazat postup
        </motion.button>
      </div>
    </div>
  );
}

function App() {
  const [progress, setProgress] = useState(() => loadProgress());
  const [activeTab, setActiveTab] = useState('home');
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('gaba-onboarded'));
  const [cards, setCards] = useState([]);
  const [dentalCards, setDentalCards] = useState([]);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(() => loadTheme());
  const [newAchievements, setNewAchievements] = useState([]);
  const [showAchievementToast, setShowAchievementToast] = useState(null);
  const { speak } = useTTS();

  // Apply theme on mount and changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  const cycleTheme = useCallback(() => {
    vibrate(10);
    setTheme(prev => {
      const idx = THEME_CYCLE.indexOf(prev);
      return THEME_CYCLE[(idx + 1) % THEME_CYCLE.length];
    });
  }, []);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  // Check for newly unlocked achievements
  useEffect(() => {
    if (newAchievements.length > 0) {
      const achievement = newAchievements[0];
      setShowAchievementToast(achievement);
      vibrate([30, 50, 30, 50, 100]);

      const timer = setTimeout(() => {
        setShowAchievementToast(null);
        setNewAchievements(prev => prev.slice(1));
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [newAchievements]);

  useEffect(() => {
    Promise.all([
      fetch('/data/slovicka-lite.json').then(r => r.json()),
      fetch('/data/dental-vocabulary.json').then(r => r.json()).catch(() => [])
    ])
      .then(([generalData, dentalData]) => {
        const en5000 = generalData.filter(c => c.frequencyTag === 'EN-5000').slice(0, 5000);
        setCards(en5000.map((c, i) => normalizeCard(c, i)));
        setDentalCards(dentalData.map((c, i) => normalizeCard(c, i)));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleOnboardingComplete = (dailyGoal) => {
    localStorage.setItem('gaba-onboarded', 'true');
    setShowOnboarding(false);
  };

  const handleStartSession = (type, count = 10) => {
    if (!cards.length && type !== 'dental') return;

    let sessionCards;
    let title = '';

    if (type === 'dental') {
      sessionCards = sampleItems(dentalCards, count);
      title = '🦷 Zubní slovíčka';
    } else if (type === 'review') {
      const due = cards.filter(c => {
        const stat = progress.cardStats[c.id];
        return stat && isCardDue(normalizeCardStat(c.id, stat));
      });
      sessionCards = sampleItems(due.length ? due : cards, count);
      title = 'Opakování';
    } else {
      const notLearned = cards.filter(c => !progress.cardStats[c.id]);
      sessionCards = sampleItems(notLearned.length ? notLearned : cards, count);
      title = 'Nová slovíčka';
    }

    setSession({
      id: `session-${Date.now()}`,
      title,
      cards: sessionCards
    });
  };

  const [sessionResult, setSessionResult] = useState(null);

  const handleSessionComplete = (result) => {
    const xpGained = result.correct * 10;
    const streakBonus = result.total === result.correct ? 5 : 0;
    const isPerfect = result.correct === result.total;

    setProgress(p => {
      const updatedProgress = {
        ...p,
        xp: p.xp + xpGained + streakBonus,
        cardsLearned: p.cardsLearned + result.correct,
        lessonsCompleted: p.lessonsCompleted + 1,
        streak: p.streak + streakBonus,
        lastStudyDate: new Date().toISOString().split('T')[0],
        perfectLessons: (p.perfectLessons || 0) + (isPerfect ? 1 : 0),
      };

      // Check for new achievements
      const unlocked = checkAchievements(updatedProgress);
      if (unlocked.length > 0) {
        const newUnlockedIds = unlocked.map(a => a.id);
        updatedProgress.achievements = [...(p.achievements || []), ...newUnlockedIds];
        updatedProgress.xp += unlocked.reduce((sum, a) => sum + a.xpReward, 0);
        setNewAchievements(unlocked);
      }

      return updatedProgress;
    });

    setSessionResult(result);
  };

  const handleContinue = () => {
    setSessionResult(null);
    setSession(null);
  };

  const handleReset = () => {
    if (confirm('Opravdu chceš vymazat veškerý postup? Tato akce je nevratná.')) {
      setProgress(DEFAULT_PROGRESS);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const handleClaimAchievement = (achievementId) => {
    // Achievements are auto-claimed when conditions are met
  };

  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  if (loading) {
    return (
      <div className="app-container">
        <div className="loading-screen">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="loading-screen__icon"
            aria-hidden="true"
          >
            📚
          </motion.div>
          <div className="loading-screen__text" role="status">Načítám lekce...</div>
          <div className="loading-screen__progress">
            <div className="loading-screen__progress-bar" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Skip to content - Enhanced for accessibility */}
      <a href="#main-content" className="skip-link">Přeskočit na obsah</a>

      <AnimatePresence>
        {session && !sessionResult && (
          <motion.div
            key="quiz"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, background: 'var(--bg)' }}
          >
            <QuizScreen
              session={session}
              onComplete={handleSessionComplete}
              onExit={() => setSession(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {sessionResult && (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, background: 'var(--bg)' }}
          >
            <SessionComplete
              result={sessionResult}
              onContinue={handleContinue}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {activeTab === 'home' && (
          <motion.div
            key="home"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
          >
            <HomeScreen
              progress={progress}
              cards={cards}
              onStartSession={handleStartSession}
            />
          </motion.div>
        )}

        {activeTab === 'vocabulary' && (
          <motion.div
            key="vocabulary"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
          >
            <VocabularyScreen
              cards={cards}
              progress={progress}
              onPlayEN={(text) => speak(text, 'en')}
            />
          </motion.div>
        )}

        {activeTab === 'achievements' && (
          <motion.div
            key="achievements"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
          >
            <AchievementsScreen
              progress={progress}
              onClaimAchievement={handleClaimAchievement}
            />
          </motion.div>
        )}

        {activeTab === 'profile' && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
          >
            <ProfileScreen
              progress={progress}
              onReset={handleReset}
              theme={theme}
              onCycleTheme={cycleTheme}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Achievement Toast Notification */}
      <AnimatePresence>
        {showAchievementToast && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", bounce: 0.3 }}
            className="achievement-toast"
          >
            <div
              className="achievement-toast__icon"
              style={{ background: showAchievementToast.color }}
            >
              <Trophy size={24} color="#000" />
            </div>
            <div className="achievement-toast__content">
              <div className="achievement-toast__title">
                🎉 Odznak odemčen!
              </div>
              <div className="achievement-toast__description">
                {showAchievementToast.title}
              </div>
              <div className="achievement-toast__xp">+{showAchievementToast.xpReward} XP</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="tab-bar" role="tablist" aria-label="Hlavní navigace">
        <button
          className={`tab-item ${activeTab === 'home' ? 'is-active' : ''}`}
          onClick={() => {
            if (activeTab !== 'home') vibrate(10);
            setActiveTab('home');
          }}
          role="tab"
          aria-selected={activeTab === 'home'}
          aria-controls="main-content"
          id="tab-home"
        >
          <Home aria-hidden="true" />
          <span>Home</span>
        </button>
        <button
          className={`tab-item ${activeTab === 'vocabulary' ? 'is-active' : ''}`}
          onClick={() => {
            if (activeTab !== 'vocabulary') vibrate(10);
            setActiveTab('vocabulary');
          }}
          role="tab"
          aria-selected={activeTab === 'vocabulary'}
          aria-controls="main-content"
          id="tab-vocabulary"
        >
          <BookOpen aria-hidden="true" />
          <span>Slovíčka</span>
        </button>
        <button
          className={`tab-item ${activeTab === 'achievements' ? 'is-active' : ''}`}
          onClick={() => {
            if (activeTab !== 'achievements') vibrate(10);
            setActiveTab('achievements');
          }}
          role="tab"
          aria-selected={activeTab === 'achievements'}
          aria-controls="main-content"
          id="tab-achievements"
        >
          <Award aria-hidden="true" />
          <span>Ocenení</span>
        </button>
        <button
          className={`tab-item ${activeTab === 'profile' ? 'is-active' : ''}`}
          onClick={() => {
            if (activeTab !== 'profile') vibrate(10);
            setActiveTab('profile');
          }}
          role="tab"
          aria-selected={activeTab === 'profile'}
          aria-controls="main-content"
          id="tab-profile"
        >
          <User aria-hidden="true" />
          <span>Profil</span>
        </button>
      </nav>
    </div>
  );
}

export default App;
