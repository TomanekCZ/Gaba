import { motion } from 'framer-motion';

export function Button({ children, variant = 'primary', size = 'md', block = false, ...props }) {
  const baseClasses = 'btn';
  const variantClasses = `btn--${variant}`;
  const sizeClasses = `btn--${size}`;
  const blockClasses = block ? 'btn--block' : '';

  return (
    <motion.button
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${blockClasses}`}
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.02 }}
      {...props}
    >
      {children}
    </motion.button>
  );
}

export function IconButton({ icon: Icon, label, ...props }) {
  return (
    <motion.button
      className="btn btn--ghost"
      whileTap={{ scale: 0.9 }}
      aria-label={label}
      {...props}
    >
      <Icon size={24} />
    </motion.button>
  );
}