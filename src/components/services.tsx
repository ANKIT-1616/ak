import { AnimatePresence, motion } from 'framer-motion';
import { Minus, Plus } from 'lucide-react';
import { useState } from 'react';
import { site } from '../content/site';
import { useReducedMotion } from '../hooks/use-reduced-motion';
import { Reveal, SectionIntro } from './reveal';

export function Services() {
  const [active, setActive] = useState<string | null>('01');
  const reduced = useReducedMotion();

  const toggleService = (number: string) => {
    setActive((current) => (current === number ? null : number));
  };

  return (
    <section className="services section-shell section-dark" id="services" aria-labelledby="services-title">
      <div className="services-heading">
        <Reveal>
          <SectionIntro index="02" label="CAPABILITIES" />
        </Reveal>
        <Reveal delay={0.1}>
          <h2 id="services-title" className="display-stack compact">
            <span>IDEAS INTO</span>
            <span>
              DIGITAL <span className="serif-accent">REALITY</span><span className="text-lime">.</span>
            </span>
          </h2>
        </Reveal>
      </div>

      <div className="service-list" role="region" aria-label="Services list">
        {site.services.map((service) => {
          const isOpen = active === service.number;
          return (
            <motion.div
              layout={!reduced}
              className={`service-row ${isOpen ? 'is-open' : ''}`}
              key={service.number}
            >
              <button
                id={`service-trigger-${service.number}`}
                type="button"
                className="service-trigger"
                aria-expanded={isOpen}
                aria-controls={`service-panel-${service.number}`}
                onClick={() => toggleService(service.number)}
              >
                <span className="service-number">{service.number}</span>
                <span className="service-name">{service.title}</span>
                <span className="service-icon" aria-hidden="true">
                  {isOpen ? <Minus size={21} /> : <Plus size={21} />}
                </span>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    id={`service-panel-${service.number}`}
                    role="region"
                    aria-labelledby={`service-trigger-${service.number}`}
                    className="service-content"
                    initial={reduced ? false : { height: 0, opacity: 0 }}
                    animate={reduced ? undefined : { height: 'auto', opacity: 1 }}
                    exit={reduced ? undefined : { height: 0, opacity: 0 }}
                    transition={reduced ? { duration: 0 } : { duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <p>{service.description}</p>
                    <div className="service-items" role="list">
                      {service.items.map((item) => (
                        <span key={item} role="listitem">
                          {item}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
