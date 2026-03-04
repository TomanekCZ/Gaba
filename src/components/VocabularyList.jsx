import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ChevronDown, Circle, Clock3, Search, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTTS } from '../hooks/useTTS';
import { AVAILABLE_THEME_FILTERS, getThemeLabel } from '../utils/themes';

function statusForCard(card, cardStats) {
    const stat = cardStats[card.sourceCardId];
    if (!stat) {
        return 'new';
    }

    return stat.lastRating === 'good' || stat.lastRating === 'easy' ? 'mastered' : 'learning';
}

function SectionIcon({ status }) {
    if (status === 'mastered') {
        return <CheckCircle2 size={16} strokeWidth={2.5} />;
    }
    if (status === 'learning') {
        return <Clock3 size={16} strokeWidth={2.5} />;
    }
    return <Circle size={16} strokeWidth={2.5} />;
}

function sectionTitle(status) {
    if (status === 'mastered') {
        return 'Umím';
    }
    if (status === 'learning') {
        return 'Učím se';
    }
    return 'Nové';
}

export default function VocabularyList({ cards, cardStats, onMarkCardKnown }) {
    const PAGE_SIZE = 80;
    const [search, setSearch] = useState('');
    const deferredSearch = useDeferredValue(search);
    const [activeTheme, setActiveTheme] = useState('all');
    const [activeStatus, setActiveStatus] = useState('all');
    const [expandedSections, setExpandedSections] = useState({
        learning: true,
        new: true,
        mastered: false,
    });
    const [visibleCountBySection, setVisibleCountBySection] = useState({
        learning: PAGE_SIZE,
        new: PAGE_SIZE,
        mastered: PAGE_SIZE,
    });
    const { speak } = useTTS();

    const grouped = useMemo(() => {
        const normalizedSearch = deferredSearch.trim().toLowerCase();
        const sections = {
            learning: [],
            new: [],
            mastered: [],
        };

        cards.forEach((card) => {
            const matchesTheme = activeTheme === 'all' || card.themeId === activeTheme;
            const matchesSearch =
                !normalizedSearch ||
                card.en.toLowerCase().includes(normalizedSearch) ||
                card.cz.toLowerCase().includes(normalizedSearch);

            if (!matchesTheme || !matchesSearch) {
                return;
            }

            const status = statusForCard(card, cardStats);
            sections[status].push(card);
        });

        return sections;
    }, [cards, cardStats, deferredSearch, activeTheme]);

    const themeCounts = useMemo(() => {
        const counts = { all: cards.length };
        cards.forEach((card) => {
            const id = card.themeId || 'general';
            counts[id] = (counts[id] || 0) + 1;
        });
        return counts;
    }, [cards]);

    const themeOptions = useMemo(
        () =>
            AVAILABLE_THEME_FILTERS.map((theme) => ({
                ...theme,
                count: themeCounts[theme.id] || 0,
            })).filter((theme) => theme.count > 0),
        [themeCounts]
    );

    useEffect(() => {
        setVisibleCountBySection({
            learning: PAGE_SIZE,
            new: PAGE_SIZE,
            mastered: PAGE_SIZE,
        });
    }, [deferredSearch, activeTheme]);

    const statusChips = [
        { id: 'all', label: 'Vše' },
        { id: 'learning', label: 'K zopakování' },
        { id: 'new', label: 'Nová' },
        { id: 'mastered', label: 'Zvládnutá' },
    ];
    const sectionOrder = ['learning', 'new', 'mastered'].filter((status) => activeStatus === 'all' || status === activeStatus);
    const totalVisible = sectionOrder.reduce((sum, key) => sum + grouped[key].length, 0);

    const toggleSection = (key) => {
        setExpandedSections((current) => ({
            ...current,
            [key]: !current[key],
        }));
    };

    const showMore = (sectionKey) => {
        setVisibleCountBySection((current) => ({
            ...current,
            [sectionKey]: (current[sectionKey] || PAGE_SIZE) + PAGE_SIZE,
        }));
    };

    return (
        <section className="vocab-screen">
            <header className="vocab-header">
                <label className="vocab-search" htmlFor="vocab-search">
                    <Search size={17} strokeWidth={2.4} />
                    <input
                        id="vocab-search"
                        type="text"
                        placeholder="Hledat slovíčko"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                    />
                </label>
                <div className="vocab-filter-row">
                    <label className="vocab-select" htmlFor="theme-filter">
                        <span>Téma</span>
                        <select id="theme-filter" value={activeTheme} onChange={(event) => setActiveTheme(event.target.value)}>
                            {themeOptions.map((theme) => (
                                <option key={theme.id} value={theme.id}>
                                    {theme.label} ({theme.count})
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="vocab-select" htmlFor="status-filter">
                        <span>Stav</span>
                        <select id="status-filter" value={activeStatus} onChange={(event) => setActiveStatus(event.target.value)}>
                            {statusChips.map((chip) => (
                                <option key={chip.id} value={chip.id}>
                                    {chip.label}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
            </header>

            <div className="vocab-sections">
                {sectionOrder.map((sectionKey) => {
                    const sectionCards = grouped[sectionKey];
                    const isOpen = expandedSections[sectionKey];
                    const visibleCount = visibleCountBySection[sectionKey] || PAGE_SIZE;
                    const visibleCards = sectionCards.slice(0, visibleCount);
                    const hasMore = sectionCards.length > visibleCount;

                    if (!sectionCards.length) {
                        return null;
                    }

                    return (
                        <section key={sectionKey} className="vocab-section">
                            <button type="button" className="vocab-section__header" onClick={() => toggleSection(sectionKey)}>
                                <div className={`vocab-section__title vocab-status--${sectionKey}`}>
                                    <SectionIcon status={sectionKey} />
                                    <strong>{sectionTitle(sectionKey)}</strong>
                                    <span>{sectionCards.length}</span>
                                </div>
                                <ChevronDown
                                    size={16}
                                    strokeWidth={2.4}
                                    className={`vocab-section__chevron ${isOpen ? 'is-open' : ''}`}
                                />
                            </button>

                            <AnimatePresence initial={false}>
                                {isOpen ? (
                                    <motion.div
                                        className="vocab-list"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.2, ease: 'easeOut' }}
                                    >
                                        {visibleCards.map((card) => {
                                            const status = statusForCard(card, cardStats);
                                            const isKnown = status === 'mastered';
                                            const stat = cardStats[card.sourceCardId];
                                            const strength = Math.max(
                                                0,
                                                Math.min(
                                                    100,
                                                    stat
                                                        ? Math.round(
                                                            (Math.min(4, stat.reviewCount || 0) / 4) * 55 +
                                                            (Math.min(3.2, stat.ease || 1.3) - 1.3) * 22 +
                                                            (status === 'mastered' ? 18 : 0)
                                                        )
                                                        : 10
                                                )
                                            );

                                            return (
                                                <motion.article
                                                    layout
                                                    key={card.sourceCardId}
                                                    className="vocab-item"
                                                    initial={{ opacity: 0, y: 6 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -6 }}
                                                >
                                                    <div className="vocab-item__copy">
                                                        <div className="vocab-item__head">
                                                            <strong>{card.en}</strong>
                                                            <button
                                                                type="button"
                                                                className="vocab-item__speak"
                                                                onClick={() => speak(card.en, 'en-US')}
                                                                aria-label={`Přehrát ${card.en}`}
                                                            >
                                                                <Volume2 size={14} strokeWidth={2.4} />
                                                            </button>
                                                        </div>
                                                        <span>{card.cz}</span>
                                                        <em className="vocab-theme-label">{getThemeLabel(card.themeId)}</em>
                                                        <div className="vocab-strength" aria-label={`Síla zapamatování ${strength}%`}>
                                                            <span style={{ width: `${strength}%` }} />
                                                        </div>
                                                    </div>

                                                    <div className="vocab-item__actions">
                                                        <button
                                                            type="button"
                                                            className={`vocab-toggle ${isKnown ? 'is-secondary' : 'is-primary'}`}
                                                            onClick={() => onMarkCardKnown(card.sourceCardId, !isKnown)}
                                                        >
                                                            {isKnown ? 'Vrátit' : 'Umím'}
                                                        </button>
                                                    </div>
                                                </motion.article>
                                            );
                                        })}
                                        {hasMore ? (
                                            <div className="vocab-list__footer">
                                                <button
                                                    type="button"
                                                    className="vocab-load-more"
                                                    onClick={() => showMore(sectionKey)}
                                                >
                                                    Načíst další
                                                </button>
                                                <span>
                                                    {visibleCards.length}/{sectionCards.length}
                                                </span>
                                            </div>
                                        ) : null}
                                    </motion.div>
                                ) : null}
                            </AnimatePresence>
                        </section>
                    );
                })}
            </div>

            {totalVisible === 0 ? (
                <div className="vocab-empty">
                    <h3>Nic jsem nenašel</h3>
                    <p>Zkus jiný výraz.</p>
                </div>
            ) : null}
        </section>
    );
}
