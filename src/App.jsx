import { useEffect, useMemo, useState } from 'react';
import {
    ArrowRight,
    BookOpen,
    CheckCircle2,
    Clock3,
    Flame,
    GraduationCap,
    Home,
    Play,
    RefreshCcw,
    RotateCcw,
    Settings as SettingsIcon,
    Sparkles,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import StudySession from './components/StudySession';
import VocabularyList from './components/VocabularyList';
import Settings from './components/Settings';
import { sampleItems } from './utils/random';
import { formatRelativeDue, getDuePriority, isCardDue, normalizeCardStat, scheduleCardReview } from './utils/srs';
import { usePwaInstall } from './hooks/usePwaInstall';

const PROGRESS_STORAGE_KEY = 'gaba-progress-v9';
const BASE_LEVEL_TAG = 'EN-5000';
const BASE_BAND_SIZE = 100;
const PRIMARY_CARDS_URL = '/data/slovicka-lite.json';
const FALLBACK_CARDS_URL = '/data/slovicka.json';

const DEFAULT_PROGRESS = {
    completedLessonIds: [],
    sessionsCompleted: 0,
    cardsReviewed: 0,
    masteredCards: 0,
    cardStats: {},
    streakDays: 0,
    lastLessonId: null,
    lastLessonTitle: null,
    lastStudiedAt: null,
};

function normalizeCard(card, index, lessonId) {
    return {
        id: card.id || `${lessonId}-card-${index + 1}`,
        en: card.en || '',
        cz: card.cz || '',
        meanings: Array.isArray(card.meanings) ? card.meanings : [],
        sourceCardId: card.sourceCardId || card.id || `${lessonId}-card-${index + 1}`,
        type: card.type || 'Slovíčko',
        phonetic: card.phonetic || '',
        context: card.context || card.example || '',
        contextCz: card.contextCz || card.exampleCz || '',
        tags: Array.isArray(card.tags) ? card.tags : [],
        frequencyTag: card.frequencyTag || null,
    };
}

function normalizeLesson(lesson, source) {
    const cards = Array.isArray(lesson.cards) ? lesson.cards : [];

    return {
        id: lesson.id,
        title: lesson.title || 'Lekce bez názvu',
        description: lesson.description || '',
        source,
        goal: lesson.goal || '',
        studyFocus: lesson.studyFocus || '',
        direction: lesson.direction || 'en-to-cz',
        cards: cards.map((card, index) => normalizeCard(card, index, lesson.id)),
    };
}

function buildLesson({ id, title, description, goal, studyFocus, cards }, source) {
    return normalizeLesson(
        {
            id,
            title,
            description,
            goal,
            studyFocus,
            cards,
            direction: 'en-to-cz',
        },
        source
    );
}

function buildReviewLesson(cards, size, title, description) {
    const limitedCards = cards.slice(0, Math.min(size, cards.length));

    return buildLesson(
        {
            id: `review-${Date.now()}`,
            title,
            description,
            goal: 'Krátký návrat k tomu, co se ještě neudrželo.',
            studyFocus: 'Dívej se na slovo, odhal význam a reaguj jedním gestem.',
            cards: limitedCards,
        },
        'review'
    );
}

function buildFreshLesson(cards, size, title, description, source = 'today') {
    const limitedCards = sampleItems(cards, Math.min(size, cards.length));

    return buildLesson(
        {
            id: `${source}-${Date.now()}`,
            title,
            description,
            goal: 'Krátká nová dávka bez zbytečných rozhodnutí navíc.',
            studyFocus: 'Otevři kartu, odhal význam a pokračuj dál.',
            cards: limitedCards,
        },
        source
    );
}

function loadStoredProgress() {
    try {
        const stored = localStorage.getItem(PROGRESS_STORAGE_KEY);
        if (!stored) {
            return DEFAULT_PROGRESS;
        }

        const parsed = JSON.parse(stored);
        const parsedCardStats =
            parsed.cardStats && typeof parsed.cardStats === 'object' && !Array.isArray(parsed.cardStats)
                ? Object.fromEntries(
                    Object.entries(parsed.cardStats).map(([cardId, stat]) => [cardId, normalizeCardStat(cardId, stat)])
                )
                : {};

        return {
            ...DEFAULT_PROGRESS,
            ...parsed,
            completedLessonIds: Array.isArray(parsed.completedLessonIds) ? parsed.completedLessonIds : [],
            cardStats: parsedCardStats,
        };
    } catch (error) {
        console.warn('Failed to restore progress:', error);
        localStorage.removeItem(PROGRESS_STORAGE_KEY);
        return DEFAULT_PROGRESS;
    }
}

function persistToStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.warn(`Failed to persist ${key}:`, error);
    }
}

