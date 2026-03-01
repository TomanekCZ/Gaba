import { motion } from 'framer-motion';
import { Map, BookText } from 'lucide-react';

export default function DeckSelector({ currentMode, onChangeMode }) {
    const tabs = [
        { id: 'journey', label: 'Tvá cesta', icon: Map },
        { id: 'slovicka', label: 'Slovíčka', icon: BookText },
    ];

    return (
        <div className="flex justify-center w-full px-4 mb-6">
            <div className="relative flex w-full max-w-sm p-1 bg-gray-200/50 backdrop-blur-md rounded-2xl shadow-inner-light">
                {tabs.map((tab) => {
                    const isActive = currentMode === tab.id;
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => {
                                if (window.navigator && window.navigator.vibrate) {
                                    window.navigator.vibrate(20);
                                }
                                onChangeMode(tab.id);
                            }}
                            className={`relative flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-colors z-10 ${isActive ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'
                                }`}
                            style={{ WebkitTapHighlightColor: 'transparent' }}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="bubble"
                                    className="absolute inset-0 bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-white/80"
                                    transition={{ type: "spring", bounce: 0.25, duration: 0.6 }}
                                >
                                    <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white to-transparent opacity-50 shadow-inner" />
                                </motion.div>
                            )}
                            <span className="relative z-10 flex items-center gap-2">
                                <Icon size={18} />
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
