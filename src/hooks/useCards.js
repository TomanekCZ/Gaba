import { useState, useEffect, useCallback } from 'react';
import { normalizeCard } from '../utils/cards';

const DATA_FILES = {
  general: '/data/slovicka-lite.json',
  dental: '/data/dental-vocabulary.json',
};

export function useCards() {
  const [cards, setCards] = useState([]);
  const [dentalCards, setDentalCards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadCards = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [generalResponse, dentalResponse] = await Promise.all([
        fetch(DATA_FILES.general),
        fetch(DATA_FILES.dental).catch(() => null),
      ]);

      if (!generalResponse.ok) {
        throw new Error('Failed to load vocabulary data');
      }

      const generalData = await generalResponse.json();
      const en5000 = generalData
        .filter(c => c.frequencyTag === 'EN-5000')
        .slice(0, 5000);

      setCards(en5000.map((c, i) => normalizeCard(c, i)));

      if (dentalResponse && dentalResponse.ok) {
        const dentalData = await dentalResponse.json();
        setDentalCards(dentalData.map((c, i) => normalizeCard(c, i)));
      }
    } catch (err) {
      console.error('Failed to load cards:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  const getAllCards = useCallback(() => {
    return [...cards, ...dentalCards];
  }, [cards, dentalCards]);

  return {
    cards,
    dentalCards,
    getAllCards,
    isLoading,
    error,
    reload: loadCards,
  };
}