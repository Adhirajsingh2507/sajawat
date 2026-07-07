'use client';

/**
 * Scroll-reveal wrapper (PR-6). Fades + slides its children up the first time
 * they scroll into view, via Framer Motion's `whileInView`. Honors
 * `prefers-reduced-motion` (renders statically, no motion). Same API as before,
 * so existing callers keep working.
 */
import { motion, useReducedMotion } from 'framer-motion';

export function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();

  if (reduced === true) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: 'easeOut', delay: delay / 1000 }}
    >
      {children}
    </motion.div>
  );
}
