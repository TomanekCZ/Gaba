import { createContext, useContext, useState, useEffect, useCallback } from 'react';

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
  perfectLessons: 0,
  goalsCompleted: 0,
  achievements: [],
};

const ProgressContext = createContext(null);

export function ProgressProvider({ children }) {
  const [progress, setProgress] = useState(DEFAULT_PROGRESS);
  const [isLoading, setIsLoading] = useState(true);

  // Load progress from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setProgress(prev => ({ ...prev, ...JSON.parse(stored) }));
      }
    } catch (error) {
      console.error('Failed to load progress:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save progress to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
      } catch (error) {
        console.error('Failed to save progress:', error);
      }
    }
  }, [progress, isLoading]);

  const updateProgress = useCallback((updates) => {
    setProgress(prev => ({ ...prev, ...updates }));
  }, []);

  const updateCardStat = useCallback((cardId, statUpdate) => {
    setProgress(prev => ({
      ...prev,
      cardStats: {
        ...prev.cardStats,
        [cardId]: {
          ...prev.cardStats[cardId],
          ...statUpdate,
        },
      },
    }));
  }, []);

  const resetProgress = useCallback(() => {
    setProgress(DEFAULT_PROGRESS);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear progress:', error);
    }
  }, []);

  const value = {
    progress,
    isLoading,
    updateProgress,
    updateCardStat,
    resetProgress,
  };

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
}