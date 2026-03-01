import { motion } from 'framer-motion';
import { Check, Lock, Coffee, MessageCircle, Plane, Star } from 'lucide-react';

const iconMap = {
    Coffee,
    MessageCircle,
    Plane
};

export default function SagaMap({ lessons, userProgress, onStartLesson }) {
    // Find index of highest completed lesson to calculate progress line height
    const currentLessonIndex = lessons.findIndex(l => l.id === userProgress.currentLessonId);
    const progressPercentage = currentLessonIndex === -1 ? 100 : (currentLessonIndex / (lessons.length - 1)) * 100;

    return (
        <div className="w-full h-full flex flex-col items-center py-8 relative overflow-y-auto overflow-x-hidden bg-slate-50">

            {/* Structured Header for Map */}
            <div className="w-full px-6 mb-12 flex justify-between items-end mt-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-primary tracking-tight">Tvá cesta</h2>
                    <p className="text-secondary font-medium mt-1">Pokračuj ve studiu</p>
                </div>
                <div className="flex items-center gap-1.5 glass px-4 py-2 rounded-2xl shadow-[0_8px_16px_rgba(0,0,0,0.04)] border border-white/80 backdrop-blur-xl">
                    <Star size={20} className="text-amber-400 fill-amber-400 drop-shadow-sm" />
                    <span className="font-bold text-primary text-lg leading-none">{userProgress.completed.length}</span>
                </div>
            </div>

            <div className="relative z-10 w-full max-w-sm flex flex-col items-center pb-24">

                {/* Central Timeline Path (2026 Spatial Gradient) */}
                <div className="timeline-line bg-gray-200/50 shadow-inner">
                    <div
                        className="timeline-line-fill bg-gradient-to-b from-emerald-400 to-indigo-500 rounded-full"
                        style={{ height: `${progressPercentage}%`, boxShadow: '0 0 20px rgba(52,199,89,0.5)' }}
                    />
                </div>

                <div className="flex flex-col space-y-16 w-full">
                    {lessons.map((lesson, index) => {
                        const isCompleted = userProgress.completed.includes(lesson.id);
                        const isUnlocked = true; // isCompleted || lesson.id === userProgress.currentLessonId;
                        const isActive = lesson.id === userProgress.currentLessonId;
                        const IconComponent = iconMap[lesson.icon] || MessageCircle;

                        // 2026 UX: Organic S-curve path for the learning journey
                        const xOffset = Math.sin(index * 0.8) * 55;

                        return (
                            <motion.div
                                key={lesson.id}
                                initial={{ y: 40, opacity: 0, scale: 0.8 }}
                                animate={{ y: 0, opacity: 1, scale: 1, x: xOffset }}
                                transition={{ delay: index * 0.08, type: "spring", stiffness: 200, damping: 20 }}
                                className="relative flex flex-col items-center w-full z-10"
                                onClick={() => {
                                    if (isUnlocked) {
                                        if (window.navigator && window.navigator.vibrate) {
                                            window.navigator.vibrate([15, 30]); // Distinct layered haptic tap
                                        }
                                        onStartLesson(lesson.id);
                                    }
                                }}
                            >
                                {/* Unit Title & Desc (Above node) */}
                                <div className="text-center mb-4 px-4">
                                    <h3 className={`text-lg font-bold ${isActive ? 'text-primary drop-shadow-sm' : 'text-gray-500'}`}>
                                        Lekce {index + 1}: {lesson.title}
                                    </h3>
                                    <p className="text-xs text-gray-400 font-medium mt-1">
                                        {lesson.cards.length} slovíček a frází
                                    </p>
                                </div>

                                {/* Node Circle (2026 Spatial depth) */}
                                <motion.div
                                    whileHover={isUnlocked ? { scale: 1.05 } : {}}
                                    whileTap={isUnlocked ? { scale: 0.96 } : {}}
                                    className={`w-20 h-20 rounded-[2rem] flex items-center justify-center z-10 transition-all duration-300 relative
                                        ${isCompleted
                                            ? 'bg-gradient-to-tr from-emerald-500 to-emerald-400 text-white cursor-pointer shadow-[0_12px_32px_rgba(52,199,89,0.4)] border-2 border-white/40 backdrop-blur-md'
                                            : isUnlocked
                                                ? 'bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white cursor-pointer shadow-[0_16px_40px_rgba(0,122,255,0.5)] border-2 border-white/30 backdrop-blur-xl saturate-150'
                                                : 'glass text-gray-400 cursor-not-allowed border-2 border-white/60 shadow-sm'}
                                    `}
                                >
                                    {isCompleted ? (
                                        <Check size={32} strokeWidth={3} />
                                    ) : isUnlocked ? (
                                        <IconComponent size={32} strokeWidth={2.5} />
                                    ) : (
                                        <Lock size={28} />
                                    )}

                                    {/* Active Pulse Ring */}
                                    {isActive && (
                                        <div className="absolute inset-0 rounded-[2rem] border-[3px] border-indigo-400/60 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                                    )}
                                </motion.div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}