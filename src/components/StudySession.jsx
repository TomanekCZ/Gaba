import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronUp, RotateCcw, Sparkles } from 'lucide-react';
import { AnimatePresence, motion, useMotionValue, useTransform } from 'framer-motion';
import Flashcard from './Flashcard';

const SWIPE_THRESHOLD_X = 72;
const SWIPE_THRESHOLD_Y = -68;

function buildSummary(stats, originalCount, cardResults) {
    const reviewedCards = stats.again + stats.hard + stats.good + stats.easy;
    const completionRate = reviewedCards ? Math.round(((stats.good + stats.easy) / reviewedCards) * 100) : 0;
    const latestByCardId = new Map();

    cardResults.forEach((result) => {
        if (!result?.sourceCardId) {
            return;
        }
        latestByCardId.set(result.sourceCardId, result);
    });

    return {
        totalCards: originalCount,
        reviewedCards,
        againCount: stats.again,
        hardCount: stats.hard,
        goodCount: stats.good,
        easyCount: stats.easy,
        completionRate,
        cardResults: Array.from(latestByCardId.values()),
    };
}

function vibrate(pattern) {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(pattern);
    }
}

function getGestureIntent(offset) {
    if (offset.y <= SWIPE_THRESHOLD_Y && Math.abs(offset.y) > Math.abs(offset.x) * 0.8) {
        return 'hard';
    }

    if (offset.x >= SWIPE_THRESHOLD_X) {
        return 'easy';
    }

    if (offset.x <= -SWIPE_THRESHOLD_X) {
        return 'again';
    }

    return null;
}

function GestureButton({ icon: Icon, label, tone, active, onClick }) {
    return (
        <button
            type="button"
            className={`gesture-button gesture-button--${tone} ${active ? 'is-active' : ''}`}
            onClick={onClick}
        >
            <Icon size={16} strokeWidth={2.5} />
            <span>{label}</span>
        </button>
    );
}

