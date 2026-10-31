import { motion } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight, Circle } from 'lucide-react';
import { site } from '../content/site';
import { useReducedMotion } from '../hooks/use-reduced-motion';
import { Reveal } from './reveal';

export function Hero() {
  const reduced = useReducedMotion();

  return (
    <section className="hero section-shell" id="top" aria-labelledby="hero-title">
      <div className="hero-media" aria-hidden="true">
        <img
          src="/assets/akon-hero.jpg"
          alt=""
          fetchPriority="high"
          width="1920"
          height="1080"
        />
        <div className="hero-media-overlay" />
        <div className="hero-crosshair hero-crosshair-one" />
        <div className="hero-crosshair hero-crosshair-two" />
      </div>

      <div className="hero-content">
        <Reveal className="hero-meta">
          <span className="hero-availability">
            <Circle size={7} fill="currentColor" className="text-lime animate-pulse" aria-hidden="true" />
            {site.availability}
          </span>
          <span className="hero-location">{site.founder} / {site.location}</span>
        </Reveal>

        <h1 id="hero-title" className="hero-title">
          <motion.span
            className="hero-line"
            initial={reduced ? false : { opacity: 0, y: 42 }}
            animate={reduced ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            {site.hero.headline[0]}
          </motion.span>
          <motion.span
            className="hero-line"
            initial={reduced ? false : { opacity: 0, y: 42 }}
            animate={reduced ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            {site.hero.headline[1]}
          </motion.span>
          <motion.span
            className="hero-line hero-line-accent"
            initial={reduced ? false : { opacity: 0, y: 42 }}
            animate={reduced ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="serif-accent">MATTER</span><span className="text-lime">.</span>
          </motion.span>
        </h1>

        <Reveal className="hero-bottom" delay={0.45}>
          <p className="hero-copy">{site.hero.supporting}</p>
          <div className="hero-actions">
            <a className="button button-solid" href="#work">
              Explore work <ArrowDownRight size={17} aria-hidden="true" />
            </a>
            <a className="button button-outline" href="#contact">
              Start a project <ArrowUpRight size={17} aria-hidden="true" />
            </a>
          </div>
        </Reveal>
      </div>

      <div className="hero-index" aria-hidden="true">
        SCROLL TO BUILD / 00—01
      </div>
    </section>
  );
}
