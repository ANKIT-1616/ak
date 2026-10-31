import { ArrowUpRight, Check } from 'lucide-react';
import { site } from '../content/site';
import { Reveal, SectionIntro } from './reveal';

export function SelectedWork() {
  const project = site.work;

  return (
    <section className="work section-shell" id="work" aria-labelledby="work-title">
      <div className="work-heading">
        <Reveal>
          <SectionIntro index="01" label="SELECTED WORK" />
        </Reveal>
        <Reveal delay={0.1}>
          <p id="work-title" className="work-title">{project.title}</p>
        </Reveal>
      </div>

      <Reveal className="project-card" delay={0.08}>
        <a
          className="project-visual"
          href={project.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Visit the ${project.project} live website (opens in new tab)`}
        >
          <img
            src="/assets/mooch-saloon.webp"
            alt="Mooch Saloon live website preview"
            loading="lazy"
            width="1280"
            height="800"
          />
          <div className="project-visual-shade" />
          <div className="project-visual-label">
            <span>LIVE PROJECT</span>
            <ArrowUpRight size={18} aria-hidden="true" />
          </div>
          <div className="project-visual-word">
            MOOCH<span className="text-lime">.</span>
          </div>
        </a>

        <div className="project-details">
          <div className="project-topline">
            <span>{project.category}</span>
            <span>{project.location}</span>
          </div>

          <h3>{project.project}</h3>
          <p className="project-description">{project.description}</p>

          <div className="project-detail-grid">
            <div>
              <span className="detail-label">DIRECTION</span>
              <p>{project.direction}</p>
            </div>
            <div>
              <span className="detail-label">DEVELOPMENT</span>
              <p>{project.development}</p>
            </div>
          </div>

          <div className="feature-list" aria-label="Project features" role="list">
            {project.features.map((feature) => (
              <span key={feature} role="listitem">
                <Check size={13} aria-hidden="true" />
                {feature}
              </span>
            ))}
          </div>

          <a
            className="text-link"
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>View live website</span>
            <ArrowUpRight size={16} aria-hidden="true" />
          </a>
        </div>
      </Reveal>
    </section>
  );
}
