import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const COLORS = [
  '#32D74B', // Primary green
  '#0A84FF', // Secondary blue
  '#BF5AF2', // Accent purple
  '#FF9F0A', // Warning orange
  '#FFD60A', // Golden yellow
  '#FF453A', // Danger red
  '#FF2A85', // Pink
];

function ConfettiPiece({ index, total }) {
  const angle = (360 / total) * index;
  const velocity = 150 + Math.random() * 100;
  const color = COLORS[index % COLORS.length];
  const shape = Math.random() > 0.5 ? 'circle' : 'square';
  const size = 6 + Math.random() * 6;
  const rotation = Math.random() * 360;
  const delay = Math.random() * 0.3;

  return (
    <motion.div
      initial={{
        x: 0,
        y: 0,
        opacity: 1,
        scale: 0,
        rotate: 0,
      }}
      animate={{
        x: Math.cos((angle * Math.PI) / 180) * velocity,
        y: Math.sin((angle * Math.PI) / 180) * velocity + 100,
        opacity: [1, 1, 0],
        scale: [0, 1.2, 0.8],
        rotate: rotation + 720,
      }}
      transition={{
        duration: 1.5,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      style={{
        position: 'absolute',
        width: size,
        height: size,
        backgroundColor: color,
        borderRadius: shape === 'circle' ? '50%' : '2px',
        boxShadow: `0 0 8px ${color}`,
      }}
    />
  );
}

function ConfettiBurst({ onComplete }) {
  const pieces = 60;

  useEffect(() => {
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    >
      {Array.from({ length: pieces }).map((_, i) => (
        <ConfettiPiece key={i} index={i} total={pieces} />
      ))}
    </div>
  );
}

function ConfettiRain({ onComplete }) {
  const pieces = 100;

  useEffect(() => {
    const timer = setTimeout(onComplete, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 9999,
        overflow: 'hidden',
      }}
    >
      {Array.from({ length: pieces }).map((_, i) => (
        <motion.div
          key={i}
          initial={{
            y: -20,
            x: Math.random() * window.innerWidth,
            opacity: 1,
            rotate: 0,
          }}
          animate={{
            y: window.innerHeight + 20,
            opacity: [1, 1, 0],
            rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            delay: Math.random() * 1.5,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          style={{
            position: 'absolute',
            width: 8 + Math.random() * 6,
            height: 8 + Math.random() * 6,
            backgroundColor: COLORS[i % COLORS.length],
            borderRadius: Math.random() > 0.7 ? '50%' : '4px',
            boxShadow: `0 0 6px ${COLORS[i % COLORS.length]}`,
          }}
        />
      ))}
    </div>
  );
}

export function Confetti({ type = 'burst', onComplete }) {
  return (
    <AnimatePresence>
      {type === 'burst' ? (
        <ConfettiBurst onComplete={onComplete} />
      ) : (
        <ConfettiRain onComplete={onComplete} />
      )}
    </AnimatePresence>
  );
}

export default Confetti;
