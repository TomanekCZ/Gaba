import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Home, BookOpen, User, Award, CheckCircle, X, Volume2, Play, ChevronRight } from 'lucide-react';
import { ProgressProvider } from './context/ProgressContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { ProgressRing } from './components/ProgressRing';
import { Button } from './components/ui/Button';
import Onboarding from './components/Onboarding';
import QuizScreen from './components/QuizScreen';
import SessionComplete from './components/SessionComplete';
import HomeScreen from './components/HomeScreen';
import VocabularyScreen from './components/VocabularyScreen';
import AchievementsScreen from './components/Achievements';
import ProfileScreen from './components/ProfileScreen';
import Confetti from './components/Confetti';
import { useCards } from './hooks/useCards';
import { useSession } from './hooks/useSession';
import { vibrate } from './utils/vibrate';

// Main App component
function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [showOnboarding, setShowOnboarding] = useState(
    () => !localStorage.getItem('gaba-onboarded')
  );
  const { cards, dentalCards, isLoading } = useCards();
  const { session, sessionResult, isActive, startSession, endSession, continueSession, exitSession } = useSession();
  const { theme, cycleTheme } = useTheme();
  const [newAchievements, setNewAchievements] = useState([]);
  const [showAchievementToast, setShowAchievementToast] = useState(null);

  // Handle onboarding completion
  const handleOnboardingComplete = useCallback((dailyGoal) => {
    localStorage.setItem('gaba-onboarded', 'true');
    setShowOnboarding(false);
  }, []);

  // Handle achievement notifications
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

  // Show loading screen
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Show onboarding for new users
  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="app-container">
      <SkipLink />
      <SessionOverlay
        session={session}
        sessionResult={sessionResult}
        isActive={isActive}
        onComplete={endSession}
        onContinue={continueSession}
        onExit={exitSession}
      />
      <MainContent
        activeTab={activeTab}
        onTabChange={setActiveTab}
        cards={cards}
        dentalCards={dentalCards}
        onStartSession={startSession}
        theme={theme}
        onCycleTheme={cycleTheme}
      />
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
      <AchievementToast achievement={showAchievementToast} />
    </div>
  );
}

// Skip link for accessibility
function SkipLink() {
  return (
    <a href="#main-content" className="skip-link">
      Přeskočit na obsah
    </a>
  );
}

// Loading screen
function LoadingScreen() {
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
        <div className="loading-screen__text" role="status">
          Načítám lekce...
        </div>
        <div className="loading-screen__progress">
          <div className="loading-screen__progress-bar" />
        </div>
      </div>
    </div>
  );
}

// Session overlay for quiz and results
function SessionOverlay({ session, sessionResult, isActive, onComplete, onContinue, onExit }) {
  return (
    <AnimatePresence>
      {session && !sessionResult && (
        <motion.div
          key="quiz"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000,
            background: 'var(--bg)',
          }}
        >
          <QuizScreen session={session} onComplete={onComplete} onExit={onExit} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Main content area
function MainContent({ activeTab, onTabChange, cards, dentalCards, onStartSession, theme, onCycleTheme }) {
  return (
    <AnimatePresence mode="wait">
      {activeTab === 'home' && (
        <ScreenWrapper key="home">
          <HomeScreen cards={cards} onStartSession={onStartSession} />
        </ScreenWrapper>
      )}

      {activeTab === 'vocabulary' && (
        <ScreenWrapper key="vocabulary">
          <VocabularyScreen cards={cards} />
        </ScreenWrapper>
      )}

      {activeTab === 'achievements' && (
        <ScreenWrapper key="achievements">
          <AchievementsScreen />
        </ScreenWrapper>
      )}

      {activeTab === 'profile' && (
        <ScreenWrapper key="profile">
          <ProfileScreen theme={theme} onCycleTheme={onCycleTheme} />
        </ScreenWrapper>
      )}
    </AnimatePresence>
  );
}

// Screen wrapper with animations
function ScreenWrapper({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
    >
      {children}
    </motion.div>
  );
}

// Tab bar navigation
function TabBar({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'vocabulary', icon: BookOpen, label: 'Slovíčka' },
    { id: 'achievements', icon: Award, label: 'Ocenení' },
    { id: 'profile', icon: User, label: 'Profil' },
  ];

  return (
    <nav className="tab-bar" role="tablist" aria-label="Hlavní navigace">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            className={`tab-item ${activeTab === tab.id ? 'is-active' : ''}`}
            onClick={() => {
              if (activeTab !== tab.id) vibrate(10);
              onTabChange(tab.id);
            }}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls="main-content"
            id={`tab-${tab.id}`}
          >
            <Icon aria-hidden="true" />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

// Achievement toast notification
function AchievementToast({ achievement }) {
  if (!achievement) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", bounce: 0.3 }}
        className="achievement-toast"
      >
        <div
          className="achievement-toast__icon"
          style={{ background: achievement.color }}
        >
          <Award size={24} color="#000" />
        </div>
        <div className="achievement-toast__content">
          <div className="achievement-toast__title">🎉 Odznak odemčen!</div>
          <div className="achievement-toast__description">{achievement.title}</div>
          <div className="achievement-toast__xp">+{achievement.xpReward} XP</div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Wrapped with providers
export default function AppWithProviders() {
  return (
    <ThemeProvider>
      <ProgressProvider>
        <App />
      </ProgressProvider>
    </ThemeProvider>
  );
}