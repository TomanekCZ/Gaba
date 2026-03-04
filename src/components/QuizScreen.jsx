import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, CheckCircle } from 'lucide-react';
import { useTTS } from '../hooks/useTTS';
import { vibrate } from '../utils/vibrate';
import { formatPhonetic } from '../utils/phonetic';

export default function QuizScreen({ session, onComplete, onExit }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [result, setResult] = useState({ correct: 0, total: session.cards.length });
  const { speak, speaking, stop } = useTTS();
  const touchStartX = useRef(0);

  const currentCard = session.cards[currentIndex];
  const progress = ((currentIndex) / session.cards.length) * 100;

  // Swipe gestures
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (diff > 50 && !showAnswer) {
      vibrate(15);
      setShowAnswer(true);
    } else if (diff < -50) {
      vibrate(10);
      stop();
      onExit();
    }
  };

  const handlePlayAudio = useCallback(() => {
    vibrate(10);
    speak(currentCard.en, 'en');
  }, [currentCard.en, speak]);

  const handleReveal = useCallback(() => {
    vibrate(15);
    setShowAnswer(true);
  }, []);

  const handleAnswer = useCallback((wasCorrect) => {
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
  }, [currentIndex, session.cards.length, result.correct, onComplete, stop]);

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

            {/* Phonetic pronunciation */}
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

            {/* Sound button */}
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