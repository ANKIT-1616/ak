import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { reveal } from '../lib/site';
import { useReducedMotion } from '../hooks/use-reduced-motion';

export function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : reveal.hidden}
      whileInView={reduced ? undefined : reveal.visible}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function SectionIntro({
  index,
  label,
  title,
  children,
}: {
  index: string;
  label: string;
  title?: string;
  children?: ReactNode;
}) {
  return (
    <div className="section-intro">
      <div className="section-kicker">
        <span className="lime-dot" aria-hidden="true" />
        <span>{index} / {label}</span>
      </div>
      {title && <h2 className="section-title">{title}</h2>}
      {children}
    </div>
  );
}