export default function StudySession({ lesson, onClose, onComplete }) {
    const [queue, setQueue] = useState(lesson.cards);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [stats, setStats] = useState({ again: 0, hard: 0, good: 0, easy: 0 });
    const [cardResults, setCardResults] = useState([]);
    const [gestureIntent, setGestureIntent] = useState(null);
    const [feedbackTone, setFeedbackTone] = useState(null);
    const completionSentRef = useRef(false);
    const feedbackTimeoutRef = useRef(null);

    const x = useMotionValue(0);
    const rotate = useTransform(x, [-240, 240], [-14, 14]);

    useEffect(() => {
        setQueue(lesson.cards);
        setCurrentIndex(0);
        setShowAnswer(false);
        setStats({ again: 0, hard: 0, good: 0, easy: 0 });
        setCardResults([]);
        setGestureIntent(null);
        setFeedbackTone(null);
        completionSentRef.current = false;
    }, [lesson]);

    useEffect(() => {
        x.set(0);
    }, [currentIndex, showAnswer, x]);

    useEffect(() => {
        return () => {
            if (feedbackTimeoutRef.current) {
                window.clearTimeout(feedbackTimeoutRef.current);
            }
        };
    }, []);

    const currentCard = queue[currentIndex];
    const isComplete = currentIndex >= queue.length;

    const summary = useMemo(
        () => buildSummary(stats, lesson.cards.length, cardResults),
        [cardResults, lesson.cards.length, stats]
    );

    useEffect(() => {
        if (!isComplete || completionSentRef.current) {
            return;
        }

        completionSentRef.current = true;
        onComplete(summary);
    }, [isComplete, onComplete, summary]);

    const progressPercent = queue.length ? Math.min(100, (currentIndex / queue.length) * 100) : 100;
    const progressLabel = queue.length ? `${Math.min(currentIndex + 1, queue.length)}/${queue.length}` : '0/0';

    function pulseFeedback(result) {
        setFeedbackTone(result);

        if (feedbackTimeoutRef.current) {
            window.clearTimeout(feedbackTimeoutRef.current);
        }

        feedbackTimeoutRef.current = window.setTimeout(() => {
            setFeedbackTone(null);
        }, 220);
    }

    function revealAnswer() {
        if (showAnswer || isComplete) {
            return;
        }

        setShowAnswer(true);
        vibrate(10);
    }

    function submitRating(result) {
        const card = queue[currentIndex];
        if (!card) {
            return;
        }

        pulseFeedback(result);
        setGestureIntent(null);

        if (result === 'again') {
            vibrate([14, 22, 10]);
        } else if (result === 'hard') {
            vibrate(14);
        } else {
            vibrate(18);
        }

        setStats((currentStats) => ({
            ...currentStats,
            [result]: currentStats[result] + 1,
        }));

        setCardResults((currentResults) => [
            ...currentResults,
            {
                sourceCardId: card.sourceCardId || card.id,
                lessonId: lesson.id,
                lessonTitle: lesson.title,
                en: card.en || '',
                cz: card.cz || '',
                rating: result,
                reviewedAt: new Date().toISOString(),
            },
        ]);

        setQueue((currentQueue) => {
            if (result === 'easy' || result === 'good') {
                return currentQueue;
            }

            const reviewCard = {
                ...card,
                id: `${card.id}-review-${currentIndex}-${result}`,
                reviewRound: (card.reviewRound || 0) + 1,
            };

            if (result === 'hard') {
                const nextQueue = [...currentQueue];
                const insertIndex = Math.min(currentIndex + 3, nextQueue.length);
                nextQueue.splice(insertIndex, 0, reviewCard);
                return nextQueue;
            }

            return [...currentQueue, reviewCard];
        });

        setCurrentIndex((index) => index + 1);
        setShowAnswer(false);
    }

    const cardVariants = {
        initial: { opacity: 0, y: 18, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: -18, scale: 0.98 },
    };

    return (
        <section className={`session-shell ${feedbackTone ? `session-shell--${feedbackTone}` : ''}`}>
            <header className="session-topbar">
                <button type="button" className="icon-ghost" onClick={onClose} aria-label="Zpět">
                    <ArrowLeft size={18} strokeWidth={2.5} />
                </button>

                <div className="session-topbar__copy">
                    <span className="eyebrow">{lesson.title}</span>
                    <strong>{isComplete ? 'Hotovo' : showAnswer ? 'Ohodnoť jedním gestem' : 'Ťukni a odhal význam'}</strong>
                </div>

                <div className="session-counter">{progressLabel}</div>
            </header>

            <div className="session-progress">
                <motion.div
                    className="session-progress__fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.24, ease: 'easeOut' }}
                />
            </div>

            {!isComplete ? (
                <>
                    <main className="session-main">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentCard?.id || currentIndex}
                                className={`gesture-stage ${showAnswer ? 'is-draggable' : ''}`}
                                variants={cardVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                transition={{ duration: 0.22, ease: 'easeOut' }}
                                drag={showAnswer}
                                dragElastic={0.18}
                                dragConstraints={{ top: 0, right: 0, bottom: 0, left: 0 }}
                                whileDrag={{ scale: 0.97 }}
                                onClick={() => {
                                    if (!showAnswer) {
                                        revealAnswer();
                                    }
                                }}
                                onDrag={(_, info) => setGestureIntent(getGestureIntent(info.offset))}
                                onDragEnd={(_, info) => {
                                    const nextIntent = getGestureIntent(info.offset);
                                    setGestureIntent(null);

                                    if (nextIntent) {
                                        submitRating(nextIntent);
                                    }
                                }}
                                style={{ x, rotate, touchAction: showAnswer ? 'none' : 'manipulation' }}
                            >
                                <Flashcard card={currentCard} lesson={lesson} showAnswer={showAnswer} />
                            </motion.div>
                        </AnimatePresence>
                    </main>

                    <footer className="session-footer">
                        {!showAnswer ? (
                            <div className="reveal-prompt">
                                <Sparkles size={16} strokeWidth={2.5} />
                                <span>Ťukni na kartu pro odhalení</span>
                            </div>
                        ) : (
                            <>
                                <div className="gesture-row">
                                    <GestureButton
                                        icon={RotateCcw}
                                        label="Znovu"
                                        tone="again"
                                        active={gestureIntent === 'again'}
                                        onClick={() => submitRating('again')}
                                    />
                                    <GestureButton
                                        icon={ChevronUp}
                                        label="Těžké"
                                        tone="hard"
                                        active={gestureIntent === 'hard'}
                                        onClick={() => submitRating('hard')}
                                    />
                                    <GestureButton
                                        icon={ArrowRight}
                                        label="Umím"
                                        tone="easy"
                                        active={gestureIntent === 'easy'}
                                        onClick={() => submitRating('easy')}
                                    />
                                </div>
                                <p className="session-caption">doleva znovu · nahoru těžké · doprava umím</p>
                            </>
                        )}
                    </footer>
                </>
            ) : (
                <main className="session-main session-main--done">
                    <motion.section
                        className="completion-card"
                        initial={{ opacity: 0, y: 18, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.24, ease: 'easeOut' }}
                    >
                        <div className="completion-card__icon">
                            <CheckCircle2 size={30} strokeWidth={2.6} />
                        </div>
                        <h2>Hotovo na dnes</h2>
                        <p>{summary.reviewedCards} odpovědí v jedné čisté session.</p>

                        <div className="completion-stats">
                            <div>
                                <strong>{summary.easyCount}</strong>
                                <span>jisté</span>
                            </div>
                            <div>
                                <strong>{summary.hardCount}</strong>
                                <span>těžké</span>
                            </div>
                            <div>
                                <strong>{summary.againCount}</strong>
                                <span>znovu</span>
                            </div>
                        </div>

                        <button type="button" className="button button--primary" onClick={onClose}>
                            <CheckCircle2 size={18} strokeWidth={2.4} />
                            Zpět na dnešek
                        </button>
                    </motion.section>
                </main>
            )}
        </section>
    );
}