function getDayDifference(previousDateIso) {
    if (!previousDateIso) {
        return null;
    }

    const previousDate = new Date(previousDateIso);
    const now = new Date();
    const previous = new Date(previousDate.getFullYear(), previousDate.getMonth(), previousDate.getDate());
    const current = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return Math.round((current - previous) / 86400000);
}

function computeStreak(lastStudiedAt) {
    const dayDifference = getDayDifference(lastStudiedAt);

    if (dayDifference === null) {
        return 1;
    }
    if (dayDifference === 0) {
        return null;
    }
    if (dayDifference === 1) {
        return 'increment';
    }

    return 1;
}

function formatLastStudied(lastStudiedAt) {
    if (!lastStudiedAt) {
        return 'Ještě nic';
    }

    const dayDifference = getDayDifference(lastStudiedAt);
    if (dayDifference === 0) {
        return 'Dnes';
    }
    if (dayDifference === 1) {
        return 'Včera';
    }

    return new Intl.DateTimeFormat('cs-CZ', {
        day: 'numeric',
        month: 'short',
    }).format(new Date(lastStudiedAt));
}

function isStudyCandidate(card) {
    const en = String(card.en || '').trim();
    const frequencyTag = String(card.frequencyTag || '').trim();

    if (!en || !frequencyTag) {
        return false;
    }

    const hasAnswer = Array.isArray(card.meanings) ? card.meanings.length > 0 : Boolean(card.cz);
    return hasAnswer;
}

function buildUpdatedCardStats(existingStats, cardResults) {
    if (!Array.isArray(cardResults) || !cardResults.length) {
        return existingStats;
    }

    const nextStats = { ...existingStats };

    cardResults.forEach((result) => {
        if (!result?.sourceCardId) {
            return;
        }

        const cardId = result.sourceCardId;
        const previous = normalizeCardStat(cardId, nextStats[cardId]);
        const scheduled = scheduleCardReview(previous, result.rating, result.reviewedAt || new Date().toISOString());

        nextStats[cardId] = {
            ...scheduled,
            en: result.en || previous.en,
            cz: result.cz || previous.cz,
            lessonId: result.lessonId || previous.lessonId,
            lessonTitle: result.lessonTitle || previous.lessonTitle,
        };
    });

    return nextStats;
}

function buildReviewCandidates(cardStats, cardLookup) {
    return Object.values(cardStats || {})
        .map((stat) => {
            const normalized = normalizeCardStat(stat?.cardId, stat);
            const card = cardLookup.get(normalized.cardId);

            if (!card) {
                return null;
            }

            return {
                card,
                stat: normalized,
                shouldReview: isCardDue(normalized),
                score: getDuePriority(normalized),
            };
        })
        .filter(Boolean)
        .sort((a, b) => b.score - a.score);
}

function NoticeToast({ notice }) {
    if (!notice) {
        return null;
    }

    return (
        <motion.div
            className={`notice-toast notice-toast--${notice.type}`}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
        >
            {notice.message}
        </motion.div>
    );
}

