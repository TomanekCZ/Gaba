import { useState, useEffect, useMemo } from 'react';
import { useProgress } from '../context/ProgressContext';
import { isCardDue, normalizeCardStat } from '../utils/srs';

export function useVocabulary(cards) {
  const { progress } = useProgress();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [visibleCount, setVisibleCount] = useState(24);

  // Calculate card statistics
  const cardStats = useMemo(() => {
    return cards.map((card) => {
      const statRaw = progress.cardStats?.[card.id];
      const stat = normalizeCardStat(card.id, statRaw || {});
      const isMastered = stat.lastRating === 'good' || stat.lastRating === 'easy';
      const isDue = Boolean(statRaw) && isCardDue(stat);
      const status = isDue ? 'review' : isMastered ? 'mastered' : 'new';

      return { card, stat, status, isMastered, strength: calculateStrength(stat, isMastered) };
    });
  }, [cards, progress.cardStats]);

  // Filter cards based on search and status
  const filteredCards = useMemo(() => {
    const query = search.trim().toLowerCase();
    return cardStats.filter(({ card, status }) => {
      const matchesSearch =
        !query ||
        card.en.toLowerCase().includes(query) ||
        card.cz.toLowerCase().includes(query);
      const matchesStatus = statusFilter === 'all' || status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [cardStats, search, statusFilter]);

  // Get visible cards (for pagination)
  const visibleCards = useMemo(
    () => filteredCards.slice(0, visibleCount),
    [filteredCards, visibleCount]
  );

  // Calculate learning statistics
  const stats = useMemo(() => {
    const learnedCount = Object.values(progress.cardStats || {}).filter(
      s => s.lastRating === 'good' || s.lastRating === 'easy'
    ).length;
    const totalCards = cards.length;
    const progressPercent = totalCards > 0 ? Math.round((learnedCount / totalCards) * 100) : 0;

    return { learnedCount, totalCards, progressPercent };
  }, [progress.cardStats, cards.length]);

  // Reset pagination when filters change
  useEffect(() => {
    setVisibleCount(24);
  }, [search, statusFilter]);

  const loadMore = () => setVisibleCount(prev => prev + 24);

  return {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    cardStats: filteredCards,
    visibleCards,
    stats,
    loadMore,
    hasMore: filteredCards.length > visibleCount,
  };
}

function calculateStrength(stat, isMastered) {
  return Math.max(
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
}