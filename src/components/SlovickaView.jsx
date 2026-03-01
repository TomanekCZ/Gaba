import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCcw } from 'lucide-react';
import Flashcard from './Flashcard';
import { sampleItems } from '../utils/random';

export default function SlovickaView() {
    const [allCards, setAllCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [practiceSession, setPracticeSession] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [sessionComplete, setSessionComplete] = useState(false);

    // Fetch the 18MB JSON file once
    useEffect(() => {
        const controller = new AbortController();

        const fetchDeck = async () => {
            try {
                setError('');
                const response = await fetch('/data/slovicka.json', { signal: controller.signal });
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                const data = await response.json();
                setAllCards(data);
                startNewSession(data);
            } catch (err) {
                if (err.name === 'AbortError') {
                    return;
                }

                console.error("Failed to load Slovicka deck:", err);
                setError('Slovíčka se nepodařilo načíst.');
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };
        fetchDeck();

        return () => {
            controller.abort();
        };
    }, []);

    const startNewSession = (cardsArray = allCards) => {
        if (cardsArray.length === 0) return;

        setPracticeSession(sampleItems(cardsArray, 20));
        setCurrentIndex(0);
        setSessionComplete(false);
    };

    const handleSwipeResult = (cardId, result) => {
        // Result is 'left' (needs practice) or 'right' (knows it)
        if (currentIndex < practiceSession.length - 1) {
            setTimeout(() => setCurrentIndex(prev => prev + 1), 300);
        } else {
            // 2026 UX: Success haptic pattern indicating milestone completion
            if (window.navigator && window.navigator.vibrate) {
                window.navigator.vibrate([40, 60, 100, 40, 40]);
            }
            setTimeout(() => setSessionComplete(true), 300);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-6 w-full max-w-md mx-auto">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-100 opacity-20"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-indigo-400 animate-pulse" />
                    </div>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <p className="text-gray-500 font-medium tracking-tight">Synchronizace paměťových cest...</p>
                    <div className="w-32 h-1 bg-gray-200/50 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full animate-pulse w-full origin-left"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full max-w-md mx-auto mt-10 px-6 text-center">
                <p className="text-primary font-bold mb-2">Nepodařilo se načíst balík slovíček.</p>
                <p className="text-secondary">{error}</p>
            </div>
        );
    }

    if (!practiceSession.length) {
        return (
            <div className="w-full max-w-md mx-auto mt-10 px-6 text-center">
                <p className="text-primary font-bold mb-2">Nejsou k dispozici žádné karty.</p>
                <p className="text-secondary">Zkus obnovit data nebo importovat nový balík.</p>
            </div>
        );
    }

    if (sessionComplete) {
        return (
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="w-full max-w-md mx-auto flex flex-col items-center mt-12 p-8 glass rounded-[32px] shadow-card border border-white/60 text-center relative overflow-hidden"
            >
                {/* 2026 spatial ambient light effect */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-gradient-to-b from-emerald-400/20 to-transparent blur-2xl pointer-events-none" />
                
                <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                    className="w-20 h-20 bg-gradient-to-tr from-emerald-400 to-teal-400 rounded-[24px] flex items-center justify-center shadow-[0_12px_24px_rgba(52,199,89,0.3)] mb-6 z-10 border border-white/50"
                >
                    <Sparkles className="text-white" size={36} />
                </motion.div>
                
                <h2 className="text-3xl font-extrabold text-primary mb-3 z-10">Skvělá práce!</h2>
                <p className="text-secondary mb-8 z-10 text-base font-medium">Dokončil(a) jsi procvičování 20 náhodných slovíček. Tvůj mozek právě posílil nová neurální spojení.</p>
                
                <button
                    onClick={() => {
                        if (window.navigator && window.navigator.vibrate) {
                            window.navigator.vibrate([20, 30, 20]);
                        }
                        startNewSession();
                    }}
                    className="flex items-center justify-center gap-3 w-full py-4 bg-primary text-white rounded-2xl font-bold text-lg hover:bg-gray-800 transition-all active:scale-[0.98] shadow-md z-10"
                >
                    <RefreshCcw size={20} />
                    Pokračovat v tréninku
                </button>
            </motion.div>
        );
    }

    const currentCard = practiceSession[currentIndex];

    return (
        <div className="w-full flex justify-center px-4 relative">
            {/* 2026 Spatial Floating Progress Header */}
            <div className="absolute -top-14 left-0 right-0 flex justify-center z-30">
                <div className="glass px-5 py-2.5 rounded-full flex items-center gap-4 shadow-[0_8px_32px_rgba(0,0,0,0.06)] border border-white/80 backdrop-blur-2xl">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                        <span className="text-xs font-extrabold text-indigo-600 tracking-wider uppercase">
                            Slovíčka
                        </span>
                    </div>
                    <div className="w-px h-4 bg-gray-200" />
                    <div className="text-sm font-bold text-primary font-mono tracking-widest">
                        {currentIndex + 1} <span className="text-gray-400">/ {practiceSession.length}</span>
                    </div>
                </div>
            </div>

            <AnimatePresence mode="popLayout">
                {currentCard && (
                    <motion.div
                        key={currentCard.id}
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -20, transition: { duration: 0.2 } }}
                        className="w-full absolute"
                    >
                        <Flashcard card={currentCard} onSwipeResult={handleSwipeResult} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