function LoadingState() {
    return (
        <section className="surface-card surface-card--state">
            <div className="state-row">
                <div className="state-row__icon">
                    <Sparkles size={20} strokeWidth={2.4} />
                </div>
                <div>
                    <h2>Načítám slovíčka</h2>
                    <p>Připravuju dnešní tok učení z lokální databáze.</p>
                </div>
            </div>
        </section>
    );
}

function ErrorState({ onRetry }) {
    return (
        <section className="surface-card surface-card--state">
            <div className="state-row">
                <div className="state-row__icon state-row__icon--danger">
                    <RefreshCcw size={20} strokeWidth={2.4} />
                </div>
                <div>
                    <h2>Nedaří se načíst data</h2>
                    <p>Zkontroluj připojení a zkus to znovu.</p>
                </div>
            </div>
            <div className="state-actions">
                <button type="button" className="button button--primary" onClick={onRetry}>
                    <RefreshCcw size={18} strokeWidth={2.4} />
                    Načíst znovu
                </button>
            </div>
        </section>
    );
}

function EmptyState() {
    return (
        <section className="surface-card surface-card--state">
            <div className="state-row">
                <div className="state-row__icon state-row__icon--warning">
                    <BookOpen size={20} strokeWidth={2.4} />
                </div>
                <div>
                    <h2>V databázi chybí obsah</h2>
                    <p>Základní balík slovíček EN-5000 není dostupný pro dnešní studium.</p>
                </div>
            </div>
        </section>
    );
}

