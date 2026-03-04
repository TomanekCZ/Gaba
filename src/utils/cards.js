/**
 * Card Utilities
 * Helper functions for card normalization and processing
 */

/**
 * Normalize card object
 * @param {Object} card - Raw card data
 * @param {number} index - Card index
 * @returns {Object}
 */
export function normalizeCard(card, index = 0) {
  return {
    id: card.id || `card-${index}`,
    en: card.en || '',
    cz: card.cz || '',
    meanings: Array.isArray(card.meanings) ? card.meanings : [],
    frequencyTag: card.frequencyTag || 'EN-5000',
    ...card,
  };
}

/**
 * Filter cards by frequency tag
 * @param {Array} cards - All cards
 * @param {string} tag - Frequency tag (e.g., 'EN-5000', 'EN-10000')
 * @returns {Array}
 */
export function filterByFrequency(cards, tag) {
  return cards.filter(card => card.frequencyTag === tag);
}

/**
 * Sort cards by criteria
 * @param {Array} cards - Cards to sort
 * @param {Object} options - Sort options
 * @returns {Array}
 */
export function sortCards(cards, options = {}) {
  const { sortBy = 'frequency', order = 'asc' } = options;

  const sorted = [...cards];

  switch (sortBy) {
    case 'alphabetical':
      sorted.sort((a, b) => {
        const comparison = a.en.localeCompare(b.en);
        return order === 'asc' ? comparison : -comparison;
      });
      break;

    case 'frequency':
      sorted.sort((a, b) => {
        const aPriority = getFrequencyPriority(a.frequencyTag);
        const bPriority = getFrequencyPriority(b.frequencyTag);
        return order === 'asc' ? aPriority - bPriority : bPriority - aPriority;
      });
      break;

    case 'recent':
      sorted.sort((a, b) => {
        if (!a.lastReviewedAt || !b.lastReviewedAt) return 0;
        const comparison = new Date(a.lastReviewedAt) - new Date(b.lastReviewedAt);
        return order === 'asc' ? comparison : -comparison;
      });
      break;

    default:
      break;
  }

  return sorted;
}

/**
 * Get frequency priority for sorting
 * @param {string} tag - Frequency tag
 * @returns {number}
 */
function getFrequencyPriority(tag) {
  const priorities = {
    'EN-1000': 1,
    'EN-5000': 2,
    'EN-10000': 3,
    'EN-20000': 4,
  };
  return priorities[tag] || 999;
}

/**
 * Search cards by text
 * @param {Array} cards - Cards to search
 * @param {string} query - Search query
 * @returns {Array}
 */
export function searchCards(cards, query) {
  if (!query || query.trim() === '') {
    return cards;
  }

  const normalizedQuery = query.toLowerCase().trim();

  return cards.filter(card => {
    return (
      card.en.toLowerCase().includes(normalizedQuery) ||
      card.cz.toLowerCase().includes(normalizedQuery) ||
      card.meanings.some(m => m.toLowerCase().includes(normalizedQuery))
    );
  });
}

/**
 * Get card statistics
 * @param {Array} cards - All cards
 * @param {Object} cardStats - Card statistics from progress
 * @returns {Object}
 */
export function getCardStatistics(cards, cardStats) {
  const total = cards.length;
  const learned = Object.values(cardStats || {}).filter(
    s => s.lastRating === 'good' || s.lastRating === 'easy'
  ).length;
  const inProgress = Object.keys(cardStats || {}).length;
  const new = total - inProgress;

  return {
    total,
    learned,
    inProgress,
    new,
    progressPercent: total > 0 ? Math.round((learned / total) * 100) : 0,
  };
}