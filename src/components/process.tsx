import { ArrowDownRight } from 'lucide-react';
import { site } from '../content/site';
import { Reveal, SectionIntro } from './reveal';

export function Process() {
  return (
    <section className="process section-shell section-dark" id="process" aria-labelledby="process-title">
      <div className="process-heading">
        <Reveal>
          <SectionIntro index="04" label="THE PROCESS" />
        </Reveal>
        <Reveal delay={0.1}>
          <h2 id="process-title" className="display-stack compact">
            <span>FROM FIRST THOUGHT</span>
            <span>
              TO FINAL <span className="serif-accent">EXPERIENCE</span><span className="text-lime">.</span>
            </span>
          </h2>
        </Reveal>
      </div>

      <div className="process-track" role="list">
        {site.process.map((step, index) => (
          <Reveal key={step.number} delay={index * 0.08}>
            <div className="process-step" role="listitem">
              <span className="process-number">{step.number}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
              {index < site.process.length - 1 && (
                <ArrowDownRight className="process-arrow" size={24} aria-hidden="true" />
              )}
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