function TodayHero({ title, subtitle, primaryLabel, secondaryLabel, onPrimary, onSecondary, meta }) {
    return (
        <section className="today-hero">
            <div className="today-hero__copy">
                <span className="eyebrow">Dnešek</span>
                <h1>{title}</h1>
                <p>{subtitle}</p>
            </div>

            <div className="today-hero__meta">
                {meta.map((item) => {
                    const Icon = item.icon;
                    return (
                        <div key={item.label} className="hero-pill">
                            <Icon size={15} strokeWidth={2.4} />
                            <div>
                                <span>{item.label}</span>
                                <strong>{item.value}</strong>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="today-hero__actions">
                <button type="button" className="button button--primary" onClick={onPrimary}>
                    <Play size={18} strokeWidth={2.4} />
                    {primaryLabel}
                </button>
                <button type="button" className="button button--secondary" onClick={onSecondary}>
                    <ArrowRight size={18} strokeWidth={2.4} />
                    {secondaryLabel}
                </button>
            </div>
        </section>
    );
}

function JourneyCard({ progressPercent, bandProgress }) {
    const visibleBands = bandProgress.slice(0, 12);

    return (
        <section className="surface-card journey-card">
            <div className="journey-card__header">
                <div>
                    <h2>Cesta EN-5000</h2>
                    <p>Postup nejdůležitější slovní zásobou.</p>
                </div>
                <strong>{progressPercent}%</strong>
            </div>

            <div className="journey-progress">
                <span className="journey-progress__fill" style={{ width: `${progressPercent}%` }} />
            </div>

            <div className="journey-grid">
                {visibleBands.map((band, index) => (
                    <div
                        key={band.lesson.id}
                        className={`journey-dot ${band.completed ? 'is-done' : band.locked ? 'is-locked' : 'is-active'}`}
                        title={band.lesson.title}
                    >
                        {band.completed ? <CheckCircle2 size={13} strokeWidth={2.6} /> : index + 1}
                    </div>
                ))}
            </div>
        </section>
    );
}

function QuickActionCard({ action, onStart }) {
    const Icon = action.icon;

    return (
        <motion.button
            type="button"
            className="quick-action"
            onClick={() => onStart(action)}
            whileTap={{ scale: 0.985 }}
        >
            <div className="quick-action__icon">
                <Icon size={18} strokeWidth={2.4} />
            </div>
            <div className="quick-action__copy">
                <strong>{action.title}</strong>
                <span>{action.description}</span>
            </div>
            <small>{action.meta}</small>
        </motion.button>
    );
}

function SideNav({ activeTab, onTabChange, streakDays }) {
    const items = [
        { id: 'home', label: 'Dnes', icon: Home },
        { id: 'library', label: 'Slovíčka', icon: BookOpen },
        { id: 'settings', label: 'Nastavení', icon: SettingsIcon },
    ];

    return (
        <aside className="sidebar">
            <div className="sidebar__brand">
                <div className="brand">
                    <div className="brand__mark">
                        <GraduationCap size={22} strokeWidth={2.5} />
                    </div>
                    <div>
                        <span className="eyebrow">Gaba English</span>
                        <strong className="brand__title">Study</strong>
                    </div>
                </div>
            </div>

            <nav className="sidebar__nav">
                {items.map((item) => {
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.id}
                            type="button"
                            className={`sidebar__item ${activeTab === item.id ? 'is-active' : ''}`}
                            onClick={() => onTabChange(item.id)}
                        >
                            <Icon size={19} strokeWidth={2.5} />
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            <div className="sidebar__footer">
                <div className="streak-badge">
                    <Flame size={14} strokeWidth={2.5} />
                    {streakDays || 0} dní
                </div>
            </div>
        </aside>
    );
}

function MobileTabBar({ activeTab, onTabChange }) {
    return (
        <nav className="tab-bar">
            <button type="button" className={`tab-bar__item ${activeTab === 'home' ? 'is-active' : ''}`} onClick={() => onTabChange('home')}>
                <Home size={20} strokeWidth={2.5} />
                <span>Dnes</span>
            </button>
            <button type="button" className={`tab-bar__item ${activeTab === 'library' ? 'is-active' : ''}`} onClick={() => onTabChange('library')}>
                <BookOpen size={20} strokeWidth={2.5} />
                <span>Slovíčka</span>
            </button>
            <button type="button" className={`tab-bar__item ${activeTab === 'settings' ? 'is-active' : ''}`} onClick={() => onTabChange('settings')}>
                <SettingsIcon size={20} strokeWidth={2.5} />
                <span>Nastavení</span>
            </button>
        </nav>
    );
}

function App() {
    const [progress, setProgress] = useState(() => loadStoredProgress());
    const [sessionLesson, setSessionLesson] = useState(null);
    const [ankiCards, setAnkiCards] = useState([]);
    const [libraryStatus, setLibraryStatus] = useState('loading');
    const [notice, setNotice] = useState(null);
    const [reloadToken, setReloadToken] = useState(0);
    const [activeTab, setActiveTab] = useState('home');
    const [theme, setTheme] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('gaba-theme') || 'system' : 'system'));

    const { canInstall, isInstalled, isIos, install } = usePwaInstall();

    useEffect(() => {
        localStorage.setItem('gaba-theme', theme);
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else if (theme === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
    }, [theme]);

    useEffect(() => {
        const controller = new AbortController();

        const loadCards = async () => {
            setLibraryStatus('loading');

            try {
                const tryFetch = async (url) => {
                    const response = await fetch(url, { signal: controller.signal });
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }
                    return response.json();
                };

                let parsedCards;
                try {
                    parsedCards = await tryFetch(PRIMARY_CARDS_URL);
                } catch (primaryError) {
                    console.warn('Failed to load lite deck, falling back to full deck.', primaryError);
                    parsedCards = await tryFetch(FALLBACK_CARDS_URL);
                }

                if (!Array.isArray(parsedCards) || !parsedCards.length) {
                    throw new Error('Soubor neobsahuje žádné karty.');
                }

                setAnkiCards(parsedCards);
                setLibraryStatus('ready');
            } catch (error) {
                if (error.name === 'AbortError') {
                    return;
                }

                console.error('Failed to load Slovicka JSON:', error);
                setAnkiCards([]);
                setLibraryStatus('error');
                setNotice({
                    type: 'error',
                    message: `Nepodařilo se načíst slovíčka: ${error.message}`,
                });
            }
        };

        loadCards();

        return () => {
            controller.abort();
        };
    }, [reloadToken]);

    useEffect(() => {
        persistToStorage(PROGRESS_STORAGE_KEY, progress);
    }, [progress]);

    useEffect(() => {
        if (!notice) {
            return undefined;
        }

        const timeout = window.setTimeout(() => {
            setNotice(null);
        }, 3600);

        return () => {
            window.clearTimeout(timeout);
        };
    }, [notice]);

    const studyCards = useMemo(() => ankiCards.filter(isStudyCandidate), [ankiCards]);
    const libraryCards = useMemo(() => studyCards.map((card, index) => normalizeCard(card, index, 'library')), [studyCards]);
    const libraryCardMap = useMemo(() => new Map(libraryCards.map((card) => [card.sourceCardId, card])), [libraryCards]);
    const baseCards = useMemo(() => libraryCards.filter((card) => card.frequencyTag === BASE_LEVEL_TAG), [libraryCards]);

    const baseDeck = useMemo(() => {
        if (!baseCards.length) {
            return null;
        }

        return buildLesson(
            {
                id: 'base-deck',
                title: 'Základní slovní zásoba',
                description: 'Hlavní cesta pro každodenní angličtinu.',
                goal: 'Jeden hlavní tok místo několika režimů.',
                studyFocus: 'Krátké, pravidelné, bez rušení.',
                cards: baseCards,
            },
            'core'
        );
    }, [baseCards]);

    const baseBandLessons = useMemo(() => {
        if (!baseCards.length) {
            return [];
        }

        const totalBands = Math.ceil(baseCards.length / BASE_BAND_SIZE);
        return Array.from({ length: totalBands }, (_, index) => {
            const start = index * BASE_BAND_SIZE;
            const end = Math.min(start + BASE_BAND_SIZE, baseCards.length);
            const cards = baseCards.slice(start, end);

            return buildLesson(
                {
                    id: `base-band-${index + 1}`,
                    title: `Blok ${index + 1}`,
                    description: `${cards.length} slov v hlavní cestě.`,
                    goal: `Plynulé zvládnutí bloku ${index + 1} z ${totalBands}.`,
                    studyFocus: 'Postupně od známější zásoby k dalším slovům.',
                    cards,
                },
                'band'
            );
        });
    }, [baseCards]);

    const cardStats = progress.cardStats || {};

    const bandProgress = useMemo(() => {
        const rows = baseBandLessons.map((lesson) => {
            let reviewed = 0;
            let mastered = 0;

            lesson.cards.forEach((card) => {
                const stat = cardStats[card.sourceCardId];
                if (!stat) {
                    return;
                }

                reviewed += 1;
                if (stat.lastRating === 'good' || stat.lastRating === 'easy') {
                    mastered += 1;
                }
            });

            const masteryRatio = lesson.cards.length ? mastered / lesson.cards.length : 0;
            const reviewedRatio = lesson.cards.length ? reviewed / lesson.cards.length : 0;
            const completed = reviewedRatio >= 0.7 && masteryRatio >= 0.6;

            return {
                lesson,
                completed,
                locked: false,
            };
        });

        for (let index = 0; index < rows.length; index += 1) {
            if (index === 0) {
                continue;
            }
            rows[index].locked = !rows[index - 1].completed;
        }

        return rows;
    }, [baseBandLessons, cardStats]);

    const recommendedBand = useMemo(() => {
        const nextUnlocked = bandProgress.find((item) => !item.locked && !item.completed);
        if (nextUnlocked) {
            return nextUnlocked;
        }

        return [...bandProgress].reverse().find((item) => !item.locked) || null;
    }, [bandProgress]);

    const reviewCandidates = useMemo(() => buildReviewCandidates(cardStats, libraryCardMap), [cardStats, libraryCardMap]);
    const dueCards = useMemo(() => reviewCandidates.filter((item) => item.shouldReview).map((item) => item.card), [reviewCandidates]);
    const nextDueLabel = reviewCandidates.length ? formatRelativeDue(reviewCandidates[0].stat?.dueAt) : 'dnes';

    const nextStepCards = useMemo(() => {
        if (recommendedBand) {
            const unseen = recommendedBand.lesson.cards.filter((card) => !cardStats[card.sourceCardId]);
            if (unseen.length) {
                return unseen;
            }
            return recommendedBand.lesson.cards;
        }

        if (!baseDeck) {
            return [];
        }

        const unseen = baseDeck.cards.filter((card) => !cardStats[card.sourceCardId]);
        return unseen.length ? unseen : baseDeck.cards;
    }, [recommendedBand, baseDeck, cardStats]);

    const heroMeta = [
        { label: 'série', value: `${progress.streakDays || 0} dní`, icon: Flame },
        { label: 'naposledy', value: formatLastStudied(progress.lastStudiedAt), icon: RotateCcw },
        { label: 'celkem', value: `${progress.cardsReviewed || 0} karet`, icon: BookOpen },
    ];

    const homeSummary = useMemo(() => {
        if (dueCards.length) {
            return {
                title: `Dnes čeká ${dueCards.length} slov`,
                subtitle: 'Stačí pár minut a vrátíš to, co se ztrácí.',
                primaryLabel: 'Spustit opakování',
                secondaryLabel: 'Nových 8',
            };
        }

        if (recommendedBand) {
            return {
                title: `Pokračuj v ${recommendedBand.lesson.title}`,
                subtitle: 'Jeden jasný další krok v hlavní cestě.',
                primaryLabel: `Otevřít ${recommendedBand.lesson.title}`,
                secondaryLabel: 'Nových 8',
            };
        }

        return {
            title: 'Začni prvním blokem',
            subtitle: 'První malý krok bez rozptylování.',
            primaryLabel: 'Začít',
            secondaryLabel: 'Lehký start',
        };
    }, [dueCards.length, recommendedBand]);

    const quickActions = useMemo(() => {
        const hasDueCards = dueCards.length > 0;

        return [
            {
                id: 'quick-review',
                title: '5 minut',
                description: hasDueCards ? 'Splatná slovíčka právě teď.' : 'Lehký mix na zahřátí.',
                meta: `${Math.min(hasDueCards ? dueCards.length : nextStepCards.length, 8)} slov`,
                icon: Clock3,
                kind: hasDueCards ? 'review' : 'fresh',
                size: 8,
            },
            {
                id: 'focus-review',
                title: 'Fokus',
                description: hasDueCards ? `Další okno se vrací ${nextDueLabel}.` : 'O něco delší blok.',
                meta: `${Math.min(hasDueCards ? dueCards.length : nextStepCards.length, hasDueCards ? 16 : 12)} slov`,
                icon: RotateCcw,
                kind: hasDueCards ? 'review' : 'fresh',
                size: hasDueCards ? 16 : 12,
            },
            {
                id: 'next-step',
                title: 'Nových 8',
                description: recommendedBand ? recommendedBand.lesson.title : 'Hlavní cesta.',
                meta: 'progress',
                icon: Sparkles,
                kind: 'fresh',
                size: 8,
            },
        ];
    }, [dueCards.length, nextStepCards.length, recommendedBand, nextDueLabel]);

    const masteredTotal = useMemo(
        () => Object.values(cardStats).filter((s) => s.lastRating === 'good' || s.lastRating === 'easy').length,
        [cardStats]
    );

    const globalProgressPercent = useMemo(
        () => (libraryCards.length ? Math.round((masteredTotal / libraryCards.length) * 100) : 0),
        [masteredTotal, libraryCards.length]
    );

    const startToday = () => {
        if (dueCards.length) {
            setSessionLesson(
                buildReviewLesson(
                    dueCards,
                    Math.min(12, dueCards.length),
                    'Dnešní opakování',
                    'To nejdůležitější na dnešek.'
                )
            );
            return;
        }

        if (recommendedBand) {
            setSessionLesson(recommendedBand.lesson);
            return;
        }

        if (baseDeck) {
            setSessionLesson(buildFreshLesson(baseDeck.cards, 8, 'Lehký start', 'Prvních pár slov bez tlaku.'));
        }
    };

    const startNextStep = () => {
        if (!nextStepCards.length) {
            return;
        }

        setSessionLesson(
            buildFreshLesson(
                nextStepCards,
                Math.min(8, nextStepCards.length),
                recommendedBand ? `Nových 8 · ${recommendedBand.lesson.title}` : 'Dalších 8 slov',
                'Krátký krok dopředu v hlavní cestě.'
            )
        );
    };

    const handleStartQuickAction = (action) => {
        if (action.kind === 'review' && dueCards.length) {
            setSessionLesson(buildReviewLesson(dueCards, Math.min(action.size, dueCards.length), action.title, 'Krátké řízené opakování.'));
            return;
        }

        if (nextStepCards.length) {
            setSessionLesson(
                buildFreshLesson(nextStepCards, Math.min(action.size, nextStepCards.length), action.title, 'Krátká mobilní session bez rušení.')
            );
            return;
        }

        if (baseDeck) {
            setSessionLesson(buildFreshLesson(baseDeck.cards, Math.min(action.size, baseDeck.cards.length), action.title, 'Krátká mobilní session bez rušení.'));
        }
    };

    const handleSessionComplete = (lesson, summary) => {
        setProgress((currentProgress) => {
            const streakUpdate = computeStreak(currentProgress.lastStudiedAt);
            const shouldMarkCompleted = lesson.source === 'band';
            const nextCompleted = shouldMarkCompleted
                ? Array.from(new Set([...currentProgress.completedLessonIds, lesson.id]))
                : currentProgress.completedLessonIds;

            return {
                ...currentProgress,
                completedLessonIds: nextCompleted,
                sessionsCompleted: currentProgress.sessionsCompleted + 1,
                cardsReviewed: currentProgress.cardsReviewed + summary.reviewedCards,
                masteredCards: currentProgress.masteredCards + summary.goodCount + summary.easyCount,
                cardStats: buildUpdatedCardStats(currentProgress.cardStats || {}, summary.cardResults),
                streakDays:
                    streakUpdate === 'increment'
                        ? currentProgress.streakDays + 1
                        : streakUpdate === null
                            ? currentProgress.streakDays || 1
                            : streakUpdate,
                lastLessonId: lesson.id,
                lastLessonTitle: lesson.title,
                lastStudiedAt: new Date().toISOString(),
            };
        });

        const repeatCount = summary.againCount + summary.hardCount;
        setNotice({
            type: 'success',
            message: repeatCount > 0 ? `Session hotova. ${repeatCount} slov k zopakování.` : 'Skvělá práce. Session dokončena čistě.',
        });
    };

    const handleResetProgress = () => {
        setProgress(DEFAULT_PROGRESS);
        localStorage.removeItem(PROGRESS_STORAGE_KEY);
        setNotice({ type: 'success', message: 'Veškerý postup byl vymazán.' });
    };

    const handleMarkCardKnown = (cardId, known) => {
        const card = libraryCardMap.get(cardId);
        if (!card) {
            return;
        }

        const reviewedAt = new Date().toISOString();

        setProgress((currentProgress) => {
            const currentStats = currentProgress.cardStats || {};
            const previous = normalizeCardStat(cardId, currentStats[cardId]);
            const next = scheduleCardReview(previous, known ? 'easy' : 'again', reviewedAt);

            return {
                ...currentProgress,
                cardStats: {
                    ...currentStats,
                    [cardId]: {
                        ...next,
                        en: card.en || previous.en,
                        cz: card.cz || previous.cz,
                        lessonId: previous.lessonId || 'library',
                        lessonTitle: previous.lessonTitle || 'Slovní zásoba',
                    },
                },
            };
        });

        setNotice({
            type: 'success',
            message: known ? `Označeno jako umím: ${card.en}` : `Vráceno k procvičení: ${card.en}`,
        });
    };

    const appTitle = activeTab === 'home' ? 'Dnes' : activeTab === 'library' ? 'Slovíčka' : 'Nastavení';

    return (
        <div className="web-stage">
            <div className="app-shell">
                <SideNav activeTab={activeTab} onTabChange={setActiveTab} streakDays={progress.streakDays} />

                <div className="app-content">
                    <AnimatePresence mode="wait">
                        {sessionLesson ? (
                            <motion.div
                                key={sessionLesson.id}
                                className="app-session-layer"
                                initial={{ opacity: 0, scale: 1.02 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.02 }}
                                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                            >
                                <StudySession
                                    lesson={sessionLesson}
                                    onClose={() => setSessionLesson(null)}
                                    onComplete={(summary) => handleSessionComplete(sessionLesson, summary)}
                                />
                            </motion.div>
                        ) : (
                            <motion.div
                                key={activeTab}
                                className="app-screen"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                <header className="topbar">
                                    <div className="brand">
                                        <div className="brand__mark">
                                            <GraduationCap size={20} strokeWidth={2.5} />
                                        </div>
                                        <div>
                                            <span className="eyebrow">Gaba English</span>
                                            <strong className="brand__title">{appTitle}</strong>
                                        </div>
                                    </div>

                                    <div className="topbar__actions">
                                        <div className="streak-badge">
                                            <Flame size={14} strokeWidth={2.5} />
                                            {progress.streakDays || 0}
                                        </div>
                                    </div>
                                </header>

                                <main className="content-scroll">
                                    <AnimatePresence>{notice ? <NoticeToast notice={notice} /> : null}</AnimatePresence>

                                    {activeTab === 'home' ? (
                                        <>
                                            {libraryStatus === 'loading' ? <LoadingState /> : null}
                                            {libraryStatus === 'error' ? <ErrorState onRetry={() => setReloadToken((value) => value + 1)} /> : null}
                                            {libraryStatus === 'ready' && !baseDeck ? <EmptyState /> : null}

                                            {libraryStatus === 'ready' && baseDeck ? (
                                                <div className="home-layout">
                                                    <TodayHero
                                                        title={homeSummary.title}
                                                        subtitle={homeSummary.subtitle}
                                                        primaryLabel={homeSummary.primaryLabel}
                                                        secondaryLabel={homeSummary.secondaryLabel}
                                                        onPrimary={startToday}
                                                        onSecondary={startNextStep}
                                                        meta={heroMeta}
                                                    />

                                                    <JourneyCard progressPercent={globalProgressPercent} bandProgress={bandProgress} />

                                                    <section className="surface-card quick-actions-panel">
                                                        <div className="section-copy">
                                                            <h2>Rychlé volby</h2>
                                                            <p>Krátké bloky pro efektivní učení během dne.</p>
                                                        </div>
                                                        <div className="quick-actions-grid">
                                                            {quickActions.map((action) => (
                                                                <QuickActionCard key={action.id} action={action} onStart={handleStartQuickAction} />
                                                            ))}
                                                        </div>
                                                    </section>
                                                </div>
                                            ) : null}
                                        </>
                                    ) : null}

                                    {activeTab === 'library' ? (
                                        <VocabularyList cards={libraryCards} cardStats={cardStats} onMarkCardKnown={handleMarkCardKnown} />
                                    ) : null}

                                    {activeTab === 'settings' ? (
                                        <Settings
                                            progress={progress}
                                            onResetProgress={handleResetProgress}
                                            theme={theme}
                                            setTheme={setTheme}
                                            canInstall={canInstall}
                                            isInstalled={isInstalled}
                                            isIos={isIos}
                                            onInstall={install}
                                        />
                                    ) : null}
                                </main>

                                <MobileTabBar activeTab={activeTab} onTabChange={setActiveTab} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

export default App;
